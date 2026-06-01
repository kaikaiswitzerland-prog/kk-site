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

// ─── Bilan ────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────');
if (failures === 0) {
  console.log(`✓ Tous les scénarios passent (${fetchCalls.length} fetch impression intercepté(s) au total).`);
  process.exit(0);
} else {
  console.error(`✗ ${failures} assertion(s) en échec.`);
  process.exit(1);
}
