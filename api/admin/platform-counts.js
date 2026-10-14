// api/admin/platform-counts.js
//
// Saisie manuelle des commandes Uber Eats / Just Eat du jour (conseil du
// 14.10.2026) : sert au bandeau « Objectif » de l'admin. Stocké dans
// app_settings (clé platform_daily) : { 'YYYY-MM-DD': { uber, justeat } }.
// Pas de nouvelle table ni de SQL à lancer.
//
// POST { day: 'YYYY-MM-DD', uber: n, justeat: n } (admin authentifié).

import { supabaseAdmin } from '../_lib/supabaseServer.js';
import { requireAdmin } from '../_lib/requireAdmin.js';

const KEY = 'platform_daily';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const adminUser = await requireAdmin(req, res);
  if (!adminUser) return;

  const { day, uber, justeat } = req.body || {};
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return res.status(400).json({ error: 'Jour invalide' });
  }
  const clean = (n) => Math.max(0, Math.min(999, Math.round(Number(n) || 0)));

  const { data: row, error: readErr } = await supabaseAdmin
    .from('app_settings').select('value').eq('key', KEY).maybeSingle();
  if (readErr) return res.status(500).json({ error: 'Lecture impossible' });

  const value = row?.value && typeof row.value === 'object' && !Array.isArray(row.value) ? { ...row.value } : {};
  value[day] = { uber: clean(uber), justeat: clean(justeat) };

  // On ne garde que les 120 derniers jours saisis.
  const keys = Object.keys(value).sort();
  keys.slice(0, Math.max(0, keys.length - 120)).forEach((k) => { delete value[k]; });

  const { error: upErr } = await supabaseAdmin
    .from('app_settings')
    .upsert({ key: KEY, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (upErr) return res.status(500).json({ error: 'Échec enregistrement' });

  console.log(`[KaïKaï platform-counts] ${adminUser.email} ${day} uber=${value[day].uber} justeat=${value[day].justeat}`);
  return res.status(200).json({ success: true, value });
}
