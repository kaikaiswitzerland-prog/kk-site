// api/create-checkout.js — Vercel Function
// Crée un checkout SumUp Hosted Checkout pour une commande déjà insérée en
// DB avec status='pending_payment'.
//
// FLOW :
//   1. Reçoit { order_id, redirect_url } du front (PAS de montant — on
//      recalcule côté serveur pour empêcher le price tampering).
//   2. Lit l'order en DB via le service_role (bypass RLS).
//   3. Recalcule le total à partir des items[] stockés (subtotal − 10% +
//      frais de livraison si applicable). On ignore order.total qui aurait
//      pu être altéré côté client.
//   4. Vérifie que status === 'pending_payment' (idempotence : si déjà
//      'paid' ou autre, on refuse).
//   5. Crée le checkout SumUp avec return_url (webhook) + redirect_url
//      (page succès navigateur).
//   6. Stocke sumup_checkout_id en DB (pour que le webhook retrouve l'order).
//   7. Renvoie { checkout_url } au front pour la redirection.

import { supabaseAdmin } from './_lib/supabaseServer.js';
import { getRestaurantStatus, formatStatusLabel } from './_lib/restaurantHours.js';
import { getZoneByNpa } from './_lib/deliveryZones.js';
import { getServerPrice, getServerUnitPrice } from './_lib/menuPrices.js';
import { MENU_ITEMS_BY_ID, isVariantUnavailable } from '../src/data/menuMeta.js';
import { isItemUnavailable } from '../src/lib/stockRules.js';

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
function computeOrderTotal(order, npa) {
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
  // TODO réactiver -10% quand Mode Île revient (cohérent avec couponApplied
  // côté front App.jsx). Tant que le programme membre est OFF, pas de remise.
  const discount = 0;

  let deliveryFee = 0;
  if (order.delivery_mode === 'delivery' && subtotal > 0) {
    const zone = getZoneByNpa(npa);
    if (!zone) {
      // Sentinel : on signale "NPA invalide" au caller pour qu'il renvoie 409.
      return { error: 'invalid_delivery_zone' };
    }
    deliveryFee = zone.fee;
  }

  const total = Math.max(0, subtotal - discount) + deliveryFee;
  return { total: Math.round(total * 100) / 100, deliveryFee, subtotal };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order_id, redirect_url, npa, noteKitchen, noteDelivery } = req.body || {};

  if (!order_id || !redirect_url) {
    return res.status(400).json({ error: 'Missing required fields (order_id, redirect_url)' });
  }

  try {
    // 0. Garde-fou anti-cheat : refuser le checkout si le restaurant est
    //    fermé. Sémantique 3 états de app_settings.kitchen_open :
    //      - true  → FORCE ouvert (bypass horaires, ex: ouverture lundi)
    //      - false → FORCE fermé (stop commandes)
    //      - null/absent → AUTO (suit les horaires)
    //    Politique fail-open sur erreur DB pour ne pas bloquer la chaîne
    //    paiement à cause d'un souci infra (manualOverride reste null → auto).
    let manualOverride = null;
    try {
      const { data: flag } = await supabaseAdmin
        .from('app_settings')
        .select('value')
        .eq('key', 'kitchen_open')
        .maybeSingle();
      if (flag && typeof flag.value === 'boolean') {
        manualOverride = flag.value;
      }
    } catch (flagErr) {
      console.warn('[KaïKaï create-checkout] lecture kitchen_open échec (fail-open auto)', flagErr);
    }

    if (manualOverride === false) {
      console.warn('[KaïKaï create-checkout] refus : kitchen_open=false', order_id);
      return res.status(409).json({
        error: 'kitchen_closed',
        message: 'Le restaurant est temporairement fermé.',
      });
    }

    // Check horaires UNIQUEMENT si pas de force-open admin (true bypass).
    if (manualOverride !== true) {
      const status = getRestaurantStatus();
      if (!status.isOpen) {
        console.warn('[KaïKaï create-checkout] refus : hors heures', order_id, status.reason);
        return res.status(409).json({
          error: 'closed_hours',
          message: formatStatusLabel(status),
        });
      }
    }

    // 1. Charger l'order
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, status, items, delivery_mode, payment_method')
      .eq('id', order_id)
      .single();

    if (fetchError || !order) {
      console.error('[KaïKaï] create-checkout: order introuvable', order_id, fetchError);
      return res.status(404).json({ error: 'Commande introuvable' });
    }

    // 2. Garde-fou : seul un order pending_payment peut créer un checkout.
    if (order.status !== 'pending_payment') {
      console.warn('[KaïKaï] create-checkout: status invalide', order.id, order.status);
      return res.status(409).json({ error: `Statut commande invalide : ${order.status}` });
    }

    if (order.payment_method !== 'card') {
      return res.status(400).json({ error: 'create-checkout réservé aux paiements carte' });
    }

    // 2.5. Garde-fou rupture : aucun item du panier ne doit être touché par
    // app_settings.out_of_stock_items (chantier 5), NI au niveau plat, NI au
    // niveau option ("5:porc"). On inspecte donc aussi items[].variants — y
    // compris les formules, dont les composants sont persistés par nom et
    // résolus en ids via les tables de menuMeta.js.
    //
    // Comme pour kitchen_open, on accepte un fail-open sur erreur DB pour ne
    // pas bloquer toute la chaîne paiement à cause d'un souci infra. Le flow
    // Cash/Twint n'a pas ce check côté serveur (cohérent avec chantiers 6/3/4
    // — décision business assumée).
    try {
      const { data: stockRow } = await supabaseAdmin
        .from('app_settings')
        .select('value')
        .eq('key', 'out_of_stock_items')
        .maybeSingle();
      const outList = Array.isArray(stockRow?.value)
        ? stockRow.value.filter(x => typeof x === 'string')
        : [];
      if (outList.length > 0 && Array.isArray(order.items)) {
        let blocked = null;
        let reason = null;

        for (const it of order.items) {
          const itemId = it?.id != null ? String(it.id) : '';
          if (!itemId) continue;

          // a. Plat entier : rupture explicite ou cascade (toutes options coupées).
          if (isItemUnavailable(outList, MENU_ITEMS_BY_ID[itemId])) {
            blocked = it;
            reason = itemId;
            break;
          }

          // b. Chaque exemplaire commandé, avec ses choix.
          const variants = Array.isArray(it?.variants) ? it.variants : [];
          const badVariant = variants.find(v => isVariantUnavailable(outList, itemId, v));
          if (badVariant) {
            blocked = it;
            reason = `${itemId} (option choisie)`;
            break;
          }
        }

        if (blocked) {
          console.warn('[KaïKaï create-checkout] refus : rupture', order.id, reason);
          return res.status(409).json({
            error: 'item_out_of_stock',
            itemId: String(blocked.id),
            message: `« ${blocked.name || 'Un plat'} » n'est plus disponible dans ce choix.`,
          });
        }
      }
    } catch (stockErr) {
      console.warn('[KaïKaï create-checkout] lecture out_of_stock échec (fail-open)', stockErr);
    }

    // 3. Recompute serveur (anti price-tampering + anti zone-tampering)
    const computed = computeOrderTotal(order, npa);
    if (computed.error === 'invalid_delivery_zone') {
      console.warn('[KaïKaï create-checkout] refus : NPA hors zone', order.id, { npa });
      return res.status(409).json({
        error: 'invalid_delivery_zone',
        message: 'Code postal hors zone de livraison',
      });
    }
    if (computed.error === 'unknown_item') {
      console.warn('[KaïKaï create-checkout] refus : item inconnu', order.id, computed.itemId);
      return res.status(409).json({
        error: 'unknown_item',
        itemId: computed.itemId,
        message: 'Un plat de la commande est introuvable.',
      });
    }
    const { total, deliveryFee, subtotal } = computed;
    if (total <= 0) {
      return res.status(400).json({ error: 'Total recalculé invalide' });
    }
    console.log(
      `[KaïKaï create-checkout] order=${order.id} mode=${order.delivery_mode} ` +
      `NPA=${npa || '-'} fee=${deliveryFee.toFixed(2)} subtotal=${subtotal.toFixed(2)} total=${total.toFixed(2)}`
    );

    // 4. Construire les URLs SumUp
    //   - return_url  : callback webhook (POST côté serveur)
    //   - redirect_url: redirection navigateur après paiement
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const webhookUrl = `${proto}://${host}/api/sumup-webhook`;

    // 5. Créer le checkout SumUp
    const sumupRes = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUMUP_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: total,
        currency: 'CHF',
        checkout_reference: order.id,
        description: `Commande KaïKaï #${String(order.id).slice(0, 8)}`,
        merchant_code: process.env.SUMUP_MERCHANT_CODE,
        return_url: webhookUrl,
        redirect_url,
        hosted_checkout: { enabled: true },
      }),
    });

    const sumupData = await sumupRes.json();

    if (!sumupRes.ok) {
      console.error('[KaïKaï] SumUp checkout error:', sumupData);
      return res.status(sumupRes.status).json({
        error: sumupData.message || 'Erreur SumUp',
      });
    }

    // 6. Persister sumup_checkout_id pour que le webhook puisse retrouver
    // l'order. On en profite pour re-poser note_kitchen / note_delivery
    // sanitized — anti-tampering de l'INSERT initial qui passe par RLS
    // anon sans validation contenu.
    const sanitize = (s, max) => String(s || '').trim().slice(0, max);
    const cleanedKitchen  = sanitize(noteKitchen, 500);
    const cleanedDelivery = order.delivery_mode === 'delivery'
      ? sanitize(noteDelivery, 200)
      : '';

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        sumup_checkout_id: sumupData.id,
        note_kitchen:  cleanedKitchen,
        note_delivery: cleanedDelivery,
      })
      .eq('id', order.id);

    if (updateError) {
      // On log mais on poursuit : si le webhook arrive sans avoir l'ID en DB,
      // il pourra fallback sur checkout_reference (= order.id) via re-fetch.
      console.error('[KaïKaï] create-checkout: échec persist checkout_id', updateError);
    }

    return res.status(200).json({ checkout_url: sumupData.hosted_checkout_url });
  } catch (err) {
    console.error('[KaïKaï] create-checkout exception:', err);
    return res.status(500).json({ error: 'Impossible de contacter SumUp' });
  }
}
