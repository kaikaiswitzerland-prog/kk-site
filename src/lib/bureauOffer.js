// src/lib/bureauOffer.js
//
// Formule Bureau (action 17, 14.10.2026) : livraison offerte dès 5 plats
// chauds dans la même commande, quelle que soit la zone (le NPA doit quand
// même être en zone de livraison).
//
// Source UNIQUE de la règle : lue par le front (App.jsx, V2Drawer) ET par le
// serveur (computeOrderTotal dans api/create-checkout.js).

// Chao Men, Kai Fan, Omelette Fu Young, Wok de Bœuf, bases du composeur
// (21–24) et offre du midi (26).
export const BUREAU_HOT_IDS = ['5', '6', '7', '8', '21', '22', '23', '24', '26'];
export const BUREAU_MIN_HOT = 5;
export const BUREAU_LABEL = 'Livraison offerte (dès 5 woks)';

// items : [{ id, qty }] (panier du front ou orders.items côté serveur).
export function countHotDishes(items) {
  if (!Array.isArray(items)) return 0;
  let n = 0;
  for (const it of items) {
    if (!BUREAU_HOT_IDS.includes(String(it?.id))) continue;
    const q = Math.max(0, Math.min(Number(it?.qty || 0), 99));
    n += q;
  }
  return n;
}

export function qualifiesFreeDelivery(items) {
  return countHotDishes(items) >= BUREAU_MIN_HOT;
}
