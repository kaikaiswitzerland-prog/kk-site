// api/_lib/orderTotal.js
//
// Calcul SERVEUR du total d'une commande, sorti de api/create-checkout.js
// (14.10.2026) pour pouvoir le tester sans base ni SumUp
// (api/_lib/orderTotal.test.mjs).

import { getServerPrice, getServerUnitPrice } from './menuPrices.js';
import { getZoneByNpa } from './deliveryZones.js';
import { qualifiesFreeDelivery } from '../../src/lib/bureauOffer.js';
import { promoDiscount } from '../../src/lib/promoCodes.js';

// Recompute du total côté serveur — miroir de la logique du front
// (App.jsx:577). Les prix unitaires viennent de api/_lib/menuPrices.js
// (source de vérité serveur) et NON de items[].price reçu via l'INSERT
// anon — sinon un client peut payer 0.01 CHF en modifiant le price.
// Si un id du panier est inconnu côté serveur, on renvoie un sentinel
// pour que le caller renvoie 409.
//
// Pour le deliveryFee : on prend le NPA du body de la requête (pas de la
// DB — l'order ne stocke pas le NPA séparément, juste dans customer_address)
// et on regarde dans NOTRE table de zones. Si le client envoie un NPA bidon
// ou rien, on refuse.
export function computeOrderTotal(order, npa, promoCode = null) {
  const items = Array.isArray(order.items) ? order.items : [];

  let subtotal = 0;
  for (const it of items) {
    const serverPrice = getServerPrice(it?.id);
    if (typeof serverPrice !== 'number') {
      return { error: 'unknown_item', itemId: String(it?.id ?? '') };
    }
    // Recompute PAR EXEMPLAIRE, et non prix × qty : depuis le composeur de
    // woks, deux exemplaires du même plat peuvent porter des légumes
    // différents, donc des prix différents. Les exemplaires au-delà de
    // variants[] (ou sans légumes) retombent sur le prix plein — comportement
    // identique à l'ancien prix × qty pour tout le reste de la carte.
    //
    // qty est borné : un qty forgé à 10 000 gonflerait la boucle sans que le
    // client paie davantage, mais autant ne pas offrir le levier.
    const qty = Math.max(0, Math.min(Number(it?.qty || 0), 99));
    const variants = Array.isArray(it?.variants) ? it.variants : [];
    for (let k = 0; k < qty; k++) {
      const unit = getServerUnitPrice(it?.id, variants[k]);
      subtotal += typeof unit === 'number' ? unit : serverPrice;
    }
  }
  // Remise : uniquement un code promo DÉJÀ validé par le caller (connu, non
  // expiré, pas encore utilisé par ce client). L'ancien −10 % « Mode Île »
  // reste coupé. Calculée sur les plats seuls, hors livraison, arrondie à 0.05.
  subtotal = Math.round(subtotal * 100) / 100;
  const discount = promoCode ? promoDiscount(promoCode, subtotal) : 0;

  let deliveryFee = 0;
  if (order.delivery_mode === 'delivery' && subtotal > 0) {
    const zone = getZoneByNpa(npa);
    if (!zone) {
      // Sentinel : on signale "NPA invalide" au caller pour qu'il renvoie 409.
      return { error: 'invalid_delivery_zone' };
    }
    // Formule Bureau : dès 5 plats chauds, livraison offerte (zone toujours
    // vérifiée ci-dessus). Même règle que le front (src/lib/bureauOffer.js).
    deliveryFee = qualifiesFreeDelivery(items) ? 0 : zone.fee;
  }

  const total = Math.max(0, subtotal - discount) + deliveryFee;
  return { total: Math.round(total * 100) / 100, deliveryFee, subtotal, discount };
}
