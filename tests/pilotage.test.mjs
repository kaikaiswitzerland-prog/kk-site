import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computePilotage, mondayOf, genevaDay } from '../src/lib/admin/pilotage.js';

const now = new Date('2026-10-14T12:00:00Z'); // mercredi 14 oct., 14h Genève
const o = (id, iso, extra = {}) => ({ id, created_at: iso, status: 'delivered', total: 20, items: [], ...extra });

test('semaine du lundi, heure de Genève', () => {
  assert.equal(mondayOf('2026-10-14'), '2026-10-12');
  assert.equal(mondayOf('2026-10-12'), '2026-10-12');
  assert.equal(mondayOf('2026-10-18'), '2026-10-12');
  assert.equal(genevaDay('2026-10-13T22:30:00Z'), '2026-10-14'); // 00h30 à Genève
});

test('objectif : moyenne 7 jours site + plateformes', () => {
  const orders = [o('a', '2026-10-14T10:00:00Z'), o('b', '2026-10-10T10:00:00Z'), o('c', '2026-10-01T10:00:00Z'), o('r', '2026-10-14T10:00:00Z', { status: 'refused' })];
  const p = computePilotage(orders, { '2026-10-14': { uber: 4, justeat: 1 } }, now);
  assert.equal(p.objective.perDay, 1); // (2 site + 5 plateformes) / 7
  assert.equal(p.objective.sitePct, 29);
  assert.equal(p.objective.daysLeft, 76);
});

test('clients nouveaux vs qui reviennent, PREMIER revenus, midi, bureau', () => {
  const hot = [{ id: '5', qty: 5 }];
  const orders = [
    o('1', '2026-10-01T10:00:00Z', { customer_phone: '0791112233' }),
    o('2', '2026-10-13T10:00:00Z', { customer_phone: '+41 79 111 22 33' }),           // revient
    o('3', '2026-10-13T11:00:00Z', { customer_email: 'x@y.ch', promo_code: 'PREMIER', discount: 4.6, items: [{ id: '26', qty: 2 }, { id: '6', qty: 1 }] }), // nouveau, 13h
    o('4', '2026-10-14T09:00:00Z', { customer_email: 'X@Y.CH', items: hot }),          // revient (après PREMIER), bureau
  ];
  const p = computePilotage(orders, {}, now);
  assert.deepEqual(p.customers, { newCount: 1, returningCount: 1 });
  assert.deepEqual(p.promo, { used: 1, discountTotal: 4.6, cameBack: 1 });
  assert.deepEqual(p.lunch.thisWeek, { offer: 2, full: 1, offerPct: 67 }); // la commande de 11h00 (avant 11h30) ne compte pas
  assert.equal(p.bureau.count, 1);
});
