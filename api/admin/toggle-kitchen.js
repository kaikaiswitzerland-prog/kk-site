// api/admin/toggle-kitchen.js — Vercel Function
// Toggle "Stop commandes" : bascule app_settings.kitchen_open (true/false).
// Visible côté client via le hook useRestaurantOpen (polling 30s).
//
// Auth : JWT Supabase admin (Authorization: Bearer ...), même pattern que
// api/sumup-refund.js. supabaseAdmin.auth.getUser(token) suffit pour le
// scope actuel — tout utilisateur authentifié peut toggler. Si on veut
// scope plus strict plus tard (RLS profil "admin"), on ajoutera ici.

import { supabaseAdmin } from '../_lib/supabaseServer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Auth check
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !userData?.user) {
    console.warn('[KaïKaï kitchen-toggle] auth invalide', authError);
    return res.status(401).json({ error: 'Token invalide' });
  }

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

  console.log(`[KaïKaï kitchen-toggle] admin ${userData.user.email} → open=${open}`);
  return res.status(200).json({ success: true, open });
}
