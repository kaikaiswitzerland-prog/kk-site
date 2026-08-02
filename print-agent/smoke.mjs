// ─── Smoke test print-agent ───────────────────────────────────────────
// Lancement : `node print-agent/smoke.mjs`
//
// Aucune dépendance imprimante, aucune dépendance Supabase. On stubbe :
//  - globalThis.fetch     → intercepte le POST ePOS-Print
//  - un faux client Supabase (select/in/is/not/gte/order/update/eq)
//
// Couvre les règles courantes :
//  · statut initial non payé ('pending') / négatif ('refused') → PAS imprimée
//  · statut confirmé ('accepted', etc.)                        → imprimée
//    UNE seule fois (anti-doublon printedIds sur 2 tours)
//  · reprint_at non null → imprimée + reprint_at remis à null +
//    pas de réimpression au tour suivant

/* global process */

import { runTick } from './agent.mjs';

const PRINTER_URL = 'http://192.168.1.103/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000';

// ─── Mock fetch (réponse Epson "success") ─────────────────────────────
const fetchCalls = [];
globalThis.fetch = async (url, opts) => {
  fetchCalls.push({ url, body: opts?.body });
  const okXml = '<?xml version="1.0" encoding="utf-8"?>' +
    '<response xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print" ' +
    'success="true" code="" status="252"/>';
  return { ok: true, status: 200, statusText: 'OK', text: async () => okXml };
};

// ─── Mock Supabase ────────────────────────────────────────────────────
// Builder thenable qui accepte select/in/is/not/gte/eq/order ; update mute
// les rows en place et trace les appels (updateCalls).
const updateCalls = [];
function makeFakeSupabase(rows) {
  return {
    from(/* table */) {
      const filters = [];
      let mode = 'select';
      let patch = null;

      const exec = () => {
        if (mode === 'select') {
          const data = rows.filter((r) => filters.every((fn) => fn(r)));
          return { data, error: null };
        }
        if (mode === 'update') {
          const matched = rows.filter((r) => filters.every((fn) => fn(r)));
          updateCalls.push({ patch: { ...patch }, matchedIds: matched.map((r) => r.id) });
          matched.forEach((r) => Object.assign(r, patch));
          return { data: null, error: null };
        }
        return { data: null, error: null };
      };

      const builder = {
        select() { mode = 'select'; return builder; },
        update(p) { mode = 'update'; patch = p; return builder; },
        gte(c, v) { filters.push((r) => r[c] >= v); return builder; },
        gt(c, v)  { filters.push((r) => r[c] > v);  return builder; },
        in(c, vs) { filters.push((r) => vs.includes(r[c])); return builder; },
        is(c, v)  { filters.push((r) => r[c] === v); return builder; },
        not(c, op, v) {
          if (op === 'is') filters.push((r) => r[c] !== v);
          return builder;
        },
        eq(c, v)  { filters.push((r) => r[c] === v); return builder; },
        order() { return builder; },
        then(resolve) { resolve(exec()); },
      };
      return builder;
    },
  };
}

function makeOrder(over = {}) {
  return {
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    created_at: new Date().toISOString(), // dans la fenêtre par défaut
    customer_name: 'Marie Test',
    customer_phone: '+41 79 000 00 00',
    customer_address: 'Bd de la Tour 1, 1205 Geneve',
    delivery_mode: 'pickup',
    payment_method: 'card',
    status: 'paid',
    reprint_at: null,
    items: [{ id: '5', name: 'Chao Men', qty: 2, price: 18, subtotal: 36 }],
    total: 36,
    ...over,
  };
}

// ─── Helpers asserts ──────────────────────────────────────────────────
let failures = 0;
function check(label, cond, extra) {
  if (cond) {
    console.log(`✓ ${label}`);
  } else {
    console.error(`✗ ${label}${extra ? ' — ' + extra : ''}`);
    failures += 1;
  }
}

async function runScenario(name, rows, options = {}) {
  console.log(`\n── Scénario : ${name} ──`);
  const state = { printedIds: new Set() };
  const supabase = makeFakeSupabase(rows);
  const fetchBefore = fetchCalls.length;
  const updateBefore = updateCalls.length;

  const r1 = await runTick({
    supabase, state, printerUrl: PRINTER_URL, logger: console, ...options,
  });
  const r2 = await runTick({
    supabase, state, printerUrl: PRINTER_URL, logger: console, ...options,
  });

  return {
    state,
    r1,
    r2,
    fetchOnRow: fetchCalls.slice(fetchBefore),
    updatesOnRow: updateCalls.slice(updateBefore),
    rows,
  };
}

// ─── Scénario 1 : statut initial non payé (pending) ──────────────────
{
  const res = await runScenario('pending → JAMAIS imprimée', [
    makeOrder({ id: 'p1111111-aaaa-bbbb-cccc-dddddddddddd', status: 'pending' }),
  ]);
  check('pending : 0 fetch', res.fetchOnRow.length === 0,
    `fetch = ${res.fetchOnRow.length}`);
  check('pending : printed=0 sur les 2 tours',
    res.r1.printed === 0 && res.r2.printed === 0);
}

// ─── Scénario 2 : statut accepted → 1 seule impression ────────────────
{
  const res = await runScenario('accepted → imprimée UNE seule fois sur 2 tours', [
    makeOrder({ id: 'a2222222-aaaa-bbbb-cccc-dddddddddddd', status: 'accepted' }),
  ]);
  check('accepted : 1 fetch après 2 tours',
    res.fetchOnRow.length === 1, `fetch = ${res.fetchOnRow.length}`);
  check('accepted : fetch reçoit PRINTER_URL http',
    res.fetchOnRow[0]?.url === PRINTER_URL);
  check('accepted : tour 1 imprime 1, tour 2 imprime 0',
    res.r1.printed === 1 && res.r2.printed === 0);
  check('accepted : printedIds contient l\'id',
    res.state.printedIds.has('a2222222-aaaa-bbbb-cccc-dddddddddddd'));
}

// ─── Scénario 3 : statut négatif (refused) → JAMAIS imprimée ─────────
{
  const res = await runScenario('refused → JAMAIS imprimée', [
    makeOrder({ id: 'r3333333-aaaa-bbbb-cccc-dddddddddddd', status: 'refused' }),
  ]);
  check('refused : 0 fetch', res.fetchOnRow.length === 0);
  check('refused : printed=0', res.r1.printed === 0 && res.r2.printed === 0);
}

// ─── Scénario 4 : reprint_at non null → impression + clear flag ───────
{
  const id = '44444444-aaaa-bbbb-cccc-dddddddddddd';
  const res = await runScenario(
    'reprint_at non null → imprimée + reprint_at remis à null',
    [
      // statut 'delivered' : déjà passé, l'utilisateur veut une copie
      makeOrder({
        id,
        status: 'delivered',
        reprint_at: new Date().toISOString(),
      }),
    ],
  );

  check('reprint : 1 fetch après 2 tours',
    res.fetchOnRow.length === 1, `fetch = ${res.fetchOnRow.length}`);
  check('reprint : update {reprint_at: null} appelé sur cet id',
    res.updatesOnRow.some(
      (u) => u.patch.reprint_at === null && u.matchedIds.includes(id),
    ));
  check('reprint : la row a reprint_at = null après le tour',
    res.rows[0].reprint_at === null,
    `reprint_at = ${res.rows[0].reprint_at}`);
  check('reprint : pas de double impression (tour 2 = 0)',
    res.r2.printed === 0);
}

// ─── Scénario 5 : pending_payment + paid (initiaux) → JAMAIS ─────────
{
  const res = await runScenario('pending_payment et paid → JAMAIS imprimés en auto', [
    makeOrder({ id: 'pp555555-aaaa-bbbb-cccc-dddddddddddd', status: 'pending_payment' }),
    makeOrder({ id: 'pd666666-aaaa-bbbb-cccc-dddddddddddd', status: 'paid' }),
  ]);
  check('pending_payment + paid : 0 fetch', res.fetchOnRow.length === 0);
}

// ══════════════════════════════════════════════════════════════════════
// RENDU DU TICKET — génération du XML SANS imprimer
// ══════════════════════════════════════════════════════════════════════
// Deux commandes de test passées à buildEposXml(), puis :
//   · audit automatique (débordement de colonnes, caractères hors ASCII,
//     échelles hors bornes 1..8, balises non fermées)
//   · aperçu texte pour juger la hiérarchie visuelle à l'œil

const { buildEposXml } = await import('../src/lib/eposPrint.js');

const COLS = { font_a: 48, font_b: 64, font_c: 72 };

// Parse les <text .../> du XML et recalcule la largeur disponible de chaque
// ligne selon sa police et son échelle — c'est exactement le piège que
// l'ancien LINE_WIDTH=64 global masquait.
function auditTicket(xml) {
  const lines = [];
  const violations = [];
  const re = /<text ([^>]*)>([\s\S]*?)<\/text>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const attrs = Object.fromEntries(
      [...m[1].matchAll(/(\w+)="([^"]*)"/g)].map((a) => [a[1], a[2]]),
    );
    const text = m[2]
      .replace(/&#10;$/, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    const font = attrs.font || 'font_b';
    const width = Number(attrs.width || 1);
    const height = Number(attrs.height || 1);
    const cols = Math.floor((COLS[font] || 64) / width);

    if (text.length > cols) {
      violations.push(`debordement (${text.length}>${cols} col, ${font} x${width}) : "${text}"`);
    }
    if (width < 1 || width > 8 || height < 1 || height > 8) {
      violations.push(`echelle hors bornes 1..8 : width=${width} height=${height}`);
    }
    if (/[^\x20-\x7E]/.test(text)) {
      violations.push(`caractere non-ASCII non replie : "${text}"`);
    }
    lines.push({ text, font, width, height, cols, reverse: attrs.reverse === 'true', em: attrs.em === 'true' });
  }
  return { lines, violations };
}

function preview(xml) {
  const { lines } = auditTicket(xml);
  const out = [];
  for (const l of lines) {
    const tag = `${l.font === 'font_a' ? 'A' : 'B'}${l.width > 1 ? `x${l.width}` : '  '}${l.reverse ? ' INV' : '    '}${l.em ? ' B' : '  '}`;
    out.push(`  ${tag} │ ${l.text}`);
  }
  return out.join('\n');
}

function checkTicket(label, order) {
  console.log(`\n── Ticket : ${label} ──`);
  const xml = buildEposXml(order);
  const { violations } = auditTicket(xml);

  check(`${label} : XML bien forme (balises text equilibrees)`,
    (xml.match(/<text /g) || []).length === (xml.match(/<\/text>/g) || []).length);
  check(`${label} : enveloppe SOAP + namespace epos-print`,
    xml.startsWith('<?xml version="1.0" encoding="utf-8"?>') &&
    xml.includes('http://www.epson-pos.com/schemas/2011/03/epos-print') &&
    xml.endsWith('</s:Envelope>'));
  check(`${label} : bandeau et mode en video inverse`,
    (xml.match(/reverse="true"/g) || []).length >= 2);
  check(`${label} : se termine par feed + cut`,
    xml.includes('<feed line="3"/><cut type="feed"/>'));
  check(`${label} : aucun debordement / non-ASCII / echelle invalide`,
    violations.length === 0, violations.join(' | '));

  console.log(preview(xml));
  return xml;
}

// Commande 1 — à emporter, 2 articles dont un avec choix de protéine.
checkTicket('a emporter', makeOrder({
  id: '7f3a9c21-1111-2222-3333-444444444444',
  delivery_mode: 'pickup',
  payment_method: 'card',
  status: 'paid',
  customer_name: 'Élodie Küng',
  customer_phone: '+41 79 123 45 67',
  note_kitchen: 'Sans coriandre s’il vous plaît',
  items: [
    {
      id: '5', name: 'Chao Men', qty: 2, price: 18.9, subtotal: 37.8,
      variants: [
        { id: 'porc', name: 'Porc', desc: 'Viande de porc mijotée façon KaïKaï' },
        { id: 'veggie', name: 'Veggie', desc: '100% végétarien' },
      ],
    },
    { id: '15', name: 'Coulant au chocolat', qty: 1, price: 9.9, subtotal: 9.9, variants: [] },
  ],
  total: 47.7,
}));

// Commande 2 — livraison avec formule Voyage (sous-lignes longues), adresse
// longue, notes cuisine ET livreur, paiement cash non encaissé.
checkTicket('livraison + formule', makeOrder({
  id: 'b2c4e6a8-5555-6666-7777-888888888888',
  delivery_mode: 'delivery',
  payment_method: 'cash',
  status: 'accepted',
  customer_name: 'Jean-Christophe de la Tour-Bergerac',
  customer_phone: '+41 78 987 65 43',
  customer_address: 'Avenue de Champel 123bis, appartement 4B, 3e étage, 1206 Genève',
  note_kitchen: 'Allergie arachides — attention au guacamole',
  note_delivery: 'Sonner chez « Bergerac », code portail 4512A',
  items: [
    {
      id: '14', name: 'Formule Voyage', qty: 1, price: 49.9, subtotal: 49.9,
      variants: [{
        type: 'voyage',
        plats: ['Chao Men', 'Kai Fan'],
        proteins: ['Porc + Poulet', 'Veggie'],
        boissons: ['Jus exotique', 'Eau'],
        jus: ['Ananas / Citron / Gingembre'],
        eau: ['Eau Gazeuse'],
        dessert: 'Crème Tropicale',
        coulisDessert: 'Coulis Fruits Rouges',
      }],
    },
    {
      id: '4', name: 'Tartare de thon rouge', qty: 3, price: 12.9, subtotal: 38.7,
      variants: [
        { id: 'tahiti', name: 'Tartare Tahiti', desc: 'Sauce coco' },
        { id: 'hawaii', name: 'Tartare Hawaï', desc: 'Sauce sésame, mangue et ananas' },
        { id: 'samoa', name: 'Tartare Samoa', desc: 'Sauce piment maison' },
      ],
    },
  ],
  total: 93.5,
}));

// ─── Bilan ────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────');
if (failures === 0) {
  console.log(`✓ Tous les scénarios passent (${fetchCalls.length} fetch impression intercepté(s) au total).`);
  process.exit(0);
} else {
  console.error(`✗ ${failures} assertion(s) en échec.`);
  process.exit(1);
}
