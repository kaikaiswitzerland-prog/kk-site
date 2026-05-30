// src/lib/restaurantHours.js
// Source de vérité unique pour les horaires d'ouverture KaïKaï.
// Utilisable côté front (React via useRestaurantOpen) ET côté serveur (Vercel
// Functions via api/_lib/restaurantHours.js — copie miroir, voir note bas).
//
// Modèle :
//   - Mardi → Dimanche : deux services (lunch 11h-14h, dinner 17h30-22h)
//   - Lundi : fermé toute la journée
//   - Les commandes (pré-commande) sont possibles dès l'ouverture d'un service.
//
// Fuseau : TOUS les calculs (jour, heure, minute) sont faits en Europe/Zurich
// via Intl.DateTimeFormat. Ça neutralise le fuseau du runtime (UTC sur Vercel)
// et celui du device client, et gère nativement le passage CET/CEST.

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

const TZ = 'Europe/Zurich';

// Lit la "wall clock" Zurich (an/mois/jour/heure/minute + jour de la semaine)
// pour un instant donné. Intl gère CET/CEST automatiquement.
function zurichParts(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  // Certains moteurs renvoient "24" pour minuit en hour12:false — on normalise.
  let hour = Number(get('hour'));
  if (hour === 24) hour = 0;
  return {
    year:    Number(get('year')),
    month:   Number(get('month')),
    day:     Number(get('day')),
    hour,
    minute:  Number(get('minute')),
    weekday: WD[get('weekday')],
  };
}

// Construit le Date (instant) qui correspond à une heure-de-mur Zurich donnée.
// Triangulation DST-safe : on part d'une UTC "comme si", on lit ce que Zurich
// affiche à cet instant, et on corrige du décalage. Robuste à CET/CEST hors
// des heures de bascule (2h-3h du matin), ce qui ne nous concerne jamais.
function dateFromZurich(y, mo, d, h, mi) {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const z = zurichParts(new Date(guess));
  const actualMs = Date.UTC(z.year, z.month - 1, z.day, z.hour, z.minute);
  return new Date(guess + (guess - actualMs));
}

function toMinutes({ h, m }) {
  return h * 60 + m;
}

function isDayOff(parts) {
  return DAYS_OFF.includes(parts.weekday);
}

// Construit le Date à l'heure {h,m} du jour-Zurich de `parts`.
function dateAtZurich(parts, { h, m }) {
  return dateFromZurich(parts.year, parts.month, parts.day, h, m);
}

// Renvoie la prochaine date d'ouverture à partir de `now`. Tient compte des
// services restants aujourd'hui, sinon jump au jour suivant, en sautant les
// jours fermés. Garantit la terminaison via un cap de 8 jours (filet de
// sécurité — en pratique, on en trouve toujours un en moins de 8).
function findNextOpenAt(now) {
  const p = zurichParts(now);
  // 1) D'abord, regarde si on peut encore ouvrir aujourd'hui même.
  if (!isDayOff(p)) {
    const cur = p.hour * 60 + p.minute;
    if (cur < toMinutes(LUNCH.open))  return dateAtZurich(p, LUNCH.open);
    if (cur < toMinutes(DINNER.open)) return dateAtZurich(p, DINNER.open);
  }
  // 2) Sinon, on cherche le prochain jour d'ouverture, à partir de demain.
  //    On itère sur le calendrier Zurich en construisant des "midi UTC" qui
  //    tombent toujours dans le même jour-Zurich (Zurich = UTC+1/+2).
  for (let i = 1; i <= 8; i++) {
    const probe = new Date(Date.UTC(p.year, p.month - 1, p.day + i, 12, 0));
    const pp = zurichParts(probe);
    if (!isDayOff(pp)) return dateAtZurich(pp, LUNCH.open);
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
  const p = zurichParts(now);

  if (isDayOff(p)) {
    return {
      isOpen: false,
      reason: 'closed_day',
      currentService: null,
      nextOpenAt: findNextOpenAt(now),
      nextCloseAt: null,
    };
  }

  const cur = p.hour * 60 + p.minute;
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
      nextCloseAt: dateAtZurich(p, LUNCH.close),
    };
  }
  if (cur >= dinnerOpen && cur < dinnerClose) {
    return {
      isOpen: true,
      reason: 'open',
      currentService: 'dinner',
      nextOpenAt: null,
      nextCloseAt: dateAtZurich(p, DINNER.close),
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
  const p = zurichParts(d);
  return formatHour({ h: p.hour, m: p.minute });
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
    const dayName = WEEKDAYS_NAME[zurichParts(status.nextOpenAt).weekday];
    return `Fermé le lundi · ouvre ${dayName} ${formatHourFromDate(status.nextOpenAt)}`;
  }
  if (status.reason === 'closed_hours' && status.nextOpenAt) {
    const today = zurichParts(new Date());
    const next = zurichParts(status.nextOpenAt);
    const sameDay =
      next.year === today.year &&
      next.month === today.month &&
      next.day === today.day;
    if (sameDay) {
      return `Fermé · ouvre à ${formatHourFromDate(status.nextOpenAt)}`;
    }
    const dayName = WEEKDAYS_NAME[next.weekday];
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
