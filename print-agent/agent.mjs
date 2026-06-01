// ─── Print-agent KaïKaï ────────────────────────────────────────────────
// Démon local qui surveille la table `orders` Supabase et imprime
// les tickets sur la TM-m30II via HTTP (pas de cert à approuver, pas de
// blocage mixed-content navigateur).
//
// Deux flux d'impression :
//   A. AUTO : commandes RÉCENTES (fenêtre PRINT_WINDOW_HOURS) dont le
//      `status` est dans PRINT_STATUSES (= à partir du clic "Accepter").
//      Une commande non payée ou refusée ne s'imprime JAMAIS.
//   B. MANUEL : commandes où `reprint_at` est non null (poussé par le
//      bouton "Imprimer" de l'admin) → impression + remise à null.
//
// Ne tourne PAS en production : à lancer sur le PC/Mac cuisine, sur le même
// Wi-Fi que l'imprimante. Réutilise tel quel src/lib/eposPrint.js.

/* global process */

// Stub localStorage AVANT toute autre import : orderHelpers.js (tiré par
// eposPrint.js) n'en a pas besoin au chargement aujourd'hui, mais on garde
// le filet pour ne pas casser le démon si un helper migre vers localStorage.
globalThis.localStorage ??= {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { printOrderTicket } from '../src/lib/eposPrint.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const ENV_PATH   = path.join(__dirname, '.env.agent');
const STATE_PATH = path.join(__dirname, '.state.json');

const DEFAULT_PRINTER_URL =
  'http://192.168.1.103/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000';
const DEFAULT_POLL_MS = 5000;

// Statuts qui déclenchent l'auto-impression : à partir du clic "Accepter"
// dans l'admin (status='accepted') et tous les statuts positifs ultérieurs.
// On inclut tous les positifs (pas seulement 'accepted') pour ne pas rater
// une commande qui passerait rapidement de pending→ready si l'admin appuie
// sur "Prête" avant le tour suivant de l'agent. printedIds garantit ensuite
// l'unicité.
// NE PAS inclure : pending / paid / pending_payment (non confirmées),
// refused / refunded / failed / expired (négatifs).
const PRINT_STATUSES = ['accepted', 'ready', 'out_for_delivery', 'delivered', 'picked_up'];

// Fenêtre roulante pour l'auto-impression (en heures). Au-delà, on ne
// re-scanne plus l'historique — évite de réimprimer une vieille commande
// dont l'id aurait été évacué de printedIds (cap à 500).
const PRINT_WINDOW_HOURS = 24;

// ─── .env.agent ────────────────────────────────────────────────────────
// Format simple `CLE=valeur`, # pour les commentaires. Pas de dépendance
// dotenv : on évite d'ajouter un paquet juste pour 20 lignes de parsing.
async function loadEnvAgent(envPath) {
  let raw;
  try {
    raw = await readFile(envPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(
        `[print-agent] Fichier ${envPath} introuvable.\n` +
        `              Copie print-agent/.env.agent.example en print-agent/.env.agent ` +
        `et remplis SUPABASE_URL + SUPABASE_SERVICE_KEY.`
      );
      process.exit(1);
    }
    throw err;
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

// ─── State (.state.json) ───────────────────────────────────────────────
// Persiste : { printedIds: [...] } — la liste des ids déjà imprimés (auto
// ou manuel), pour ne jamais imprimer deux fois la même commande.
// (L'ancien champ `watermark` est ignoré s'il est présent : la fenêtre
// roulante now-PRINT_WINDOW_HOURS le remplace.)
async function loadState(statePath) {
  try {
    const raw = await readFile(statePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      printedIds: new Set(Array.isArray(parsed.printedIds) ? parsed.printedIds : []),
    };
  } catch (err) {
    if (err.code === 'ENOENT') return { printedIds: new Set() };
    throw err;
  }
}

async function saveState(statePath, state) {
  // Garde-fou anti-bloat : on plafonne la liste d'ids à 500 entrées récentes.
  const ids = [...state.printedIds];
  const trimmed = ids.length > 500 ? ids.slice(-500) : ids;
  const payload = { printedIds: trimmed };
  await writeFile(statePath, JSON.stringify(payload, null, 2), 'utf8');
}

function shortId(id) {
  return String(id ?? '').slice(0, 8).toUpperCase();
}

// ─── Cœur métier (exporté pour le smoke test) ──────────────────────────
// Fait UN tour : étape A (auto sur statuts confirmés) puis étape B
// (réimpressions manuelles). Mute `state` en place. En cas d'échec imprimante,
// on stoppe le tour (printer offline → inutile de griller les suivantes) ;
// le prochain tour réessaiera.
export async function runTick({
  supabase,
  state,
  printerUrl,
  printStatuses,
  windowHours,
  logger,
  printFn,
}) {
  const log         = logger        || console;
  const doPrint     = printFn       || printOrderTicket;
  const statuses    = printStatuses || PRINT_STATUSES;
  const winHours    = windowHours   ?? PRINT_WINDOW_HOURS;

  let printed = 0;
  let failed  = 0;

  // ── A. Auto-impression : commandes confirmées récentes ───────────────
  // Filtre serveur : created_at ≥ now - windowHours · status ∈ statuses ·
  // reprint_at IS NULL (les réimpressions manuelles sont traitées en B
  // pour ne pas dédoubler le print).
  const windowStart = new Date(Date.now() - winHours * 3600 * 1000).toISOString();
  const autoRes = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', windowStart)
    .in('status', statuses)
    .is('reprint_at', null)
    .order('created_at', { ascending: true });

  if (autoRes.error) {
    log.error(`[print-agent] Erreur Supabase (auto): ${autoRes.error.message || autoRes.error}`);
  } else if (Array.isArray(autoRes.data)) {
    for (const order of autoRes.data) {
      if (state.printedIds.has(order.id)) continue;
      log.log(
        `[print-agent] Commande confirmée #${shortId(order.id)} — ` +
        `${order.customer_name || 'client'} ` +
        `(${order.payment_method || '?'}, ${order.status}) — impression…`
      );
      try {
        await doPrint(order, printerUrl);
        state.printedIds.add(order.id);
        printed += 1;
        log.log(`[print-agent] ✓ Ticket imprimé pour #${shortId(order.id)}`);
      } catch (err) {
        failed += 1;
        log.error(
          `[print-agent] ✗ Échec impression #${shortId(order.id)}: ` +
          `${err?.message || err}, réessai au prochain tour`
        );
        // Printer probablement KO → on arrête l'étape A pour ce tour.
        return { printed, failed };
      }
    }
  }

  // ── B. Réimpressions manuelles (reprint_at non null) ─────────────────
  const reprintRes = await supabase
    .from('orders')
    .select('*')
    .not('reprint_at', 'is', null)
    .order('reprint_at', { ascending: true });

  if (reprintRes.error) {
    log.error(`[print-agent] Erreur Supabase (reprint): ${reprintRes.error.message || reprintRes.error}`);
  } else if (Array.isArray(reprintRes.data)) {
    for (const order of reprintRes.data) {
      log.log(
        `[print-agent] Réimpression demandée #${shortId(order.id)} — ` +
        `${order.customer_name || 'client'} — impression…`
      );
      try {
        await doPrint(order, printerUrl);
        // Marque imprimé AVANT de clear le flag : si l'étape A redécouvre
        // la commande au prochain tour (statut désormais 'accepted', flag
        // vidé), printedIds l'empêchera d'être ré-imprimée en auto.
        state.printedIds.add(order.id);

        const upd = await supabase
          .from('orders')
          .update({ reprint_at: null })
          .eq('id', order.id);
        if (upd && upd.error) {
          log.error(
            `[print-agent] ⚠ Ticket imprimé mais reprint_at non effacé pour ` +
            `#${shortId(order.id)}: ${upd.error.message || upd.error}`
          );
        }
        printed += 1;
        log.log(`[print-agent] ✓ Réimpression OK pour #${shortId(order.id)}`);
      } catch (err) {
        failed += 1;
        log.error(
          `[print-agent] ✗ Échec réimpression #${shortId(order.id)}: ` +
          `${err?.message || err}, réessai au prochain tour`
        );
        // Sur échec impression : on NE touche PAS reprint_at, le prochain
        // tour réessaiera. On arrête l'étape B pour ce tour.
        return { printed, failed };
      }
    }
  }

  return { printed, failed };
}

// ─── Boucle principale ────────────────────────────────────────────────
async function main() {
  await loadEnvAgent(ENV_PATH);

  const SUPABASE_URL         = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const PRINTER_URL          = process.env.PRINTER_URL || DEFAULT_PRINTER_URL;
  const POLL_MS              = Number(process.env.POLL_MS) || DEFAULT_POLL_MS;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error(
      '[print-agent] SUPABASE_URL et SUPABASE_SERVICE_KEY sont requis dans print-agent/.env.agent'
    );
    process.exit(1);
  }

  // Clé service = bypass RLS. C'est voulu : l'agent tourne en local, jamais
  // exposé. .env.agent et .state.json sont dans .gitignore.
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const state = await loadState(STATE_PATH);

  console.log(`[print-agent] En attente de commandes confirmées…`);
  console.log(`[print-agent] Imprimante      : ${PRINTER_URL}`);
  console.log(`[print-agent] Polling         : toutes les ${POLL_MS} ms`);
  console.log(`[print-agent] Statuts imprimés: ${PRINT_STATUSES.join(', ')}`);
  console.log(`[print-agent] Fenêtre auto    : ${PRINT_WINDOW_HOURS}h`);
  console.log(`[print-agent] Réimpressions   : déclenchées par reprint_at non null`);

  let stopping = false;
  const stop = (signal) => {
    if (stopping) return;
    stopping = true;
    console.log(`\n[print-agent] Signal ${signal} reçu, arrêt propre.`);
    process.exit(0);
  };
  process.on('SIGINT',  () => stop('SIGINT'));
  process.on('SIGTERM', () => stop('SIGTERM'));

  while (!stopping) {
    try {
      const result = await runTick({
        supabase,
        state,
        printerUrl: PRINTER_URL,
        printStatuses: PRINT_STATUSES,
        windowHours: PRINT_WINDOW_HOURS,
      });
      if (result.printed > 0 || result.failed > 0) {
        await saveState(STATE_PATH, state);
      }
    } catch (err) {
      // try/catch global pour ne JAMAIS planter le démon : on log et on
      // continue ; le prochain tour réessaiera.
      console.error(`[print-agent] Erreur inattendue: ${err?.stack || err}`);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

// Exécuté seulement quand le fichier est lancé directement (pas en import depuis smoke.mjs)
if (process.argv[1] === __filename) {
  await main();
}
