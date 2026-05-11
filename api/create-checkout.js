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

// Recompute du total côté serveur — miroir de la logique du front
// (App.jsx:519-522). On utilise items[].price tel que stocké en DB ; un
// durcissement ultérieur consisterait à dupliquer MENU côté serveur pour
// ignorer aussi item.price (mais le scope du chantier 1 est limité au
// recompute du total, pas des prix unitaires).
//
// Pour le deliveryFee : on prend le NPA du body de la requête (pas de la
// DB — l'order ne stocke pas le NPA séparément, juste dans customer_address)
// et on regarde dans NOTRE table de zones. Si le client envoie un NPA bidon
// ou rien, on refuse.
function computeOrderTotal(order, npa) {
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = items.reduce(
    (s, it) => s + Number(it.price || 0) * Number(it.qty || 0),
    0
  );
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

  const { order_id, redirect_url, npa } = req.body || {};

  if (!order_id || !redirect_url) {
    return res.status(400).json({ error: 'Missing required fields (order_id, redirect_url)' });
  }

  try {
    // 0. Garde-fou anti-cheat : refuser le checkout si le restaurant est
    //    fermé. On vérifie d'abord le flag manuel (kitchen_open), puis les
    //    horaires automatiques. Politique fail-open sur erreur DB pour ne
    //    pas bloquer toute la chaîne paiement à cause d'un souci infra.
    try {
      const { data: flag } = await supabaseAdmin
        .from('app_settings')
        .select('value')
        .eq('key', 'kitchen_open')
        .maybeSingle();
      if (flag && flag.value === false) {
        console.warn('[KaïKaï create-checkout] refus : kitchen_open=false', order_id);
        return res.status(409).json({
          error: 'kitchen_closed',
          message: 'Le restaurant est temporairement fermé.',
        });
      }
    } catch (flagErr) {
      console.warn('[KaïKaï create-checkout] lecture kitchen_open échec (fail-open)', flagErr);
    }

    const status = getRestaurantStatus();
    if (!status.isOpen) {
      console.warn('[KaïKaï create-checkout] refus : hors heures', order_id, status.reason);
      return res.status(409).json({
        error: 'closed_hours',
        message: formatStatusLabel(status),
      });
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

    // 3. Recompute serveur (anti price-tampering + anti zone-tampering)
    const computed = computeOrderTotal(order, npa);
    if (computed.error === 'invalid_delivery_zone') {
      console.warn('[KaïKaï create-checkout] refus : NPA hors zone', order.id, { npa });
      return res.status(409).json({
        error: 'invalid_delivery_zone',
        message: 'Code postal hors zone de livraison',
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

    // 6. Persister sumup_checkout_id pour que le webhook puisse retrouver l'order
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ sumup_checkout_id: sumupData.id })
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
