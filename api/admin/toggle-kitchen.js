// api/admin/toggle-kitchen.js — Vercel Function
// Bascule le mode cuisine (app_settings.kitchen_open) en 3 états :
//   - true  → FORCE ouvert (bypass horaires)
//   - false → FORCE fermé (stop commandes)
//   - null  → AUTO (suit les horaires programmés)
// Côté stockage : true/false → upsert ; null → DELETE de la row (le reader
// useRestaurantOpen interprète "row absente OU value non-boolean" = AUTO,
// ce qui évite de devoir lever la contrainte NOT NULL sur app_settings.value).
// Visible côté client via le hook useRestaurantOpen (polling 30s).
//
// Auth : allowlist admin via requireAdmin (cohérente avec la RLS).

import { supabaseAdmin } from '../_lib/supabaseServer.js';
import { requireAdmin } from '../_lib/requireAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Auth admin (401 si pas/invalide token, 403 si non-admin)
  const adminUser = await requireAdmin(req, res);
  if (!adminUser) return;

  // 2. Validation body : true | false | null uniquement
  const { open } = req.body || {};
  if (open !== true && open !== false && open !== null) {
    return res.status(400).json({ error: '`open` doit être true, false ou null (auto)' });
  }

  // 3. AUTO (null) → on supprime la row. UPSERT(null) côté supabase-js
  //    se traduirait en SQL NULL et violerait JSONB NOT NULL ; on contourne
  //    proprement en s'appuyant sur la sémantique "row absente = auto".
  if (open === null) {
    const { error: delErr } = await supabaseAdmin
      .from('app_settings')
      .delete()
      .eq('key', 'kitchen_open');
    if (delErr) {
      console.error('[KaïKaï kitchen-toggle] échec delete (auto)', delErr);
      return res.status(500).json({ error: 'Échec mise à jour' });
    }
    console.log(`[KaïKaï kitchen-toggle] admin ${adminUser.email} → open=auto`);
    return res.status(200).json({ success: true, open: null });
  }

  // 4. true/false → upsert (résilient si la row n'existe pas encore).
  const { error: upsertErr } = await supabaseAdmin
    .from('app_settings')
    .upsert(
      { key: 'kitchen_open', value: open, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

  if (upsertErr) {
    console.error('[KaïKaï kitchen-toggle] échec upsert', upsertErr);
    return res.status(500).json({ error: 'Échec mise à jour' });
  }

  console.log(`[KaïKaï kitchen-toggle] admin ${adminUser.email} → open=${open}`);
  return res.status(200).json({ success: true, open });
}
