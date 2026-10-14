// src/lib/promoCodes.js
//
// Codes promo du site (action 16, 14.10.2026). Source UNIQUE des règles,
// lue par le front (affichage) ET par le serveur (api/create-checkout.js,
// api/validate-promo.js), qui seul fait foi.
//
// PREMIER : −20 % sur le sous-total des plats (hors livraison), arrondi à
// 0.05 CHF, une seule fois par client (téléphone OU email), jusqu'au
// 30 novembre 2026 23:59 heure de Genève inclus. Non cumulable.

export const PROMO_CODES = {
  PREMIER: {
    code: 'PREMIER',
    rate: 0.20,
    // Fin EXCLUSIVE : 1er décembre 2026 00:00 à Genève (CET = UTC+1).
    endsAt: Date.parse('2026-12-01T00:00:00+01:00'),
    label: 'PREMIER −20 %',
    oncePerCustomer: true,
  },
};

// Statuts qui « consomment » un code : commande payée ou en cours.
// Refusée, remboursée, échouée, expirée ou en attente de paiement : non.
export const PROMO_USED_STATUSES = [
  'pending', 'paid', 'accepted', 'ready', 'out_for_delivery', 'delivered', 'picked_up',
];

export function normalizeCode(raw) {
  return String(raw || '').replace(/\s+/g, '').toUpperCase();
}

export function normalizePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '41' + d.slice(1); // 076… → 4176…
  return d;
}

export function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase();
}

// Arrondi au 0.05 CHF le plus proche.
export function round05(n) {
  return Math.round((Number(n) || 0) * 20) / 20;
}

export function promoDiscount(code, subtotal) {
  const p = PROMO_CODES[normalizeCode(code)];
  if (!p || !(subtotal > 0)) return 0;
  return Math.min(round05(subtotal * p.rate), subtotal);
}

// Le client a-t-il déjà utilisé ce code ? `rows` = commandes existantes
// portant ce promo_code ({ status, customer_phone, customer_email }).
export function isPromoAlreadyUsed(rows, phone, email) {
  const ph = normalizePhone(phone);
  const em = normalizeEmail(email);
  if (!ph && !em) return false;
  return (Array.isArray(rows) ? rows : []).some((r) =>
    PROMO_USED_STATUSES.includes(r?.status) && (
      (ph && normalizePhone(r?.customer_phone) === ph) ||
      (em && normalizeEmail(r?.customer_email) === em)
    ));
}

// Contrôle sans base de données : code connu et pas expiré.
// Rend { ok: true, promo } ou { ok: false, error, message }.
export function checkPromo(raw, now = Date.now()) {
  const code = normalizeCode(raw);
  if (!code) return { ok: false, error: 'promo_empty', message: 'Entrez un code.' };
  const promo = PROMO_CODES[code];
  if (!promo) return { ok: false, error: 'promo_unknown', message: "Ce code n'existe pas." };
  if (now >= promo.endsAt) return { ok: false, error: 'promo_expired', message: 'Ce code a expiré.' };
  return { ok: true, promo };
}

export const PROMO_USED_MESSAGE = 'Ce code a déjà été utilisé pour ce client (une seule fois par personne).';
export const PROMO_NEED_CONTACT = "Indiquez d'abord votre téléphone ou votre email pour utiliser le code.";
