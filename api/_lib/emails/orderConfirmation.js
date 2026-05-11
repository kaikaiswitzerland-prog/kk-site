// api/_lib/emails/orderConfirmation.js
// Construit le sujet + HTML + texte de l'email de confirmation de commande.

import {
  COLORS,
  RESTAURANT,
  esc,
  fmtCHF,
  orderShortId,
  renderVariantLines,
  htmlShell,
} from './_shared.js';

// ETA en minutes. Aligné avec RESTAURANT_INFO.deliveryTime/prepTime côté
// front (src/App.jsx). À garder synchronisés à la main.
const ETA = {
  delivery: '30-45',
  pickup:   '20-25',
};

/**
 * @param {Object} order — ligne brute de la table orders Supabase.
 * @returns {{ subject:string, html:string, text:string }}
 */
export function buildOrderConfirmationEmail(order) {
  const shortId = orderShortId(order.id);
  const subject = `Commande KaïKaï confirmée — #${shortId}`;
  const items = Array.isArray(order.items) ? order.items : [];
  const isDelivery = order.delivery_mode === 'delivery';
  const etaMinutes = isDelivery ? ETA.delivery : ETA.pickup;
  const etaLabel = isDelivery
    ? `Livraison estimée dans ${etaMinutes} min.`
    : `Prête à emporter dans ${etaMinutes} min.`;

  // ── HTML ────────────────────────────────────────────────────────────
  const itemsRows = items.map((it) => {
    const qty = Number(it?.qty ?? 1);
    const subtotal = it?.subtotal ?? (Number(it?.price ?? 0) * qty);
    const variants = renderVariantLines(it?.variants);
    const variantsHtml = variants.length > 0
      ? `<div style="margin-top:6px;padding-left:8px;border-left:2px solid ${COLORS.border};font-size:12px;color:${COLORS.textMuted};">
           ${variants.map((line) => `<div>· ${esc(line)}</div>`).join('')}
         </div>`
      : '';
    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${COLORS.border};vertical-align:top;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="font-size:14px;color:${COLORS.text};">
                <strong style="color:${COLORS.accent};">${qty}×</strong> ${esc(it?.name || '—')}
              </td>
              <td align="right" style="font-size:14px;color:${COLORS.text};font-variant-numeric:tabular-nums;white-space:nowrap;">
                ${esc(fmtCHF(subtotal))}
              </td>
            </tr>
          </table>
          ${variantsHtml}
        </td>
      </tr>`;
  }).join('');

  const modeBlock = isDelivery
    ? `<div style="margin-top:20px;padding:14px;border:1px solid ${COLORS.border};border-radius:8px;">
         <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.textMuted};margin-bottom:4px;">Livraison à</div>
         <div style="font-size:14px;color:${COLORS.text};">${esc(order.customer_address || '')}</div>
       </div>`
    : `<div style="margin-top:20px;padding:14px;border:1px solid ${COLORS.border};border-radius:8px;">
         <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.textMuted};margin-bottom:4px;">À retirer chez nous</div>
         <div style="font-size:14px;color:${COLORS.text};">${esc(RESTAURANT.address)}</div>
       </div>`;

  // Blocs notes — affichés uniquement si non vides. Palette identique au
  // modeBlock pour cohérence visuelle.
  const noteBlock = (icon, title, body) => `
    <div style="margin-top:12px;padding:14px;border:1px solid ${COLORS.border};border-radius:8px;">
      <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.textMuted};margin-bottom:6px;">${icon} ${title}</div>
      <div style="font-size:14px;color:${COLORS.text};white-space:pre-wrap;">${esc(body)}</div>
    </div>`;
  const notesHtml = [
    order.note_kitchen  && noteBlock('👨‍🍳', 'Note transmise à la cuisine', order.note_kitchen),
    isDelivery && order.note_delivery && noteBlock('🚴', 'Note pour le livreur', order.note_delivery),
  ].filter(Boolean).join('');

  const bodyHtml = `
<p style="margin:0 0 12px 0;font-size:16px;">Bonjour ${esc(order.customer_name || '')},</p>
<p style="margin:0 0 20px 0;color:${COLORS.text};">
  Votre commande a bien été reçue. Merci !
</p>

<div style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.textMuted};">
  Commande #${esc(shortId)}
</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;">
  ${itemsRows}
  <tr>
    <td style="padding:14px 0 0 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.textMuted};">Total</td>
          <td align="right" style="font-size:22px;font-weight:700;color:${COLORS.accent};font-variant-numeric:tabular-nums;">
            ${esc(fmtCHF(order.total))}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

${modeBlock}
${notesHtml}

<p style="margin:20px 0 0 0;font-size:13px;color:${COLORS.textMuted};">
  ${esc(etaLabel)}
</p>
`;

  const html = htmlShell({ subject, bodyHtml });

  // ── Plain text fallback ─────────────────────────────────────────────
  const itemsText = items.map((it) => {
    const qty = Number(it?.qty ?? 1);
    const subtotal = it?.subtotal ?? (Number(it?.price ?? 0) * qty);
    const variants = renderVariantLines(it?.variants);
    const variantsTxt = variants.length > 0
      ? '\n  ' + variants.map((l) => `· ${l}`).join('\n  ')
      : '';
    return `${qty}x ${it?.name || '—'}    ${fmtCHF(subtotal)}${variantsTxt}`;
  }).join('\n');

  const modeText = isDelivery
    ? `Livraison à : ${order.customer_address || ''}`
    : `À retirer chez nous : ${RESTAURANT.address}`;

  // Lignes notes (vides = lignes pas ajoutées, sinon on insère un préfixe
  // explicite). On n'utilise pas filter('') global car le tableau text
  // utilise '' comme séparateur de paragraphes.
  const notesLines = [];
  if (order.note_kitchen) {
    notesLines.push('', `>> Note cuisine : ${order.note_kitchen}`);
  }
  if (isDelivery && order.note_delivery) {
    notesLines.push('', `>> Note livreur : ${order.note_delivery}`);
  }

  const text = [
    `KaïKaï — Commande confirmée #${shortId}`,
    '',
    `Bonjour ${order.customer_name || ''},`,
    '',
    'Votre commande a bien été reçue. Merci !',
    '',
    '— Détails —',
    itemsText,
    '',
    `TOTAL : ${fmtCHF(order.total)}`,
    '',
    modeText,
    ...notesLines,
    '',
    etaLabel,
    '',
    `Une question ? ${RESTAURANT.phoneDisplay} · ${RESTAURANT.site}`,
    `${RESTAURANT.address}`,
  ].join('\n');

  return { subject, html, text };
}
