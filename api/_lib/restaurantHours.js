// api/_lib/restaurantHours.js
// COPIE MIROIR de src/lib/restaurantHours.js — utilisée par les Vercel
// Functions (api/*.js) pour éviter les soucis de bundling cross-dir entre
// le client Vite et le serveur Node.
//
// ⚠ Si tu modifies la logique horaires, modifie LES DEUX fichiers ensemble.
// Source de vérité : src/lib/restaurantHours.js (front).

export const DAYS_OFF = [1];

export const LUNCH = {
  open:  { h: 11, m: 0 },
  close: { h: 14, m: 0 },
};

export const DINNER = {
  open:  { h: 17, m: 30 },
  close: { h: 22, m: 0 },
};

function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function toMinutes({ h, m }) {
  return h * 60 + m;
}

function isDayOff(date) {
  return DAYS_OFF.includes(date.getDay());
}

function dateAt(date, { h, m }) {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function findNextOpenAt(now) {
  if (!isDayOff(now)) {
    const cur = minutesOfDay(now);
    if (cur < toMinutes(LUNCH.open))  return dateAt(now, LUNCH.open);
    if (cur < toMinutes(DINNER.open)) return dateAt(now, DINNER.open);
  }
  for (let i = 1; i <= 8; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    if (!isDayOff(d)) return dateAt(d, LUNCH.open);
  }
  return null;
}

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

function formatHour({ h, m }) {
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function formatHourFromDate(d) {
  return formatHour({ h: d.getHours(), m: d.getMinutes() });
}

const WEEKDAYS_NAME = [
  'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi',
];

export function formatStatusLabel(status) {
  if (status.isOpen && status.nextCloseAt) {
    return `Ouvert · ferme à ${formatHourFromDate(status.nextCloseAt)}`;
  }
  if (status.reason === 'closed_day' && status.nextOpenAt) {
    const dayName = WEEKDAYS_NAME[status.nextOpenAt.getDay()];
    return `Fermé le lundi · ouvre ${dayName} ${formatHourFromDate(status.nextOpenAt)}`;
  }
  if (status.reason === 'closed_hours' && status.nextOpenAt) {
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
