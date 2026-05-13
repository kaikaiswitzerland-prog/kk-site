// api/_lib/emails/orderRefused.js
// Email envoyé au client quand l'admin refuse sa commande.
// Le contenu adapte le message selon le motif structuré (reason code).

import {
  COLORS,
  RESTAURANT,
  esc,
  fmtCHF,
  orderShortId,
  htmlShell,
} from './_shared.js';

// Map des messages d'excuse principaux par code motif. À garder synchronisé
// avec REFUSAL_REASONS dans src/lib/admin/orderHelpers.js.
const REASON_MESSAGES = {
  stock_out: {
    title: 'Rupture de stock',
    body: "Suite à une rupture de stock imprévue, nous n'avons malheureusement pas pu honorer votre commande. Nous vous prions de bien vouloir nous en excuser et espérons vous accueillir bientôt.",
  },
  out_of_zone: {
    title: 'Adresse hors zone',
    body: "Votre adresse de livraison se trouve hors de notre zone de service. Nous regrettons de ne pas pouvoir vous livrer pour le moment. Vous restez le/la bienvenu(e) en retrait à notre cuisine.",
  },
  product_error: {
    title: 'Erreur produit',
    body: "Une erreur s'est glissée dans votre commande et nous ne pouvons l'honorer en l'état. Nous vous prions de nous en excuser et de bien vouloir repasser commande.",
  },
  closed: {
    title: 'Cuisine fermée',
    body: 'Notre cuisine est temporairement fermée et nous ne pouvons honorer votre commande. Nous espérons vous revoir très vite dès la réouverture.',
  },
  other: {
    title: 'Commande non honorée',
    body: 'Nous sommes au regret de ne pouvoir honorer votre commande.',
  },
};

/**
 * Construit le sujet + HTML + texte de l'email de refus.
 *
 * @param {Object} params
 * @param {Object} params.order   — ligne brute de la table orders Supabase.
 * @param {string} params.reason  — code motif (cf. REFUSAL_REASONS).
 * @param {string} [params.comment] — texte libre additionnel (obligatoire si 'other').
 * @returns {{ subject: string, html: string, text: string }}
 */
export function buildOrderRefusedEmail({ order, reason, comment }) {
  const shortId = orderShortId(order.id);
  const subject = 'Votre commande KaïKaï a dû être annulée';
  const msg = REASON_MESSAGES[reason] || REASON_MESSAGES.other;

  const isCard = order.payment_method === 'card';
  const refundLine = isCard
    ? `Votre paiement de ${fmtCHF(order.total)} a été intégralement remboursé. Le délai de réception dépend de votre banque (2-5 jours ouvrés).`
    : "Aucun paiement n'a été prélevé.";

  // Bloc commentaire (visible uniquement si reason='other' OU si un comment
  // a été saisi). Pour les motifs structurés, on n'inclut pas l'ajout si vide.
  const showComment = !!comment && (reason === 'other' || comment.trim().length > 0);

  // ── HTML ────────────────────────────────────────────────────────────
  const commentHtml = showComment
    ? `<div style="margin-top:16px;padding:14px;border:1px solid ${COLORS.border};border-radius:8px;">
         <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.textMuted};margin-bottom:6px;">Précisions</div>
         <div style="font-size:14px;color:${COLORS.text};white-space:pre-wrap;">${esc(comment)}</div>
       </div>`
    : '';

  const bodyHtml = `
<p style="margin:0 0 12px 0;font-size:16px;">Bonjour ${esc(order.customer_name || '')},</p>

<p style="margin:0 0 16px 0;color:${COLORS.text};">${esc(msg.body)}</p>

<div style="margin:8px 0 16px 0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.textMuted};">
  Commande #${esc(shortId)} &middot; ${esc(msg.title)}
</div>

${commentHtml}

<div style="margin-top:20px;padding:14px;border:1px solid ${COLORS.border};border-radius:8px;background:rgba(0,0,0,0.15);">
  <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.textMuted};margin-bottom:6px;">Paiement</div>
  <div style="font-size:14px;color:${COLORS.text};">${esc(refundLine)}</div>
</div>

<p style="margin:24px 0 0 0;font-size:14px;color:${COLORS.text};">
  Toute l'équipe KaïKaï vous présente ses excuses et reste à votre disposition au
  <a href="tel:${esc(RESTAURANT.phoneDisplay.replace(/\s+/g, ''))}" style="color:${COLORS.accent};text-decoration:none;">${esc(RESTAURANT.phoneDisplay)}</a>.
</p>
`;

  const html = htmlShell({ subject, bodyHtml });

  // ── Plain text fallback ─────────────────────────────────────────────
  const lines = [
    `KaïKaï — Commande annulée #${shortId}`,
    '',
    `Bonjour ${order.customer_name || ''},`,
    '',
    msg.body,
    '',
    `Motif : ${msg.title}`,
  ];
  if (showComment) {
    lines.push('', `Précisions : ${comment}`);
  }
  lines.push(
    '',
    refundLine,
    '',
    `Toute l'équipe KaïKaï vous présente ses excuses et reste à votre disposition au ${RESTAURANT.phoneDisplay}.`,
    '',
    `${RESTAURANT.site} · ${RESTAURANT.address}`,
  );
  const text = lines.join('\n');

  return { subject, html, text };
}
