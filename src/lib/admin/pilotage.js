// src/lib/admin/pilotage.js
//
// Chiffres de PILOTAGE de l'admin (conseil du 14.10.2026) : 4–5 chiffres qui
// répondent à « est-ce qu'on se rapproche de 9 commandes/jour avant le
// 29 décembre ? ». Fonctions pures, calculées sur les commandes déjà chargées
// par l'admin (toutes les commandes directes : site + saisies manuelles).
//
// Conventions : heure de Genève, semaine du LUNDI au dimanche.

import { isRevenue } from './orderHelpers.js';
import { normalizePhone, normalizeEmail } from '../promoCodes.js';
import { qualifiesFreeDelivery } from '../bureauOffer.js';

export const TARGET_PER_DAY = 9;
export const DEADLINE = '2026-12-29';
export const BUREAU_WEEKLY_TARGET = 3;
export const LUNCH_ID = '26';
// Plats comparables vendus plein tarif (18.90) : Chao men, Kai fan et les
// bases « nouilles sautées » / « riz sauté » du composeur.
export const LUNCH_FULL_PRICE_IDS = ['5', '6', '21', '23'];

const TZ = 'Europe/Zurich';
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const hmFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

// 'YYYY-MM-DD' à Genève.
export function genevaDay(d) {
  return dayFmt.format(new Date(d));
}

function minutesGeneva(d) {
  const [h, m] = hmFmt.format(new Date(d)).split(':').map(Number);
  return h * 60 + m;
}

// Décale une clé de jour de n jours (calcul en UTC midi : pas de piège DST).
export function shiftDay(key, n) {
  const t = new Date(`${key}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

// Lundi de la semaine d'une clé de jour.
export function mondayOf(key) {
  const dow = new Date(`${key}T12:00:00Z`).getUTCDay(); // 0 = dimanche
  return shiftDay(key, -((dow + 6) % 7));
}

export function daysUntil(deadline, todayKey) {
  return Math.round((Date.parse(`${deadline}T12:00:00Z`) - Date.parse(`${todayKey}T12:00:00Z`)) / 86400000);
}

export function customerKey(o) {
  return normalizePhone(o?.customer_phone) || normalizeEmail(o?.customer_email) || '';
}

const inDays = (o, from, toExcl) => {
  const k = genevaDay(o.created_at);
  return k >= from && k < toExcl;
};

// platformDaily : { 'YYYY-MM-DD': { uber, justeat } } saisi à la main.
export function computePilotage(orders, platformDaily = {}, now = new Date()) {
  const valid = (orders || []).filter(isRevenue);
  const today = genevaDay(now);
  const tomorrow = shiftDay(today, 1);

  // 1. Objectif : moyenne 7 derniers jours (aujourd'hui inclus).
  const from7 = shiftDay(today, -6);
  const site7 = valid.filter((o) => inDays(o, from7, tomorrow)).length;
  let platforms7 = 0;
  let platformDays = 0;
  for (let i = 0; i < 7; i += 1) {
    const p = platformDaily[shiftDay(today, -i)];
    if (p) {
      platformDays += 1;
      platforms7 += (Number(p.uber) || 0) + (Number(p.justeat) || 0);
    }
  }
  const total7 = site7 + platforms7;
  const objective = {
    perDay: Math.round((total7 / 7) * 10) / 10,
    sitePerDay: Math.round((site7 / 7) * 10) / 10,
    target: TARGET_PER_DAY,
    daysLeft: daysUntil(DEADLINE, today),
    sitePct: total7 > 0 && platformDays > 0 ? Math.round((site7 / total7) * 100) : null,
    platformDays,
  };

  // Semaine en cours (lundi → aujourd'hui) et semaine dernière.
  const weekStart = mondayOf(today);
  const lastWeekStart = shiftDay(weekStart, -7);
  const thisWeek = valid.filter((o) => inDays(o, weekStart, tomorrow));
  const lastWeek = valid.filter((o) => inDays(o, lastWeekStart, weekStart));

  // 2. Nouveaux clients vs clients qui reviennent (cette semaine).
  const firstSeen = new Map();
  [...valid].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).forEach((o) => {
    const k = customerKey(o);
    if (k && !firstSeen.has(k)) firstSeen.set(k, genevaDay(o.created_at));
  });
  const weekCustomers = new Set(thisWeek.map(customerKey).filter(Boolean));
  let fresh = 0;
  weekCustomers.forEach((k) => { if ((firstSeen.get(k) || '') >= weekStart) fresh += 1; });
  const customers = { newCount: fresh, returningCount: weekCustomers.size - fresh };

  // 3. PREMIER (depuis le lancement) : utilisés, remise totale, revenus ensuite.
  const premier = valid.filter((o) => String(o.promo_code || '').toUpperCase() === 'PREMIER');
  let cameBack = 0;
  premier.forEach((p) => {
    const k = customerKey(p);
    if (k && valid.some((o) => o.id !== p.id && customerKey(o) === k && new Date(o.created_at) > new Date(p.created_at))) cameBack += 1;
  });
  const promo = {
    used: premier.length,
    discountTotal: Math.round(premier.reduce((s, o) => s + (Number(o.discount) || 0), 0) * 100) / 100,
    cameBack,
  };

  // 4. Midi (11h30–16h) : plats à 14.90 vs plats comparables à 18.90.
  const lunchSplit = (list) => {
    let offer = 0; let full = 0;
    list.forEach((o) => {
      const m = minutesGeneva(o.created_at);
      if (m < 690 || m >= 960) return;
      (Array.isArray(o.items) ? o.items : []).forEach((it) => {
        const id = String(it?.id);
        const q = Number(it?.qty) || 0;
        if (id === LUNCH_ID) offer += q;
        else if (LUNCH_FULL_PRICE_IDS.includes(id)) full += q;
      });
    });
    const tot = offer + full;
    return { offer, full, offerPct: tot ? Math.round((offer / tot) * 100) : null };
  };
  const lunch = { thisWeek: lunchSplit(thisWeek), lastWeek: lunchSplit(lastWeek) };

  // 5. Bureau : commandes ≥ 5 plats chauds cette semaine.
  const bureau = {
    count: thisWeek.filter((o) => qualifiesFreeDelivery(o.items)).length,
    target: BUREAU_WEEKLY_TARGET,
  };

  return { today, weekStart, objective, customers, promo, lunch, bureau };
}
