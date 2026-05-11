// src/lib/restaurantHours.js
// Source de vérité unique pour les horaires d'ouverture KaïKaï.
// Utilisable côté front (React via useRestaurantOpen) ET côté serveur (Vercel
// Functions via api/_lib/restaurantHours.js — copie miroir, voir note bas).
//
// Modèle :
//   - Mardi → Dimanche : deux services (lunch 11h-14h, dinner 17h30-22h)
//   - Lundi : fermé toute la journée
//   - Les commandes (pré-commande) sont possibles dès l'ouverture d'un service.

// Date.getDay() : 0=dim, 1=lun, 2=mar, ..., 6=sam. Lundi=1.
export const DAYS_OFF = [1];

// Service midi : ouvert pour pré-commande dès 11h00, ferme à 14h00.
export const LUNCH = {
  open:  { h: 11, m: 0 },
  close: { h: 14, m: 0 },
};

// Service soir : ouvert pour pré-commande dès 17h30, ferme à 22h00.
export const DINNER = {
  open:  { h: 17, m: 30 },
  close: { h: 22, m: 0 },
};

// Helpers internes ───────────────────────────────────────────────────────────

function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function toMinutes({ h, m }) {
  return h * 60 + m;
}

function isDayOff(date) {
  return DAYS_OFF.includes(date.getDay());
}

// Construit une Date à l'heure { h, m } du jour `date` (heure locale).
function dateAt(date, { h, m }) {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

// Renvoie la prochaine date d'ouverture à partir de `now`. Tient compte des
// services restants aujourd'hui, sinon jump au jour suivant, en sautant les
// jours fermés. Garantit la terminaison via un cap de 8 jours (filet de
// sécurité — en pratique, on en trouve toujours un en moins de 8).
function findNextOpenAt(now) {
  // 1) D'abord, regarde si on peut encore ouvrir aujourd'hui même.
  if (!isDayOff(now)) {
    const cur = minutesOfDay(now);
    if (cur < toMinutes(LUNCH.open))  return dateAt(now, LUNCH.open);
    if (cur < toMinutes(DINNER.open)) return dateAt(now, DINNER.open);
  }
  // 2) Sinon, on cherche le prochain jour d'ouverture, à partir de demain.
  for (let i = 1; i <= 8; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    if (!isDayOff(d)) return dateAt(d, LUNCH.open);
  }
  return null;
}

// API publique ────────────────────────────────────────────────────────────────

/**
 * Statut d'ouverture du restaurant à un instant donné.
 *
 * @param {Date} [now=new Date()]
 * @returns {{
 *   isOpen: boolean,
 *   reason: 'open' | 'closed_day' | 'closed_hours',
 *   currentService: 'lunch' | 'dinner' | null,
 *   nextOpenAt: Date | null,
 *   nextCloseAt: Date | null,
 * }}
 */
export function getRestaurantStatus(now = new Date()) {
  if (isDayOff(now)) {
    return {
      isOpen: false,
      reason: 'closed_day',
      currentService: null,
      nextOpenAt: findNextOpenAt(now),
      nextCloseAt: null,
    };
  }

  const cur = minutesOfDay(now);
  const lunchOpen  = toMinutes(LUNCH.open);
  const lunchClose = toMinutes(LUNCH.close);
  const dinnerOpen  = toMinutes(DINNER.open);
  const dinnerClose = toMinutes(DINNER.close);

  if (cur >= lunchOpen && cur < lunchClose) {
    return {
      isOpen: true,
      reason: 'open',
      currentService: 'lunch',
      nextOpenAt: null,
      nextCloseAt: dateAt(now, LUNCH.close),
    };
  }
  if (cur >= dinnerOpen && cur < dinnerClose) {
    return {
      isOpen: true,
      reason: 'open',
      currentService: 'dinner',
      nextOpenAt: null,
      nextCloseAt: dateAt(now, DINNER.close),
    };
  }
  return {
    isOpen: false,
    reason: 'closed_hours',
    currentService: null,
    nextOpenAt: findNextOpenAt(now),
    nextCloseAt: null,
  };
}

// Format "11h" si minute=0, sinon "17h30".
function formatHour({ h, m }) {
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function formatHourFromDate(d) {
  return formatHour({ h: d.getHours(), m: d.getMinutes() });
}

const WEEKDAYS_NAME = [
  'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi',
];

/**
 * Label humain de l'état pour affichage UI.
 * @param {ReturnType<typeof getRestaurantStatus>} status
 * @returns {string}
 */
export function formatStatusLabel(status) {
  if (status.isOpen && status.nextCloseAt) {
    return `Ouvert · ferme à ${formatHourFromDate(status.nextCloseAt)}`;
  }
  if (status.reason === 'closed_day' && status.nextOpenAt) {
    const dayName = WEEKDAYS_NAME[status.nextOpenAt.getDay()];
    return `Fermé le lundi · ouvre ${dayName} ${formatHourFromDate(status.nextOpenAt)}`;
  }
  if (status.reason === 'closed_hours' && status.nextOpenAt) {
    // Si la prochaine ouverture est demain ou plus tard, mentionne le jour.
    const today = new Date();
    const sameDay =
      status.nextOpenAt.getDate() === today.getDate() &&
      status.nextOpenAt.getMonth() === today.getMonth() &&
      status.nextOpenAt.getFullYear() === today.getFullYear();
    if (sameDay) {
      return `Fermé · ouvre à ${formatHourFromDate(status.nextOpenAt)}`;
    }
    const dayName = WEEKDAYS_NAME[status.nextOpenAt.getDay()];
    return `Fermé · ouvre ${dayName} ${formatHourFromDate(status.nextOpenAt)}`;
  }
  return 'Fermé';
}

// Format "HH:MM" — utilisé pour synchroniser l'affichage display
// (RESTAURANT_INFO.hours dans App.jsx, footer, AboutModal) avec la source
// de vérité. Évite la duplication de magic strings type "11:30-14:00".
export function formatServiceHHMM(svc) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(svc.h)}:${pad(svc.m)}`;
}
