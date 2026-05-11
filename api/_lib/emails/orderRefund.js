// api/_lib/emails/orderRefund.js
// Email envoyé au client après un remboursement par l'admin.

import {
  COLORS,
  RESTAURANT,
  esc,
  fmtCHF,
  orderShortId,
  htmlShell,
} from './_shared.js';

/**
 * @param {Object} order — ligne brute de la table orders (status='refunded').
 * @param {string|null} reason — motif optionnel saisi par l'admin.
 * @returns {{ subject:string, html:string, text:string }}
 */
export function buildRefundEmail(order, reason) {
  const shortId = orderShortId(order.id);
  const subject = `Remboursement de votre commande KaïKaï — #${shortId}`;

  const hasReason = !!(reason && String(reason).trim());

  // ── HTML ────────────────────────────────────────────────────────────
  const reasonBlock = hasReason
    ? `<div style="margin:18px 0;padding:14px 16px;border-left:3px solid ${COLORS.accent};background:rgba(212,255,107,0.06);border-radius:0 8px 8px 0;">
         <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.textMuted};margin-bottom:4px;">Motif</div>
         <div style="font-style:italic;color:${COLORS.text};">${esc(reason)}</div>
       </div>
       <p style="margin:0 0 16px 0;color:${COLORS.text};">
         Nous sommes désolés pour ce contretemps.
       </p>`
    : '';

  const bodyHtml = `
<p style="margin:0 0 12px 0;font-size:16px;">Bonjour ${esc(order.customer_name || '')},</p>
<p style="margin:0 0 20px 0;color:${COLORS.text};">
  Le remboursement de votre commande <strong>#${esc(shortId)}</strong> a bien été effectué.
</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 16px 0;border:1px solid ${COLORS.border};border-radius:8px;">
  <tr>
    <td style="padding:14px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.textMuted};">Commande</td>
          <td align="right" style="font-size:13px;color:${COLORS.text};">#${esc(shortId)}</td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;">
        <tr>
          <td style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.textMuted};">Montant remboursé</td>
          <td align="right" style="font-size:22px;font-weight:700;color:${COLORS.accent};font-variant-numeric:tabular-nums;">
            ${esc(fmtCHF(order.total))}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

${reasonBlock}

<p style="margin:18px 0 0 0;font-size:13px;color:${COLORS.textMuted};">
  Le montant sera crédité sur votre carte sous 3 à 5 jours ouvrés selon votre banque.
</p>
`;

  const html = htmlShell({ subject, bodyHtml });

  // ── Plain text fallback ─────────────────────────────────────────────
  const reasonText = hasReason
    ? `\nMotif : ${reason}\n\nNous sommes désolés pour ce contretemps.\n`
    : '';

  const text = [
    `KaïKaï — Remboursement #${shortId}`,
    '',
    `Bonjour ${order.customer_name || ''},`,
    '',
    `Le remboursement de votre commande #${shortId} a bien été effectué.`,
    '',
    `Montant remboursé : ${fmtCHF(order.total)}`,
    reasonText,
    'Le montant sera crédité sur votre carte sous 3 à 5 jours ouvrés selon votre banque.',
    '',
    `Une question ? ${RESTAURANT.phoneDisplay} · ${RESTAURANT.site}`,
    `${RESTAURANT.address}`,
  ].join('\n');

  return { subject, html, text };
}
