// api/send-order-confirmation.js — Vercel Function
//
// Endpoint utilisé par le front pour déclencher l'email de confirmation
// d'une commande Cash/Twint (paiement carte = c'est le webhook qui s'en
// charge).
//
// Le front l'appelle en fire-and-forget après l'INSERT. Aucune logique
// métier ne dépend de la réponse — c'est best-effort total.
//
// Sécurité :
//   - Pas d'auth (le checkout client est anonyme). Le risque d'abus
//     (spam d'emails) est limité par :
//       a) Idempotence stricte (confirmation_email_sent_at)
//       b) Vérif que l'order existe ET appartient à un statut "déjà
//          posé en DB" (pending/paid) — pas d'envoi sur un id random.
//       c) L'attaquant ne peut pas changer le destinataire : on prend
//          customer_email tel que stocké en DB.

import { supabaseAdmin } from './_lib/supabaseServer.js';
import { sendEmail } from './_lib/resend.js';
import { buildOrderConfirmationEmail } from './_lib/emails/orderConfirmation.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order_id } = req.body || {};
  if (!order_id) {
    return res.status(400).json({ success: false, error: 'order_id manquant' });
  }

  try {
    // 1. Charger l'order (élargi pour le template)
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select(
        'id, status, payment_method, ' +
        'customer_name, customer_email, customer_phone, customer_address, ' +
        'items, total, delivery_mode, confirmation_email_sent_at, ' +
        'notes, note_kitchen, note_delivery'
      )
      .eq('id', order_id)
      .single();

    if (fetchErr || !order) {
      console.warn('[KaïKaï send-confirm] order introuvable', order_id, fetchErr);
      return res.status(404).json({ success: false, error: 'order_not_found' });
    }

    // 2. Garde-fous statut + méthode de paiement.
    //    On accepte 'card' dans la whitelist (idempotence couvre déjà
    //    le cas où le webhook a déjà envoyé), mais en pratique seul
    //    cash/twint déclenche cet endpoint.
    const ALLOWED_STATUSES = ['pending', 'paid'];
    const ALLOWED_METHODS = ['cash', 'twint', 'card'];
    if (!ALLOWED_STATUSES.includes(order.status)) {
      return res.status(409).json({
        success: false,
        error: `statut_invalide:${order.status}`,
      });
    }
    if (!ALLOWED_METHODS.includes(order.payment_method)) {
      return res.status(409).json({
        success: false,
        error: `methode_invalide:${order.payment_method}`,
      });
    }

    // 3. Garde-fous email.
    if (!order.customer_email) {
      console.warn('[KaïKaï send-confirm] pas d\'email client', order.id);
      return res.status(400).json({ success: false, error: 'no_customer_email' });
    }
    if (order.confirmation_email_sent_at) {
      console.log('[KaïKaï send-confirm] déjà envoyé', order.id);
      return res.status(200).json({ success: true, already_sent: true });
    }

    // 4. Envoi
    const { subject, html, text } = buildOrderConfirmationEmail(order);
    const mailRes = await sendEmail({
      to: order.customer_email,
      subject,
      html,
      text,
    });

    if (!mailRes.success) {
      console.error('[KaïKaï send-confirm] échec envoi', order.id, mailRes.error);
      return res.status(502).json({ success: false, error: mailRes.error });
    }

    // 5. Idempotence : marque l'envoi
    await supabaseAdmin
      .from('orders')
      .update({ confirmation_email_sent_at: new Date().toISOString() })
      .eq('id', order.id);

    console.log('[KaïKaï send-confirm] envoyé', order.id, mailRes.id);
    return res.status(200).json({ success: true, id: mailRes.id });
  } catch (err) {
    console.error('[KaïKaï send-confirm] exception', err);
    return res.status(500).json({ success: false, error: 'internal' });
  }
}
