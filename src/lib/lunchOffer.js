// src/lib/lunchOffer.js
//
// Offre du midi (14.10.2026) : Chao men ou Kai fan, viande au choix, 14.90 CHF,
// de 11h30 à 16h00 heure de Genève, uniquement sur le site.
//
// Source UNIQUE du créneau : lue par le front (grisage, garde du Checkout) ET
// par le serveur (api/create-checkout.js refuse en 409 hors créneau).

export const LUNCH_ITEM_ID = '26';
export const LUNCH_START = '11:30';
export const LUNCH_END = '16:00';
export const LUNCH_LABEL = 'Disponible de 11h30 à 16h';

const TZ = 'Europe/Zurich';

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Minutes écoulées depuis minuit, heure de Genève (CET/CEST géré par Intl).
export function genevaMinutes(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  return h * 60 + m;
}

// Vrai de 11:30 inclus à 16:00 exclu.
export function isLunchWindow(now = new Date()) {
  const t = genevaMinutes(now);
  return t >= toMinutes(LUNCH_START) && t < toMinutes(LUNCH_END);
}

export function hasLunchItem(items) {
  return Array.isArray(items) && items.some((it) => String(it?.id) === LUNCH_ITEM_ID && Number(it?.qty || 0) > 0);
}
