// api/_lib/restaurantHours.js
// COPIE MIROIR de src/lib/restaurantHours.js — utilisée par les Vercel
// Functions (api/*.js) pour éviter les soucis de bundling cross-dir entre
// le client Vite et le serveur Node.
//
// ⚠ Si tu modifies la logique horaires, modifie LES DEUX fichiers ensemble.
// Source de vérité : src/lib/restaurantHours.js (front).
//
// Fuseau : tous les calculs sont faits en Europe/Zurich via Intl. Ça neutralise
// le runtime Vercel (UTC par défaut) et gère CET/CEST automatiquement.

export const DAYS_OFF = [1];

export const LUNCH = {
  open:  { h: 11, m: 0 },
  close: { h: 14, m: 0 },
};

export const DINNER = {
  open:  { h: 17, m: 30 },
  close: { h: 22, m: 0 },
};

const TZ = 'Europe/Zurich';

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

function dateAtZurich(parts, { h, m }) {
  return dateFromZurich(parts.year, parts.month, parts.day, h, m);
}

function findNextOpenAt(now) {
  const p = zurichParts(now);
  if (!isDayOff(p)) {
    const cur = p.hour * 60 + p.minute;
    if (cur < toMinutes(LUNCH.open))  return dateAtZurich(p, LUNCH.open);
    if (cur < toMinutes(DINNER.open)) return dateAtZurich(p, DINNER.open);
  }
  for (let i = 1; i <= 8; i++) {
    const probe = new Date(Date.UTC(p.year, p.month - 1, p.day + i, 12, 0));
    const pp = zurichParts(probe);
    if (!isDayOff(pp)) return dateAtZurich(pp, LUNCH.open);
  }
  return null;
}

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
