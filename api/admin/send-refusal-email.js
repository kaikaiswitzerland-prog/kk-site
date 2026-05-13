// api/admin/send-refusal-email.js — Vercel Function
// Envoie l'email "commande annulée" au client après refus admin (chantier 7).
// L'UPDATE status='refused' a déjà été fait côté client via le hook
// useOrders.refuseOrder (RLS admin) ; cet endpoint sert uniquement à
// construire et envoyer l'email best-effort via Resend.
//
// Auth : JWT Supabase admin (Authorization: Bearer ...). Même pattern que
// api/admin/toggle-kitchen / toggle-item-stock.

import { supabaseAdmin } from '../_lib/supabaseServer.js';
import { sendEmail } from '../_lib/resend.js';
import { buildOrderRefusedEmail } from '../_lib/emails/orderRefused.js';

const VALID_REASONS = ['stock_out', 'out_of_zone', 'product_error', 'closed', 'other'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Auth check
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !userData?.user) {
    console.warn('[KaïKaï refusal-email] auth invalide', authError);
    return res.status(401).json({ error: 'Token invalide' });
  }

  // 2. Validation body
  const { orderId, reason, comment } = req.body || {};
  if (typeof orderId !== 'string' || !orderId.trim()) {
    return res.status(400).json({ error: '`orderId` requis' });
  }
  if (!VALID_REASONS.includes(reason)) {
    return res.status(400).json({ error: '`reason` invalide' });
  }
  const safeComment = typeof comment === 'string' ? comment.trim().slice(0, 500) : null;

  // 3. Charger l'order (besoin de items, total, customer_email, payment_method…)
  const { data: order, error: fetchError } = await supabaseAdmin
    .from('orders')
    .select('id, customer_name, customer_email, total, payment_method')
    .eq('id', orderId)
    .single();
  if (fetchError || !order) {
    console.error('[KaïKaï refusal-email] order introuvable', orderId, fetchError);
    return res.status(404).json({ error: 'Commande introuvable' });
  }

  if (!order.customer_email) {
    // Pas d'email client (commande cash/twint sans email saisi) — on log et
    // on renvoie OK pour ne pas faire planter le flow UI. Le refus DB a déjà
    // été appliqué côté client.
    console.log('[KaïKaï refusal-email] pas d\'email client, skip', orderId);
    return res.status(200).json({ success: true, skipped: 'no_email' });
  }

  // 4. Construire + envoyer
  const { subject, html, text } = buildOrderRefusedEmail({
    order,
    reason,
    comment: safeComment,
  });
  const sendResult = await sendEmail({
    to: order.customer_email,
    subject,
    html,
    text,
  });

  console.log(
    `[KaïKaï refusal-email] admin ${userData.user.email} sent to ${order.customer_email} ` +
    `for order #${String(order.id).slice(0, 8)} (reason=${reason}, success=${sendResult.success})`
  );

  if (!sendResult.success) {
    return res.status(502).json({ error: 'send_failed', detail: sendResult.error });
  }
  return res.status(200).json({ success: true, id: sendResult.id });
}
