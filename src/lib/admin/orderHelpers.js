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

// ─── Catégories d'items ────────────────────────────────────
// Lookup id → catégorie. Source : MENU dans src/App.jsx (constante inline,
// non importable directement sans coupler admin et public). On duplique ici
// la table minimale id → slug ; à mettre à jour en cas d'ajout de plat.
// Le menu actuel couvre les ids "1" à "20".
export const ITEM_CATEGORY_MAP = {
  '1':  'entrees',   // Velouté koko
  '2':  'entrees',   // Salade Tropicale
  '3':  'entrees',   // Salade de poulet
  '4':  'entrees',   // Tartare de thon rouge
  '5':  'chaud',     // Chao Men
  '6':  'chaud',     // Kai Fan
  '7':  'chaud',     // Omelette Fu Young
  '8':  'chaud',     // Wok de Bœuf
  '9':  'froid',     // Tahiti
  '10': 'froid',     // Hawaï
  '11': 'froid',     // Samoa
  '12': 'froid',     // Manoa
  '13': 'formules',  // Formule Découverte
  '14': 'formules',  // Formule Voyage
  '15': 'desserts',  // Coulant au chocolat
  '16': 'desserts',  // Crème Tropicale
  '17': 'desserts',  // Po'e Banane
  '18': 'desserts',  // Cheesecake
  '19': 'boissons',  // Jus exotiques
  '20': 'boissons',  // Eau plate/gazeuse
};

export const CATEGORY_LABELS = {
  entrees:  'Entrée',
  chaud:    'Plat chaud',
  froid:    'Plat froid',
  formules: 'Formule',
  desserts: 'Dessert',
  boissons: 'Boisson',
};

// Renvoie toujours un string non-null :
//  - label français si l'id de l'item est connu
//  - "?" si l'id n'est pas dans ITEM_CATEGORY_MAP (plat retiré du menu)
export function getItemCategoryLabel(item) {
  const id = String(item?.id ?? '');
  const slug = ITEM_CATEGORY_MAP[id];
  if (!slug) return '?';
  return CATEGORY_LABELS[slug] || '?';
}

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
// Rend un tableau `variants` (du payload order.items[].variants) en sous-lignes
// lisibles pour cuisine / admin. Le rendu (· prefix, font, casse) reste à la
// charge des composants consommateurs — cette fonction retourne juste les
// chaînes en mixed-case.
//
// Cas gérés :
//  1. String legacy → push tel quel
//  2. Variant simple { id, name, desc } → push name (tartare, sauce, jus seul…)
//  3. Formule Découverte (type='decouverte') :
//     - Plat (+ protéine si applicable)
//     - Boisson : Soft / Jus {nom} / Eau {nom}
//     - Dessert (+ coulis si applicable) — rare en Découverte mais supporté
//  4. Formule Voyage (type='voyage') :
//     - Plat 1 / Plat 2 (+ protéine[plat] si applicable)
//     - Boissons[] avec zipping ordonné sur jus[] et eau[]
//     - Dessert (+ coulis si applicable)
//
// Graceful fallback : ignore tout champ null/undefined, ne lance jamais.
export function renderVariantLines(variants) {
  if (!variants || !variants.length) return [];
  const lines = [];

  variants.forEach((v) => {
    // 1. String legacy
    if (typeof v === 'string') {
      lines.push(v);
      return;
    }

    // 2. Formule Découverte (test AVANT le simple variant pour priorité)
    if (v?.type === 'decouverte') {
      if (v.plat) {
        const protein = v.proteins?.[v.plat];
        lines.push(`Plat : ${v.plat}${protein ? ` (${protein})` : ''}`);
      }
      if (v.boisson === 'Soft') {
        lines.push('Boisson : Soft');
      } else if (v.boisson === 'Jus exotique' && v.jus) {
        lines.push(`Boisson : Jus ${v.jus}`);
      } else if (v.boisson === 'Eau' && v.eau) {
        // v.eau contient déjà "Eau Plate" / "Eau Gazeuse" — on évite le doublon "Eau Eau …"
        lines.push(`Boisson : ${v.eau}`);
      }
      if (v.dessert) {
        lines.push(`Dessert : ${v.dessert}${v.coulisDessert ? ` (${v.coulisDessert})` : ''}`);
      }
      return;
    }

    // 3. Formule Voyage
    if (v?.type === 'voyage') {
      const plats = Array.isArray(v.plats) ? v.plats : [];
      plats.forEach((plat, idx) => {
        // Voyage nouveau format : v.proteins est un array aligné sur v.plats[idx].
        // Voyage legacy : v.proteins est un objet { [platName]: proteinName } — on
        // dual-read pour préserver l'affichage des commandes déjà passées.
        const protein = Array.isArray(v.proteins)
          ? v.proteins[idx]
          : v.proteins?.[plat];
        lines.push(`Plat ${idx + 1} : ${plat}${protein ? ` (${protein})` : ''}`);
      });

      // Zipping ordonné : on itère boissons[] et on consomme jus[]/eau[]
      // dans l'ordre selon le type (logique miroir de FormuleModal).
      const boissons = Array.isArray(v.boissons) ? v.boissons : [];
      const jusList = Array.isArray(v.jus) ? v.jus : [];
      const eauList = Array.isArray(v.eau) ? v.eau : [];
      let jusIdx = 0;
      let eauIdx = 0;
      boissons.forEach((b) => {
        if (b === 'Soft') {
          lines.push('Boisson : Soft');
        } else if (b === 'Jus exotique') {
          const nom = jusList[jusIdx++];
          if (nom) lines.push(`Boisson : Jus ${nom}`);
        } else if (b === 'Eau') {
          const nom = eauList[eauIdx++];
          // nom contient déjà "Eau Plate" / "Eau Gazeuse" — pas de doublon
          if (nom) lines.push(`Boisson : ${nom}`);
        }
      });

      if (v.dessert) {
        lines.push(`Dessert : ${v.dessert}${v.coulisDessert ? ` (${v.coulisDessert})` : ''}`);
      }
      return;
    }

    // 4. Variant simple { id, name, desc } — fallback
    if (v?.name) {
      lines.push(v.name);
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
