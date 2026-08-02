// api/admin/toggle-item-stock.js — Vercel Function
// Toggle rupture/disponibilité — bascule app_settings.out_of_stock_items
// (JSONB array de strings). Visible côté client via useOutOfStock (polling 30s).
//
// `itemId` accepte deux formes :
//   "5"       → le plat 5 entier
//   "5:porc"  → la seule option "porc" du plat 5
//
// Auth : allowlist admin via requireAdmin (cohérente avec la RLS).

import { supabaseAdmin } from '../_lib/supabaseServer.js';
import { requireAdmin } from '../_lib/requireAdmin.js';
import { MENU_ITEMS_BY_ID } from '../../src/data/menuMeta.js';
import { getItemOptions, makeStockKey, parseStockKey } from '../../src/lib/stockRules.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Auth admin (401 si pas/invalide token, 403 si non-admin)
  const adminUser = await requireAdmin(req, res);
  if (!adminUser) return;

  // 2. Validation body
  const { itemId, available } = req.body || {};
  if (typeof itemId !== 'string' || !itemId.trim()) {
    return res.status(400).json({ error: '`itemId` doit être une string non vide' });
  }
  if (typeof available !== 'boolean') {
    return res.status(400).json({ error: '`available` doit être un boolean strict' });
  }

  // 2bis. Validation de la clé contre le catalogue. Absente jusqu'ici : on
  // pouvait écrire n'importe quelle chaîne dans out_of_stock_items, donc
  // fabriquer des entrées mortes qu'aucune UI ne permet de retirer ensuite.
  const { itemId: platId, optionId } = parseStockKey(itemId);
  if (!platId) {
    return res.status(400).json({
      error: `Clé invalide : « ${itemId} ». Format attendu « 5 » ou « 5:porc ».`,
    });
  }
  const menuItem = MENU_ITEMS_BY_ID[platId];
  if (!menuItem) {
    return res.status(400).json({ error: `Plat inconnu : « ${platId} »` });
  }
  if (optionId) {
    const options = getItemOptions(menuItem);
    if (!options.some((o) => o.id === optionId)) {
      const known = options.map((o) => o.id).join(', ') || 'aucune';
      return res.status(400).json({
        error: `Option « ${optionId} » inconnue pour « ${menuItem.name} » (options : ${known})`,
      });
    }
  }
  // Clé normalisée : évite qu'un espace parasite crée un doublon fantôme.
  const stockKey = makeStockKey(platId, optionId);

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
    next = Array.from(new Set([...current, stockKey]));
  } else {
    next = current.filter(id => id !== stockKey);
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

  console.log(`[KaïKaï item-stock] admin ${adminUser.email} toggled ${stockKey} → available=${available}`);
  return res.status(200).json({ success: true, out_of_stock_items: next });
}
