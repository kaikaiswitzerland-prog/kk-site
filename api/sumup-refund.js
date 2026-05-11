// api/sumup-refund.js — Vercel Function
// Rembourse une commande payée carte via l'API SumUp.
//
// Endpoint SumUp officiel (cf doc) :
//   POST /v1.0/merchants/{merchant_code}/payments/{transaction_id}/refunds
//   Body : { "amount": <number> } optionnel — omis → refund total.
//   Response : 204 (empty body) en cas de succès.
//
// Auth : seuls les admins authentifiés (JWT Supabase valide) peuvent appeler
// cet endpoint. On valide le token côté serveur via getUser().

import { supabaseAdmin } from './_lib/supabaseServer.js';
import { sendEmail } from './_lib/resend.js';
import { buildRefundEmail } from './_lib/emails/orderRefund.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Auth check : JWT Supabase dans le header Authorization
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !userData?.user) {
    console.warn('[KaïKaï refund] auth invalide', authError);
    return res.status(401).json({ error: 'Token invalide' });
  }

  // 2. Lire l'order_id du body
  const { order_id, reason } = req.body || {};
  if (!order_id) {
    return res.status(400).json({ error: 'order_id manquant' });
  }

  try {
    // 3. Charger l'order et vérifier qu'elle est remboursable.
    //    SELECT élargi pour pouvoir construire l'email de refund derrière
    //    sans 2e aller-retour DB.
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select(
        'id, status, sumup_transaction_id, total, notes, ' +
        'customer_name, customer_email, refund_email_sent_at'
      )
      .eq('id', order_id)
      .single();

    if (fetchErr || !order) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }

    // Une commande est remboursable si elle a été payée carte (status paid
    // ou plus avancé) ET qu'on a un transaction_id SumUp à rembourser.
    const REFUNDABLE = ['paid', 'accepted', 'ready', 'delivered'];
    if (!REFUNDABLE.includes(order.status)) {
      return res.status(409).json({
        error: `Commande non remboursable (statut : ${order.status})`,
      });
    }
    if (!order.sumup_transaction_id) {
      return res.status(409).json({
        error: 'Aucun transaction_id SumUp — remboursement impossible',
      });
    }
    if (order.status === 'refunded') {
      return res.status(409).json({ error: 'Déjà remboursée' });
    }

    // 4. Appeler l'API SumUp refund
    const merchantCode = process.env.SUMUP_MERCHANT_CODE;
    const refundUrl =
      `https://api.sumup.com/v1.0/merchants/${encodeURIComponent(merchantCode)}` +
      `/payments/${encodeURIComponent(order.sumup_transaction_id)}/refunds`;

    const sumupRes = await fetch(refundUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUMUP_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      // Body vide → refund total. (On pourrait passer { amount } pour un
      // refund partiel, mais le scope du chantier 1 = refund total.)
      body: JSON.stringify({}),
    });

    // SumUp retourne 204 (empty) en cas de succès. Sur erreur, JSON dans
    // le body. On tente de parser proprement.
    if (!sumupRes.ok) {
      let errBody = null;
      try { errBody = await sumupRes.json(); } catch { errBody = await sumupRes.text(); }
      console.error('[KaïKaï refund] SumUp refund failed', sumupRes.status, errBody);
      return res.status(sumupRes.status).json({
        error: (errBody && errBody.message) || 'Échec refund SumUp',
      });
    }

    // 5. Marquer l'order remboursée
    // SumUp ne renvoie pas de refund_id (réponse 204 vide) — on stocke juste
    // refunded_at et le motif éventuel dans notes.
    const refundedAt = new Date().toISOString();
    const newNotes = reason
      ? (order.notes ? `${order.notes}\n[Refund ${refundedAt}] ${reason}` : `[Refund ${refundedAt}] ${reason}`)
      : order.notes;

    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'refunded',
        refunded_at: refundedAt,
        notes: newNotes,
      })
      .eq('id', order.id);

    if (updateErr) {
      console.error('[KaïKaï refund] DB update échec', updateErr);
      // Le refund SumUp a réussi mais on n'a pas pu marquer l'order. On
      // remonte une 500 pour que l'admin sache qu'il faut intervenir
      // manuellement (l'argent a bien été remboursé côté SumUp).
      return res.status(500).json({
        error: 'Refund SumUp OK mais update DB échoué — vérifier manuellement',
      });
    }

    // 6. Email de notification au client — best-effort, ne fait pas
    //    échouer le refund qui est déjà acté en DB.
    try {
      if (!order.customer_email) {
        console.warn('[KaïKaï mail refund] skip — pas d\'email client', order.id);
      } else if (order.refund_email_sent_at) {
        console.log('[KaïKaï mail refund] skip — déjà envoyé', order.id);
      } else {
        const { subject, html, text } = buildRefundEmail(order, reason);
        const mailRes = await sendEmail({
          to: order.customer_email,
          subject,
          html,
          text,
        });
        if (mailRes.success) {
          await supabaseAdmin
            .from('orders')
            .update({ refund_email_sent_at: new Date().toISOString() })
            .eq('id', order.id);
          console.log('[KaïKaï mail refund] envoyé', order.id, mailRes.id);
        } else {
          console.error('[KaïKaï mail refund] échec envoi', order.id, mailRes.error);
        }
      }
    } catch (mailErr) {
      console.error('[KaïKaï mail refund] exception', order.id, mailErr);
    }

    return res.status(200).json({ success: true, refunded_at: refundedAt });
  } catch (err) {
    console.error('[KaïKaï refund] exception', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
}
