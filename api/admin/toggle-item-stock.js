// api/admin/toggle-item-stock.js — Vercel Function
// Toggle rupture/disponibilité d'un plat — bascule app_settings.out_of_stock_items
// (JSONB array de strings d'ids). Visible côté client via useOutOfStock (polling 30s).
//
// Auth : JWT Supabase admin (Authorization: Bearer ...), même pattern que
// api/admin/toggle-kitchen.js — supabaseAdmin.auth.getUser(token) suffit.

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
    console.warn('[KaïKaï item-stock] auth invalide', authError);
    return res.status(401).json({ error: 'Token invalide' });
  }

  // 2. Validation body
  const { itemId, available } = req.body || {};
  if (typeof itemId !== 'string' || !itemId.trim()) {
    return res.status(400).json({ error: '`itemId` doit être une string non vide' });
  }
  if (typeof available !== 'boolean') {
    return res.status(400).json({ error: '`available` doit être un boolean strict' });
  }

  // 3. Lecture de la liste courante (string array). On tolère que la row
  //    n'existe pas encore — l'upsert plus bas créera la clé.
  const { data: row, error: readErr } = await supabaseAdmin
    .from('app_settings')
    .select('value')
    .eq('key', 'out_of_stock_items')
    .maybeSingle();
  if (readErr) {
    console.error('[KaïKaï item-stock] lecture échec', readErr);
    return res.status(500).json({ error: 'Échec lecture état actuel' });
  }
  const current = Array.isArray(row?.value) ? row.value.filter(x => typeof x === 'string') : [];

  // 4. Mutation : si `available=false` on ajoute, sinon on retire. Set pour dédoublonner.
  let next;
  if (available === false) {
    next = Array.from(new Set([...current, itemId]));
  } else {
    next = current.filter(id => id !== itemId);
  }

  // 5. Upsert (résilient si la row n'existe pas encore)
  const { error: upsertErr } = await supabaseAdmin
    .from('app_settings')
    .upsert(
      { key: 'out_of_stock_items', value: next, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

  if (upsertErr) {
    console.error('[KaïKaï item-stock] échec upsert', upsertErr);
    return res.status(500).json({ error: 'Échec mise à jour' });
  }

  console.log(`[KaïKaï item-stock] admin ${userData.user.email} toggled ${itemId} → available=${available}`);
  return res.status(200).json({ success: true, out_of_stock_items: next });
}
