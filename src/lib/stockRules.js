// src/lib/stockRules.js — Règles de disponibilité (plat + option).
//
// Source unique de vérité, partagée client / admin / API. Fonctions pures :
// aucune dépendance React, Supabase, Vite ou catalogue. Tout se calcule à
// partir de la liste brute app_settings.out_of_stock_items et d'un objet plat.
//
// Importé côté serveur par api/create-checkout.js et api/admin/toggle-item-stock.js
// (le file-tracing Vercel résout bien ../../src/... — vérifié via @vercel/nft),
// donc PAS de miroir dans api/_lib : ce fichier est l'unique exemplaire.
//
// ─── Format des clés ───────────────────────────────────────────────────
//   "5"       → le plat 5 entier est en rupture
//   "5:porc"  → seule l'option "porc" du plat 5 est en rupture
//
// Un plat sans option n'est indisponible que s'il est explicitement en rupture.
// Un plat AVEC options devient indisponible « par cascade » quand toutes ses
// options sont en rupture — cette cascade est CALCULÉE, jamais persistée.
//
// Toutes les fonctions sont défensives : liste vide/absente, plat inconnu,
// options manquantes ou clé malformée ne lèvent jamais.

export const STOCK_KEY_SEP = ':';

// Champs porteurs d'options dans un plat, dans l'ordre de priorité de
// handlePlusClick (App.jsx). On ne code en dur AUCUN id de plat : la famille
// se déduit du champ présent sur l'objet.
export const OPTION_FIELDS = [
  'variants',
  'jusVariants',
  'proteinVariants',
  'coulisVariants',
  'eauVariants',
];

const asKeyList = (list) =>
  Array.isArray(list) ? list.filter((x) => typeof x === 'string') : [];

const asId = (v) => (v == null ? '' : String(v).trim());

// "5" → { itemId:'5', optionId:null } ; "5:porc" → { itemId:'5', optionId:'porc' }
// Toute clé malformée ("", ":porc", "5:", "5:a:b") → { itemId:null, optionId:null }.
export function parseStockKey(key) {
  const empty = { itemId: null, optionId: null };
  if (typeof key !== 'string') return empty;
  const raw = key.trim();
  if (!raw) return empty;

  const sep = raw.indexOf(STOCK_KEY_SEP);
  if (sep < 0) return { itemId: raw, optionId: null };

  const itemId = raw.slice(0, sep).trim();
  const optionId = raw.slice(sep + 1).trim();
  if (!itemId || !optionId) return empty;
  if (optionId.includes(STOCK_KEY_SEP)) return empty; // un seul deux-points
  return { itemId, optionId };
}

// makeStockKey('5') → '5' ; makeStockKey('5','porc') → '5:porc'
export function makeStockKey(itemId, optionId = null) {
  const id = asId(itemId);
  if (!id) return '';
  const opt = asId(optionId);
  return opt ? `${id}${STOCK_KEY_SEP}${opt}` : id;
}

// Le plat est-il en rupture EXPLICITE (clé sans option) ? Ignore la cascade.
export function isItemExplicitlyOut(list, itemId) {
  const id = asId(itemId);
  if (!id) return false;
  return asKeyList(list).some((k) => {
    const p = parseStockKey(k);
    return p.optionId === null && p.itemId === id;
  });
}

// L'option précise est-elle en rupture ?
export function isOptionOut(list, itemId, optionId) {
  const id = asId(itemId);
  const opt = asId(optionId);
  if (!id || !opt) return false;
  return asKeyList(list).some((k) => {
    const p = parseStockKey(k);
    return p.itemId === id && p.optionId === opt;
  });
}

// Options d'un plat, quelle que soit sa famille. [] si le plat n'en a pas.
export function getItemOptions(menuItem) {
  if (!menuItem || typeof menuItem !== 'object') return [];
  for (const field of OPTION_FIELDS) {
    const arr = menuItem[field];
    if (Array.isArray(arr) && arr.length > 0) {
      return arr.filter((o) => o && typeof o === 'object' && asId(o.id));
    }
  }
  return [];
}

// Options encore commandables. Un plat explicitement en rupture n'en a aucune
// (le toggle plat entier prime sur les toggles d'options).
export function availableOptions(list, menuItem) {
  const options = getItemOptions(menuItem);
  if (options.length === 0) return [];
  const id = asId(menuItem?.id);
  if (isItemExplicitlyOut(list, id)) return [];
  return options.filter((o) => !isOptionOut(list, id, o.id));
}

// Indisponible = rupture explicite OU (a des options ET toutes en rupture).
export function isItemUnavailable(list, menuItem) {
  if (!menuItem || typeof menuItem !== 'object') return false;
  const id = asId(menuItem.id);
  if (!id) return false;
  if (isItemExplicitlyOut(list, id)) return true;

  const options = getItemOptions(menuItem);
  if (options.length === 0) return false; // plat sans option : explicite seulement
  return options.every((o) => isOptionOut(list, id, o.id)); // cascade
}
