// Tests du calcul serveur (api/_lib/orderTotal.js) et des règles de codes
// promo (src/lib/promoCodes.js). Lancer : npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeOrderTotal } from '../api/_lib/orderTotal.js';
import { checkPromo, isPromoAlreadyUsed, promoDiscount } from '../src/lib/promoCodes.js';
import { isLunchWindow } from '../src/lib/lunchOffer.js';

const pickup = (items) => ({ delivery_mode: 'pickup', items });
const delivery = (items) => ({ delivery_mode: 'delivery', items });

test('sans code : total = plats (+ livraison)', () => {
  const r = computeOrderTotal(delivery([{ id: '9', qty: 1 }]), '1205');
  assert.equal(r.subtotal, 22.9);
  assert.equal(r.discount, 0);
  assert.equal(r.deliveryFee, 4.9);
  assert.equal(r.total, 27.8);
});

test('PREMIER valide : −20 % des plats, hors livraison, arrondi 0.05', () => {
  const r = computeOrderTotal(delivery([{ id: '9', qty: 1 }]), '1205', 'PREMIER');
  assert.equal(r.discount, 4.6);        // 22.90 × 20 % = 4.58 → 4.60
  assert.equal(r.deliveryFee, 4.9);     // livraison non remisée
  assert.equal(r.total, 23.2);          // 22.90 − 4.60 + 4.90
  assert.equal(promoDiscount('premier ', 17.9), 3.6); // casse/espaces ignorés, 3.58 → 3.60
});

test('PREMIER expiré : refusé après le 30.11.2026 23:59 Genève', () => {
  assert.equal(checkPromo('PREMIER', Date.parse('2026-11-30T23:59:00+01:00')).ok, true);
  const r = checkPromo('PREMIER', Date.parse('2026-12-01T00:00:00+01:00'));
  assert.equal(r.ok, false);
  assert.equal(r.message, 'Ce code a expiré.');
});

test('PREMIER déjà utilisé : même téléphone OU même email sur une commande payée', () => {
  const rows = [
    { status: 'paid', customer_phone: '076 519 76 70', customer_email: 'a@b.ch' },
    { status: 'refused', customer_phone: '+41791112233', customer_email: 'x@y.ch' },
  ];
  assert.equal(isPromoAlreadyUsed(rows, '+41765197670', ''), true);   // 076… = +4176…
  assert.equal(isPromoAlreadyUsed(rows, '', ' A@B.CH '), true);
  assert.equal(isPromoAlreadyUsed(rows, '0791112233', ''), false);    // commande refusée : ne compte pas
  assert.equal(isPromoAlreadyUsed(rows, '0790000000', 'new@ch.ch'), false);
});

test('code inconnu refusé', () => {
  assert.equal(checkPromo('PROMO50').ok, false);
});

test('formule bureau : dès 5 plats chauds, livraison offerte', () => {
  const r = computeOrderTotal(delivery([{ id: '5', qty: 3 }, { id: '22', qty: 2, variants: [{ id: 'poulet' }, { id: 'poulet' }] }]), '1205');
  assert.equal(r.deliveryFee, 0);
  const r4 = computeOrderTotal(delivery([{ id: '5', qty: 4 }]), '1205');
  assert.equal(r4.deliveryFee, 4.9);
});

test('offre du midi : 14.90 et créneau 11h30–16h', () => {
  assert.equal(computeOrderTotal(pickup([{ id: '26', qty: 1, variants: [{ id: 'kaifan-poulet' }] }])).total, 14.9);
  assert.equal(isLunchWindow(new Date('2026-10-14T11:00:00Z')), true);  // 13h
  assert.equal(isLunchWindow(new Date('2026-10-14T15:00:00Z')), false); // 17h
});

test('NPA hors zone refusé', () => {
  assert.equal(computeOrderTotal(delivery([{ id: '9', qty: 1 }]), '9999').error, 'invalid_delivery_zone');
});
