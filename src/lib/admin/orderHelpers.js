// ─── Helpers commandes admin ─────────────────────────────────
// Centralise formatters, mappings de statut/paiement, et utilitaires
// partagés entre OrderCard, OrderModal, PrintTicket, ComptaView.

// ─── Formatters CHF / dates / heures ────────────────────────
export const fmt = (n) =>
  Number(n).toLocaleString('fr-CH', { style: 'currency', currency: 'CHF' });

export const fmtAmount = (n) =>
  Number(n).toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: '2-digit' });

export const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' });

export const fmtRelative = (iso) => {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
};

export const orderNumber = (id) => id.slice(0, 8).toUpperCase();

// ─── Statuts ────────────────────────────────────────────────
// Cycle :
//   cash/twint  : pending → accepted → delivered  (ou refused)
//   carte SumUp : pending_payment → paid → accepted → delivered
//
// Le statut "visuel" sur la carte (couleur) est dérivé du statut DB :
//   - paid              → vert (déjà encaissé, à traiter cuisine)
//   - pending           → orange (à traiter, encaissement à faire)
//   - accepted          → bleu (en préparation)
//   - delivered         → gris (terminé)
//   - refused           → rouge
//   - pending_payment   → masqué de l'admin (attente webhook SumUp)

export const STATUS_VISUAL = {
  pending: 'new',
  paid: 'paid',
  accepted: 'preparing',
  delivered: 'delivered',
  refused: 'refused',
  pending_payment: 'pending_payment',
};

export const STATUS_LABELS = {
  pending: 'À traiter',
  paid: 'Payée',
  accepted: 'En préparation',
  delivered: 'Livrée',
  refused: 'Refusée',
  pending_payment: 'En attente paiement',
};

// Sous-titre de la pill (sous le label) — différencie cash/twint vs carte
export const STATUS_SUBLABEL = (order) => {
  if (order.status === 'paid') return 'payée carte';
  if (order.status === 'pending') {
    if (order.payment_method === 'twint') return 'paiement TWINT à confirmer';
    if (order.payment_method === 'cash') return 'à encaisser à la livraison';
    return 'paiement à confirmer';
  }
  return null;
};

// ─── Modes de paiement ──────────────────────────────────────
export const PAYMENT_LABELS = {
  cash: 'Cash',
  twint: 'TWINT',
  card: 'Carte',
};

export const PAYMENT_PILL_CLASS = {
  cash: 'bg-accent-warm/10 text-accent-warm',
  twint: 'bg-accent/10 text-accent',
  card: 'bg-accent-blue/10 text-accent-blue',
};

export const PAYMENT_ICON = {
  cash: '💵',
  twint: '📱',
  card: '💳',
};

// ─── Filtres tabs (vue Commandes) ───────────────────────────
// Mapping tab → statuts DB inclus.
// "À traiter" regroupe pending (cash/twint) + paid (carte) car tous deux
// sont nouveaux du point de vue de la cuisine.
export const TAB_FILTERS = [
  { id: 'todo', label: 'À traiter', statuses: ['pending', 'paid'] },
  { id: 'preparing', label: 'En préparation', statuses: ['accepted'] },
  { id: 'delivered', label: 'Livrées', statuses: ['delivered'] },
  { id: 'refused', label: 'Refusées', statuses: ['refused'] },
];

// Commandes visibles dans l'admin — exclut systématiquement pending_payment
export const isAdminVisible = (order) => order.status !== 'pending_payment';

// ─── Variants de plats (formules) ──────────────────────────
export function renderVariantLines(variants) {
  if (!variants || !variants.length) return [];
  const lines = [];
  variants.forEach((v) => {
    if (typeof v === 'string') { lines.push(v); return; }
    if (v?.name) { lines.push(v.name); return; }
    if (v?.type) {
      if (v.plat) lines.push(`Plat : ${v.plat}${v.proteins?.[v.plat] ? ` (${v.proteins[v.plat]})` : ''}`);
      if (v.boisson) lines.push(`Boisson : ${v.jus || v.eau || v.boisson}`);
      if (v.dessert) lines.push(`Dessert : ${v.dessert}${v.coulisDessert ? ` (${v.coulisDessert})` : ''}`);
    }
  });
  return lines;
}

// ─── Calculs compta ─────────────────────────────────────────
// Une commande est "comptabilisée" si elle est paid, accepted ou delivered
// (pending = pas encore confirmée par le restaurant ; refused = pas de revenu).
export const isRevenue = (o) =>
  o.status === 'paid' || o.status === 'accepted' || o.status === 'delivered';

export function calcStats(orders) {
  const valid = orders.filter(isRevenue);
  const revenue = valid.reduce((s, o) => s + Number(o.total), 0);
  const count = valid.length;
  const avg = count > 0 ? revenue / count : 0;
  return { revenue, count, avg };
}

export function dayBoundaries(now = new Date()) {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfDay);
  startOfYesterday.setDate(startOfDay.getDate() - 1);
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startOfDay, startOfYesterday, startOfWeek, startOfMonth };
}

export const inRange = (order, from, to = null) => {
  const t = new Date(order.created_at).getTime();
  if (t < from.getTime()) return false;
  if (to && t >= to.getTime()) return false;
  return true;
};

// Mode favori du jour : retourne { method, count, percent } ou null si vide
export function favoritePaymentToday(orders) {
  const { startOfDay } = dayBoundaries();
  const today = orders.filter((o) => isRevenue(o) && inRange(o, startOfDay));
  if (today.length === 0) return null;
  const counts = {};
  today.forEach((o) => {
    counts[o.payment_method] = (counts[o.payment_method] || 0) + 1;
  });
  const [method, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return { method, count, percent: Math.round((count / today.length) * 100) };
}

// Variation pourcentage entre deux nombres (renvoie null si base = 0)
export function pctChange(current, previous) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

// ─── Export CSV ─────────────────────────────────────────────
export function exportOrdersCSV(orders) {
  const headers = [
    'Date', 'Heure', 'N° Commande', 'Client', 'Téléphone', 'Adresse',
    'Mode livraison', 'Articles', 'Total CHF', 'Paiement', 'Statut',
  ];
  const rows = orders.map((o) => {
    const itemsStr = Array.isArray(o.items)
      ? o.items.map((it) => `${it.qty}x ${it.name}`).join(' | ')
      : '';
    return [
      fmtDate(o.created_at),
      fmtTime(o.created_at),
      orderNumber(o.id),
      o.customer_name,
      o.customer_phone,
      o.customer_address || '',
      o.delivery_mode === 'pickup' ? 'À emporter' : 'Livraison',
      itemsStr,
      Number(o.total).toFixed(2),
      o.payment_method,
      o.status,
    ];
  });
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kaikai-commandes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
