// ─── Agrégations pour l'onglet Analyses ──────────────────────
// Fonctions PURES : elles prennent une liste de commandes déjà filtrée par la
// requête Supabase et rendent des séries prêtes à dessiner. Aucun accès
// réseau, aucun state, aucun effet de bord — tout est vérifiable à la main.
//
// Ce fichier ne définit AUCUN prix et ne recopie aucune règle métier : la
// catégorie d'un plat vient de ITEM_CATEGORY_MAP, le revenu de isRevenue, le
// calcul des stats de calcStats. Une seule source de vérité, celle de la Compta.

import {
  ACTIVE_STATUSES,
  COMPLETED_STATUSES,
  CATEGORY_LABELS,
  ITEM_CATEGORY_MAP,
  calcStats,
  isRevenue,
} from './orderHelpers.js';

// ─── Statuts comptabilisés ──────────────────────────────────
// DÉRIVÉ de isRevenue plutôt que recopié : si la définition du revenu bouge
// dans orderHelpers, ce filtre — et donc la requête Supabase — suit tout seul
// et l'onglet Analyses ne peut pas diverger de l'onglet Compta en silence.
export const REVENUE_STATUSES = [...ACTIVE_STATUSES, ...COMPLETED_STATUSES]
  .filter((status) => isRevenue({ status }));

// ─── Fuseau ─────────────────────────────────────────────────
// Tous les découpages temporels (mois, jour de la semaine, tranche horaire)
// sont faits en heure murale Europe/Zurich, jamais avec getHours()/getDay()
// qui suivent le fuseau du device. Une commande de 21h50 un dimanche soir doit
// tomber dans « dimanche, 21h » qu'on lise le tableau de bord depuis Genève,
// depuis un serveur en UTC ou depuis un téléphone resté à l'heure de Bangkok.
//
// Même principe et même fuseau que restaurantHours.js ; son zurichParts() n'est
// pas exporté, on en refait donc une lecture locale ici plutôt que de modifier
// un module dont dépend le site public.
const TZ = 'Europe/Zurich';

const PARTS_FMT = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  weekday: 'short',
  hour12: false,
});

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function zurichParts(date) {
  const parts = PARTS_FMT.formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  // Certains moteurs rendent "24" pour minuit en hour12:false — on normalise.
  let hour = Number(get('hour'));
  if (hour === 24) hour = 0;
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour,
    minute: Number(get('minute')),
    second: Number(get('second')),
    weekday: WEEKDAY_INDEX[get('weekday')],
  };
}

// Décalage Zurich↔UTC (ms) à un instant donné. Positif en CET/CEST.
function zurichOffsetMs(date) {
  const p = zurichParts(date);
  const asIfUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asIfUTC - date.getTime();
}

// Instant UTC correspondant à une heure MURALE Zurich.
// Deux passes : l'offset lu sur l'instant approché peut différer de l'offset
// réel juste autour d'un changement d'heure (dernier week-end de mars/octobre).
// Les bornes de mois n'y tombent jamais, mais une borne fausse deux fois par an
// est exactement le genre de bug qu'on ne voit qu'au moment du bilan annuel.
export function zurichWallToInstant(year, monthIndex, day, hour = 0, minute = 0) {
  const guess = Date.UTC(year, monthIndex, day, hour, minute);
  const firstPass = guess - zurichOffsetMs(new Date(guess));
  return new Date(guess - zurichOffsetMs(new Date(firstPass)));
}

// ─── Mois ───────────────────────────────────────────────────
const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export const monthKey = (year, monthIndex) =>
  `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

export function parseMonthKey(key) {
  const [y, m] = String(key).split('-');
  return { year: Number(y), monthIndex: Number(m) - 1 };
}

export const monthLabel = (year, monthIndex) => `${MONTH_NAMES[monthIndex]} ${year}`;

// Bornes [from, to[ d'un mois, en instants UTC calés sur le calendrier Zurich.
export function monthRange(year, monthIndex) {
  return {
    fromISO: zurichWallToInstant(year, monthIndex, 1).toISOString(),
    toISO: zurichWallToInstant(year, monthIndex + 1, 1).toISOString(),
  };
}

// Mois sélectionnables : du mois de la PREMIÈRE commande jusqu'au mois courant,
// du plus récent au plus ancien. La liste est bornée par l'historique réel, pas
// par une fenêtre glissante arbitraire — sinon les mois plus anciens que la
// fenêtre deviennent injoignables alors que leurs données sont bien en base.
//
// `since` peut être null (base vide, ou date pas encore chargée) : on rend
// alors le seul mois courant, ce qui laisse la vue utilisable pendant que la
// vraie borne arrive.
//
// Les mois sans commande sont INCLUS. Un trou dans le service — fermeture,
// travaux, mois de lancement à moitié vide — est une information ; le masquer
// ferait mentir la liste par omission, et empêcherait de comparer un mois creux
// à un mois plein.
export function monthsSince(since, now = new Date()) {
  const end = zurichParts(now);
  const endAbs = end.year * 12 + (end.month - 1);

  let startAbs = endAbs;
  if (since) {
    const first = zurichParts(since instanceof Date ? since : new Date(since));
    if (Number.isFinite(first.year)) {
      startAbs = Math.min(first.year * 12 + (first.month - 1), endAbs);
    }
  }

  const out = [];
  for (let abs = endAbs; abs >= startAbs; abs -= 1) {
    const year = Math.floor(abs / 12);
    const monthIndex = abs % 12;
    out.push({ key: monthKey(year, monthIndex), year, monthIndex, label: monthLabel(year, monthIndex) });
  }
  return out;
}

// ─── Lecture d'une ligne d'article ──────────────────────────
// `subtotal` est posé à la création de la commande (App.jsx) et tient compte
// des variantes facturées. Les commandes antérieures à ce champ retombent sur
// price × qty — approximation assumée, et signalée par `estimated`.
function lineRevenue(item) {
  const subtotal = Number(item?.subtotal);
  if (Number.isFinite(subtotal)) return { value: subtotal, estimated: false };
  const price = Number(item?.price) || 0;
  const qty = Number(item?.qty) || 0;
  return { value: price * qty, estimated: true };
}

const categorySlug = (item) => ITEM_CATEGORY_MAP[String(item?.id ?? '')] || 'autres';

// Ordre d'affichage des catégories : celui de la carte, pas celui du hasard.
const CATEGORY_ORDER = ['entrees', 'chaud', 'froid', 'formules', 'desserts', 'boissons', 'autres'];

const CATEGORY_DISPLAY = {
  ...CATEGORY_LABELS,
  autres: 'Autres', // plat retiré du menu, absent d'ITEM_CATEGORY_MAP
};

function forEachLine(orders, fn) {
  orders.forEach((order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item) => fn(item, order));
  });
}

// ─── CA par catégorie ───────────────────────────────────────
// Base = somme des lignes d'articles, donc HORS frais de livraison et hors
// remise coupon : ces deux-là ne se rattachent à aucune catégorie. Le total
// rendu ici est volontairement inférieur au CA encaissé du mois, et la vue
// l'annonce plutôt que de le maquiller.
export function aggregateByCategory(orders) {
  const bySlug = new Map();
  forEachLine(orders, (item) => {
    const slug = categorySlug(item);
    bySlug.set(slug, (bySlug.get(slug) || 0) + lineRevenue(item).value);
  });
  return CATEGORY_ORDER
    .filter((slug) => (bySlug.get(slug) || 0) > 0)
    .map((slug) => ({ key: slug, label: CATEGORY_DISPLAY[slug] || slug, value: bySlug.get(slug) }));
}

// ─── CA top N produits ──────────────────────────────────────
// Regroupement par id (le nom peut changer sans que le plat change) ; tout ce
// qui dépasse le top N est fondu dans « Autres », placé en dernier.
export function aggregateTopProducts(orders, limit = 10) {
  const byId = new Map();
  forEachLine(orders, (item) => {
    const id = String(item?.id ?? '?');
    const prev = byId.get(id) || { key: id, label: item?.name || `Article ${id}`, value: 0, qty: 0 };
    prev.value += lineRevenue(item).value;
    prev.qty += Number(item?.qty) || 0;
    byId.set(id, prev);
  });

  const sorted = [...byId.values()].filter((p) => p.value > 0).sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  if (rest.length > 0) {
    top.push({
      key: '__autres__',
      label: `Autres (${rest.length} article${rest.length > 1 ? 's' : ''})`,
      value: rest.reduce((s, p) => s + p.value, 0),
      qty: rest.reduce((s, p) => s + p.qty, 0),
    });
  }
  return top;
}

// ─── CA par jour de la semaine ──────────────────────────────
// Ventile des commandes ENTIÈRES : la base est order.total, frais de livraison
// compris. La somme de ce donut égale donc bien le CA encaissé du mois.
const WEEKDAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const WEEKDAY_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
// Semaine affichée du lundi au dimanche, comme un planning de service.
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function aggregateByWeekday(orders) {
  const byDay = new Array(7).fill(0);
  orders.forEach((order) => {
    const { weekday } = zurichParts(new Date(order.created_at));
    byDay[weekday] += Number(order.total) || 0;
  });
  return WEEKDAY_ORDER
    .filter((d) => byDay[d] > 0)
    .map((d) => ({ key: String(d), label: WEEKDAY_LABELS[d], short: WEEKDAY_SHORT[d], value: byDay[d] }));
}

// ─── CA par tranche horaire ─────────────────────────────────
// Découpage calé sur les deux services réels (midi 11h-14h, soir 17h30-22h,
// cf. restaurantHours.js) plutôt que sur 24 barres dont 16 vides. Une commande
// tombée hors service — pré-commande matinale, retard de webhook SumUp — n'est
// pas jetée : elle atterrit dans « Hors service », affiché seulement s'il pèse.
const HOUR_SLOTS = [
  { key: '11', label: '11h', service: 'midi', hours: [11] },
  { key: '12', label: '12h', service: 'midi', hours: [12] },
  { key: '13', label: '13h', service: 'midi', hours: [13] },
  { key: '17', label: '17h', service: 'soir', hours: [17] },
  { key: '18', label: '18h', service: 'soir', hours: [18] },
  { key: '19', label: '19h', service: 'soir', hours: [19] },
  { key: '20', label: '20h', service: 'soir', hours: [20] },
  { key: '21', label: '21h', service: 'soir', hours: [21] },
];

export function aggregateByHourSlot(orders) {
  const byHour = new Array(24).fill(0);
  orders.forEach((order) => {
    const { hour } = zurichParts(new Date(order.created_at));
    byHour[hour] += Number(order.total) || 0;
  });

  const covered = new Set(HOUR_SLOTS.flatMap((s) => s.hours));
  const slots = HOUR_SLOTS.map((slot) => ({
    key: slot.key,
    label: slot.label,
    service: slot.service,
    value: slot.hours.reduce((s, h) => s + byHour[h], 0),
  }));

  const offService = byHour.reduce((s, v, h) => (covered.has(h) ? s : s + v), 0);
  if (offService > 0) {
    slots.push({ key: 'hors', label: 'Autre', service: 'hors', value: offService });
  }
  return slots;
}

// ─── CA jour par jour (calendrier) ──────────────────────────
// Date du jour en heure murale Zurich. Sert à savoir quels jours du mois
// courant sont encore à venir — l'horloge du navigateur ne fait pas foi :
// l'iPad de cuisine ou un portable resté sur un autre fuseau afficheraient
// sinon une journée de trop, ou une de moins.
export function todayZurich(now = new Date()) {
  const { year, month, day } = zurichParts(now);
  return { year, month, day };
}

// Comparable numérique d'une date civile — 2026-09-12 → 20260912.
const dateOrdinal = (year, month, day) => year * 10000 + month * 100 + day;

// Ventile le CA et le nombre de commandes sur les jours du mois, et rend tout
// ce qu'il faut pour dessiner une grille : combien de jours, sur quelle colonne
// tombe le 1er, quelle est la meilleure journée.
//
// Base = order.total, comme le donut par jour de semaine et les stats : le
// total du calendrier égale donc le CA encaissé du mois.
export function aggregateByDay(orders, year, monthIndex, now = new Date()) {
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return null;

  // Jour 0 du mois suivant = dernier jour de celui-ci. Gère les années
  // bissextiles sans table de correspondance.
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const revenue = new Array(daysInMonth + 1).fill(0);
  const count = new Array(daysInMonth + 1).fill(0);

  orders.forEach((order) => {
    const p = zurichParts(new Date(order.created_at));
    // La requête borne déjà au mois, mais une ligne hors plage écrirait hors du
    // tableau et fausserait un jour au hasard. On la laisse dehors.
    if (p.year !== year || p.month !== monthIndex + 1) return;
    if (p.day < 1 || p.day > daysInMonth) return;
    revenue[p.day] += Number(order.total) || 0;
    count[p.day] += 1;
  });

  const today = todayZurich(now);
  const todayOrd = dateOrdinal(today.year, today.month, today.day);

  const cells = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const c = count[day];
    cells.push({
      day,
      revenue: revenue[day],
      count: c,
      avg: c > 0 ? revenue[day] / c : 0,
      isFuture: dateOrdinal(year, monthIndex + 1, day) > todayOrd,
    });
  }

  // Le jour de la semaine d'une date civile ne dépend d'aucun fuseau : le 1er
  // septembre 2026 est un mardi à Zurich comme à Tokyo. On le lit donc en UTC,
  // sans repasser par l'heure murale — un aller-retour de plus n'apporterait
  // qu'une occasion de se tromper. Décalage de 6 pour une semaine lun → dim.
  const startWeekday = (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7;

  return {
    year,
    monthIndex,
    daysInMonth,
    startWeekday,
    maxRevenue: cells.reduce((m, c) => Math.max(m, c.revenue), 0),
    cells,
  };
}

// ─── Stats du mois ──────────────────────────────────────────
// calcStats refiltre par isRevenue : redondant avec la requête, et voulu —
// si un statut non comptabilisé passait un jour au travers du filtre serveur,
// le total resterait celui de la Compta.
export function summarize(orders) {
  const { revenue, count, avg } = calcStats(orders);
  const productRevenue = orders.reduce((sum, order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    return sum + items.reduce((s, item) => s + lineRevenue(item).value, 0);
  }, 0);
  return { revenue, count, avg, productRevenue };
}

// Assemble tout ce dont une colonne de mois a besoin, en une passe.
//
// `month` est indispensable au calendrier et ne peut PAS se déduire des
// commandes : un mois sans commande n'en contient aucune, et c'est justement
// un mois qu'il faut savoir dessiner. Sans lui, `days` vaut null et la colonne
// affiche ses graphes sans calendrier plutôt que d'inventer un mois.
export function buildMonthAnalytics(orders, month = {}) {
  const { year, monthIndex } = month;
  return {
    stats: summarize(orders),
    categories: aggregateByCategory(orders),
    products: aggregateTopProducts(orders, 10),
    weekdays: aggregateByWeekday(orders),
    hours: aggregateByHourSlot(orders),
    days: aggregateByDay(orders, year, monthIndex),
  };
}
