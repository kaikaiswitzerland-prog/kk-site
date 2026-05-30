// api/admin/toggle-kitchen.js — Vercel Function
// Toggle "Stop commandes" : bascule app_settings.kitchen_open (true/false).
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

  // 2. Validation body (strict boolean — pas de "true"/"false" string)
  const { open } = req.body || {};
  if (typeof open !== 'boolean') {
    return res.status(400).json({ error: '`open` doit être un boolean strict' });
  }

  // 3. Upsert : on tolère que la row n'existe pas encore (resilient
  // si la migration n'a pas seedé la clé pour une raison ou une autre).
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
