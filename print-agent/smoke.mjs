// ─── Smoke test print-agent ───────────────────────────────────────────
// Lancement : `node print-agent/smoke.mjs`
//
// Aucune dépendance imprimante, aucune dépendance Supabase. On stubbe :
//  - globalThis.fetch     → intercepte le POST ePOS-Print
//  - un faux client Supabase qui sert toujours la même commande factice
//
// Asserts :
//  1. printOrderTicket est appelé avec PRINTER_URL en http (pas https)
//  2. Le XML POST contient bien KaïKaï + le n° de commande
//  3. Une même commande n'est imprimée qu'UNE SEULE FOIS sur 2 ticks

/* global process */

import { runTick } from './agent.mjs';

const PRINTER_URL = 'http://192.168.1.103/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000';

const FAKE_ORDER = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  created_at: '2026-06-01T12:00:00.000Z',
  customer_name: 'Marie Test',
  customer_phone: '+41 79 000 00 00',
  customer_address: 'Bd de la Tour 1, 1205 Geneve',
  delivery_mode: 'pickup',
  payment_method: 'card',
  status: 'paid',
  items: [
    { id: '5', name: 'Chao Men', qty: 2, price: 18, subtotal: 36 },
  ],
  total: 36,
};

// ─── Faux client Supabase ─────────────────────────────────────────────
function makeFakeSupabase(orders) {
  return {
    from(/* table */) {
      let _orders = orders;
      const builder = {
        select() { return builder; },
        gt(_col, watermark) {
          _orders = _orders.filter((o) => o.created_at > watermark);
          return builder;
        },
        order() { return builder; },
        then(resolve) { resolve({ data: _orders, error: null }); },
      };
      return builder;
    },
  };
}

// ─── Stub fetch global ────────────────────────────────────────────────
const fetchCalls = [];
globalThis.fetch = async (url, opts) => {
  fetchCalls.push({ url, body: opts?.body });
  // Réponse Epson ePOS-Print "success" minimale.
  const ok = '<?xml version="1.0" encoding="utf-8"?>' +
    '<response xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print" ' +
    'success="true" code="" status="252"/>';
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    text: async () => ok,
  };
};

// ─── Run ──────────────────────────────────────────────────────────────
const state = {
  watermark: '2026-06-01T00:00:00.000Z',
  printedIds: new Set(),
};
const supabase = makeFakeSupabase([FAKE_ORDER]);

const logger = console;

console.log('— Tour 1 —');
const r1 = await runTick({ supabase, state, printerUrl: PRINTER_URL, statusFilter: null, logger });
console.log('Résultat tour 1 :', r1);

console.log('\n— Tour 2 (devrait NE rien réimprimer) —');
const r2 = await runTick({ supabase, state, printerUrl: PRINTER_URL, statusFilter: null, logger });
console.log('Résultat tour 2 :', r2);

// ─── Asserts ──────────────────────────────────────────────────────────
let failed = 0;

function check(label, cond, extra) {
  if (cond) {
    console.log(`✓ ${label}`);
  } else {
    console.error(`✗ ${label}${extra ? ' — ' + extra : ''}`);
    failed += 1;
  }
}

check('1 seul appel fetch après 2 ticks',
  fetchCalls.length === 1,
  `fetchCalls.length = ${fetchCalls.length}`);

check('fetch reçoit bien PRINTER_URL en http',
  fetchCalls[0]?.url === PRINTER_URL,
  `url reçu = ${fetchCalls[0]?.url}`);

check('le body POST contient "KaïKaï"',
  typeof fetchCalls[0]?.body === 'string' && fetchCalls[0].body.includes('Ka&#239;Ka&#239;') ||
  fetchCalls[0]?.body?.includes('KaïKaï') || fetchCalls[0]?.body?.includes('KAIKAI'),
  'pas trouvé dans le body');

check('le body POST contient le n° de commande (8 premiers chars en MAJ)',
  fetchCalls[0]?.body?.includes('AAAAAAAA'),
  'pas trouvé');

check('tour 1 : 1 imprimée, 0 échec',
  r1.printed === 1 && r1.failed === 0);

check('tour 2 : 0 imprimée, 0 échec (anti-doublon)',
  r2.printed === 0 && r2.failed === 0);

check('watermark avancé sur la commande',
  state.watermark === FAKE_ORDER.created_at,
  `watermark = ${state.watermark}`);

check('printedIds contient l\'id',
  state.printedIds.has(FAKE_ORDER.id));

console.log('\nXML envoyé (extrait) :');
console.log(String(fetchCalls[0]?.body).slice(0, 500) + '…');

process.exit(failed === 0 ? 0 : 1);
