// api/sumup-webhook.js — Vercel Function
// Reçoit les webhooks SumUp Hosted Checkout (CHECKOUT_STATUS_CHANGED) et
// bascule l'order côté Supabase en fonction du vrai statut SumUp.
//
// SumUp ne signe PAS les webhooks (pas de HMAC sur Hosted Checkout). La
// recommandation officielle est : ne JAMAIS faire confiance au payload —
// toujours re-fetch GET /v0.1/checkouts/{id} avec la clé secrète pour
// confirmer le vrai statut.
//
// Format du payload SumUp :
//   { "event_type": "CHECKOUT_STATUS_CHANGED", "id": "<checkout_id>" }
//
// Statuts possibles d'un checkout (cf doc + GET checkout) :
//   PENDING  → on ne touche à rien (on attend le statut final)
//   PAID     → bascule l'order : status='paid', sumup_transaction_id=<...>
//   FAILED   → bascule l'order : status='failed'
//   EXPIRED  → bascule l'order : status='expired'
//
// Réponse : on retourne TOUJOURS HTTP 200 dès qu'on a fait notre travail
// (ou même si on n'a rien à faire) — sinon SumUp retry à 1m / 5m / 20m / 2h.
// On log les erreurs côté serveur (Vercel logs) pour debug ultérieur.

import { supabaseAdmin } from './_lib/supabaseServer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const eventType = body.event_type;
  const checkoutId = body.id;

  console.log('[KaïKaï webhook] reçu', { eventType, checkoutId });

  // On accepte uniquement CHECKOUT_STATUS_CHANGED — autres events ignorés
  // mais ack en 200 pour que SumUp ne retry pas.
  if (eventType !== 'CHECKOUT_STATUS_CHANGED' || !checkoutId) {
    return res.status(200).json({ ignored: true });
  }

  try {
    // 1. Re-fetch le checkout côté SumUp pour avoir le VRAI statut
    const sumupRes = await fetch(
      `https://api.sumup.com/v0.1/checkouts/${encodeURIComponent(checkoutId)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.SUMUP_SECRET_KEY}`,
        },
      }
    );

    if (!sumupRes.ok) {
      const errBody = await sumupRes.text();
      console.error('[KaïKaï webhook] GET checkout failed', sumupRes.status, errBody);
      // 200 quand même — pas la peine que SumUp retry, c'est un échec côté
      // notre clé/permissions, pas un échec réseau transitoire.
      return res.status(200).json({ error: 'sumup_fetch_failed' });
    }

    const checkout = await sumupRes.json();
    const status = checkout.status; // PENDING / PAID / FAILED / EXPIRED
    const transactionId = checkout.transaction_id || null;

    console.log('[KaïKaï webhook] checkout statut', { checkoutId, status, transactionId });

    // 2. Trouver l'order correspondant en DB.
    // Lookup primaire : sumup_checkout_id (posé par create-checkout).
    // Fallback : checkout_reference = order.id (si create-checkout a échoué
    // à persister sumup_checkout_id pour une raison X).
    let { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('id, status, sumup_transaction_id')
      .eq('sumup_checkout_id', checkoutId)
      .maybeSingle();

    if (!order && checkout.checkout_reference) {
      const fallback = await supabaseAdmin
        .from('orders')
        .select('id, status, sumup_transaction_id')
        .eq('id', checkout.checkout_reference)
        .maybeSingle();
      order = fallback.data;
      fetchErr = fallback.error;
    }

    if (fetchErr || !order) {
      console.error('[KaïKaï webhook] order introuvable', { checkoutId, fetchErr });
      // 200 quand même — l'order n'existe pas chez nous, retry inutile.
      return res.status(200).json({ error: 'order_not_found' });
    }

    // 3. Idempotence : si déjà traité, on ne refait rien.
    //    (SumUp peut envoyer le même webhook plusieurs fois.)
    if (status === 'PAID' && order.status === 'paid') {
      console.log('[KaïKaï webhook] déjà paid, idempotence', order.id);
      return res.status(200).json({ idempotent: true });
    }
    if (status === 'FAILED' && order.status === 'failed') {
      return res.status(200).json({ idempotent: true });
    }
    if (status === 'EXPIRED' && order.status === 'expired') {
      return res.status(200).json({ idempotent: true });
    }

    // 4. Appliquer la transition.
    let patch = null;
    if (status === 'PAID') {
      patch = {
        status: 'paid',
        sumup_transaction_id: transactionId,
      };
    } else if (status === 'FAILED') {
      patch = { status: 'failed' };
    } else if (status === 'EXPIRED') {
      patch = { status: 'expired' };
    } else {
      // PENDING ou autre : on ne touche à rien, on attend le statut final.
      console.log('[KaïKaï webhook] statut intermédiaire, no-op', status);
      return res.status(200).json({ noop: true });
    }

    // Garde-fou : ne pas écraser un order déjà accepted/ready/delivered/refunded.
    // Si le client a payé, l'admin a déjà commencé à traiter, et SumUp envoie
    // un webhook tardif "PAID" → on ignore (l'order a déjà transitionné).
    const PROTECTED = ['accepted', 'ready', 'delivered', 'refunded'];
    if (PROTECTED.includes(order.status)) {
      console.log('[KaïKaï webhook] order déjà avancé, no-op', order.id, order.status);
      return res.status(200).json({ already_advanced: true });
    }

    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update(patch)
      .eq('id', order.id);

    if (updateErr) {
      console.error('[KaïKaï webhook] update order échec', order.id, updateErr);
      // 500 ici → SumUp retry, ce qui est OK : c'est probablement
      // transitoire (DB momentanément indispo).
      return res.status(500).json({ error: 'db_update_failed' });
    }

    console.log('[KaïKaï webhook] order mis à jour', order.id, patch);
    return res.status(200).json({ updated: true, status: patch.status });
  } catch (err) {
    console.error('[KaïKaï webhook] exception', err);
    // 500 → SumUp retry. Si c'est une erreur déterministe (bug code), on
    // s'en rendra compte aux retries successifs dans les Vercel logs.
    return res.status(500).json({ error: 'internal' });
  }
}
