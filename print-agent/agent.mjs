// ─── Print-agent KaïKaï ────────────────────────────────────────────────
// Démon local qui surveille la table `orders` Supabase et imprime
// automatiquement chaque nouvelle commande sur la TM-m30II via HTTP
// (pas de certificat à approuver, pas de blocage mixed-content navigateur).
//
// Ne tourne PAS en production : à lancer sur le PC/Mac cuisine, sur le même
// Wi-Fi que l'imprimante. Réutilise tel quel le module src/lib/eposPrint.js
// (XML ePOS-Print validé), ne réécrit pas la logique d'impression.

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

// Filtre de statut : null = imprime toute nouvelle commande (défaut demandé).
// Pour ne traiter qu'un sous-ensemble, mettre p.ex. ['pending', 'paid'].
const STATUS_FILTER = null;

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
// Persiste : watermark (ISO created_at de la dernière commande traitée) +
// liste des id imprimés depuis ce watermark (filet anti-doublon si une
// commande revient dans la prochaine fenêtre de polling).
async function loadState(statePath) {
  try {
    const raw = await readFile(statePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      watermark: parsed.watermark || new Date().toISOString(),
      printedIds: new Set(Array.isArray(parsed.printedIds) ? parsed.printedIds : []),
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Premier lancement : on ignore TOUT l'historique antérieur.
      return { watermark: new Date().toISOString(), printedIds: new Set() };
    }
    throw err;
  }
}

async function saveState(statePath, state) {
  // Garde-fou anti-bloat : on plafonne la liste d'ids à 500 entrées récentes.
  const ids = [...state.printedIds];
  const trimmed = ids.length > 500 ? ids.slice(-500) : ids;
  const payload = { watermark: state.watermark, printedIds: trimmed };
  await writeFile(statePath, JSON.stringify(payload, null, 2), 'utf8');
}

function shortId(id) {
  return String(id ?? '').slice(0, 8).toUpperCase();
}

function matchesStatusFilter(order, filter) {
  if (!filter) return true;
  return filter.includes(order.status);
}

// ─── Cœur métier (exporté pour le smoke test) ──────────────────────────
// Fait UN tour : lit les commandes après `state.watermark`, imprime celles
// qui ne l'ont pas été. Mute `state` en place. En cas d'échec imprimante,
// on stoppe le tour (très probablement printer offline → inutile de griller
// les commandes suivantes) ; le prochain tour réessaiera.
export async function runTick({ supabase, state, printerUrl, statusFilter, logger, printFn }) {
  const log = logger || console;
  const doPrint = printFn || printOrderTicket;

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gt('created_at', state.watermark)
    .order('created_at', { ascending: true });

  if (error) {
    log.error(`[print-agent] Erreur Supabase: ${error.message || error}`);
    return { printed: 0, failed: 0 };
  }
  if (!data || data.length === 0) return { printed: 0, failed: 0 };

  let candidateWatermark = state.watermark;
  let printed = 0;
  let failed  = 0;

  for (const order of data) {
    if (state.printedIds.has(order.id)) {
      // Déjà imprimée lors d'un tour précédent (filet anti-doublon) :
      // on avance le watermark candidat sans retenter.
      candidateWatermark = order.created_at;
      continue;
    }
    if (!matchesStatusFilter(order, statusFilter)) {
      // Hors filtre : on avance pour ne pas re-scanner ad vitam.
      candidateWatermark = order.created_at;
      continue;
    }

    log.log(
      `[print-agent] Nouvelle commande #${shortId(order.id)} — ` +
      `${order.customer_name || 'client'} ` +
      `(${order.payment_method || '?'}, ${order.status || '?'}) — impression…`
    );

    try {
      await doPrint(order, printerUrl);
      state.printedIds.add(order.id);
      candidateWatermark = order.created_at;
      printed += 1;
      log.log(`[print-agent] ✓ Ticket imprimé pour #${shortId(order.id)}`);
    } catch (err) {
      failed += 1;
      log.error(
        `[print-agent] ✗ Échec impression #${shortId(order.id)}: ` +
        `${err?.message || err}, réessai au prochain tour`
      );
      // On NE marque PAS imprimé, on N'AVANCE PAS le watermark, et on
      // sort de la boucle (la printer est probablement KO).
      break;
    }
  }

  if (candidateWatermark !== state.watermark) {
    state.watermark = candidateWatermark;
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

  console.log(`[print-agent] En attente de commandes…`);
  console.log(`[print-agent] Imprimante : ${PRINTER_URL}`);
  console.log(`[print-agent] Polling    : toutes les ${POLL_MS} ms`);
  console.log(`[print-agent] Watermark  : ${state.watermark}`);
  if (STATUS_FILTER) {
    console.log(`[print-agent] Filtre statut : ${STATUS_FILTER.join(', ')}`);
  }

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
        statusFilter: STATUS_FILTER,
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
