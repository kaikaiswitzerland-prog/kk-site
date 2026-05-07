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
//   cash/twint  : pending → accepted → ready → delivered  (ou refused)
//   carte SumUp : pending_payment → paid → accepted → ready → delivered
//
// Le statut "visuel" sur la carte (couleur de la barre latérale) :
//   - paid              → vert    (encaissé, à traiter cuisine)
//   - pending           → orange  (à traiter, encaissement à faire)
//   - accepted          → bleu    (en préparation)
//   - ready             → citron  (prête, en attente livreur)
//   - delivered         → gris    (terminé)
//   - refused           → rouge
//   - pending_payment   → masqué de l'admin (attente webhook SumUp)

export const STATUS_VISUAL = {
  pending: 'new',
  paid: 'paid',
  accepted: 'preparing',
  ready: 'ready',
  delivered: 'delivered',
  refused: 'refused',
  pending_payment: 'pending_payment',
};

export const STATUS_LABELS = {
  pending: 'À traiter',
  paid: 'Payée',
  accepted: 'En préparation',
  ready: 'Prête',
  delivered: 'Livrée',
  refused: 'Refusée',
  pending_payment: 'En attente paiement',
};

// Liste des statuts manipulables manuellement par l'admin (pour "Forcer le statut")
export const FORCEABLE_STATUSES = [
  'pending', 'paid', 'accepted', 'ready', 'delivered', 'refused',
];

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
  { id: 'ready', label: 'Prêtes', statuses: ['ready'] },
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
// Une commande est "comptabilisée" si elle est paid/accepted/ready/delivered
// (pending = pas encore confirmée par le restaurant ; refused = pas de revenu).
export const isRevenue = (o) =>
  o.status === 'paid' ||
  o.status === 'accepted' ||
  o.status === 'ready' ||
  o.status === 'delivered';

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

// ─── Chrono d'urgence ───────────────────────────────────────
// Calcule le seuil d'alerte d'une commande selon son statut courant.
// Renvoie { label, tone, pulse, minutes } ou null si pas applicable.
//
// Seuils (brief) :
//   pending/paid (à traiter)    : 0-3 vert · 3-5 jaune · 5+ rouge clignotant
//   accepted (en cuisine)       : 0-15 vert · 15-25 jaune · 25+ rouge clignotant
//   ready (prête, livreur ?)    : 0-5 vert · 5-10 jaune · 10+ rouge clignotant
export function urgencyFor(order, now = Date.now()) {
  const status = order.status;
  if (status === 'pending' || status === 'paid') {
    const minutes = Math.max(0, Math.floor((now - new Date(order.created_at).getTime()) / 60000));
    return classify(minutes, [3, 5], `Reçue il y a ${minutes} min`);
  }
  if (status === 'accepted') {
    const ref = order.accepted_at || order.created_at;
    const minutes = Math.max(0, Math.floor((now - new Date(ref).getTime()) / 60000));
    return classify(minutes, [15, 25], `En cuisine depuis ${minutes} min`);
  }
  if (status === 'ready') {
    const ref = order.ready_at || order.accepted_at || order.created_at;
    const minutes = Math.max(0, Math.floor((now - new Date(ref).getTime()) / 60000));
    return classify(minutes, [5, 10], `Prête depuis ${minutes} min — livreur en route ?`);
  }
  return null;
}

function classify(minutes, [warn, urgent], label) {
  if (minutes < warn) return { label, tone: 'green', pulse: false, minutes };
  if (minutes < urgent) return { label, tone: 'yellow', pulse: false, minutes };
  return { label, tone: 'red', pulse: true, minutes };
}

// ─── Timeline (modale détail) ───────────────────────────────
// Renvoie la liste des étapes existantes avec deltas en minutes.
// Format : { icon, label, time (iso), deltaMin, deltaFromLabel, totalMin? }
export function buildTimeline(order) {
  const steps = [];
  const t0 = new Date(order.created_at).getTime();
  steps.push({ icon: '📥', label: 'Reçue', time: order.created_at, deltaMin: null });

  let prev = t0;
  let prevLabel = 'reçue';

  if (order.accepted_at) {
    const t = new Date(order.accepted_at).getTime();
    steps.push({
      icon: '✅',
      label: 'Acceptée',
      time: order.accepted_at,
      deltaMin: Math.max(0, Math.round((t - prev) / 60000)),
      deltaFromLabel: prevLabel,
    });
    prev = t;
    prevLabel = 'acceptée';
  }

  if (order.ready_at) {
    const t = new Date(order.ready_at).getTime();
    steps.push({
      icon: '🍳',
      label: 'Prête',
      time: order.ready_at,
      deltaMin: Math.max(0, Math.round((t - prev) / 60000)),
      deltaFromLabel: prevLabel,
    });
    prev = t;
    prevLabel = 'prête';
  }

  if (order.delivered_at) {
    const t = new Date(order.delivered_at).getTime();
    steps.push({
      icon: '🛵',
      label: 'Livrée',
      time: order.delivered_at,
      deltaMin: Math.max(0, Math.round((t - prev) / 60000)),
      deltaFromLabel: prevLabel,
      totalMin: Math.max(0, Math.round((t - t0) / 60000)),
    });
  }

  return steps;
}

// ─── Tri par priorité (vue Commandes) ───────────────────────
// Pour les onglets actifs (à traiter / en cuisine / prêtes) : les plus
// anciennes en haut, basé sur le timestamp de référence du statut courant.
// Pour delivered/refused : du plus récent au plus ancien (historique).
export function sortByPriority(orders, tabId) {
  const refTime = (o) => {
    if (tabId === 'preparing') return new Date(o.accepted_at || o.created_at).getTime();
    if (tabId === 'ready')     return new Date(o.ready_at || o.accepted_at || o.created_at).getTime();
    if (tabId === 'delivered') return new Date(o.delivered_at || o.created_at).getTime();
    if (tabId === 'refused')   return new Date(o.created_at).getTime();
    return new Date(o.created_at).getTime(); // 'todo'
  };
  const desc = tabId === 'delivered' || tabId === 'refused';
  return [...orders].sort((a, b) => {
    const ra = refTime(a);
    const rb = refTime(b);
    return desc ? rb - ra : ra - rb;
  });
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
