// Données allergènes — Chantier 5
//
// Les 14 allergènes UE / Suisse à déclarer obligatoirement
// (cf. https://www.blv.admin.ch/blv/fr/home/lebensmittel-und-ernaehrung/...).
//
// Le mapping ITEM_ALLERGENS est indexé par l'id string du plat (cf. MENU
// dans src/App.jsx). Pour les plats avec variantes qui changent légèrement
// la composition (ex: Omelette Fu Young veggie vs poulet, Tartare entrée
// à 3 sauces), on déclare l'UNION des allergènes possibles (worst case) —
// approche conservatrice pour les allergiques. Si on veut un mapping par
// variante plus tard, étendre getAllergensForItem(itemId, variantId).
//
// ⚠ Ce fichier doit être validé/corrigé par le restaurateur avant prod.
// Obligation légale Suisse pour la restauration : OSAlEC art. 3.

export const ALLERGENS = {
  GLUTEN:      { name: 'Gluten' },
  CRUSTACEANS: { name: 'Crustacés' },
  EGGS:        { name: 'Œufs' },
  FISH:        { name: 'Poisson' },
  PEANUTS:     { name: 'Arachides' },
  SOY:         { name: 'Soja' },
  MILK:        { name: 'Lait' },
  NUTS:        { name: 'Fruits à coque' },
  CELERY:      { name: 'Céleri' },
  MUSTARD:     { name: 'Moutarde' },
  SESAME:      { name: 'Sésame' },
  SULPHITES:   { name: 'Sulfites' },
  LUPIN:       { name: 'Lupin' },
  MOLLUSCS:    { name: 'Mollusques' },
};

// Mapping plat → allergènes.
// Clés = ids string du MENU (src/App.jsx).
// `contains`  = allergènes du plat lui-même.
// `fromSalad` = allergènes apportés par la salade d'accompagnement (si servie).
// `traces`    = contamination croisée possible.
// Version finale validée par Enzo (tableau PDF Mai 2026).
export const ITEM_ALLERGENS = {
  // ─── ENTRÉES ───
  "1":  { contains: [], traces: [] },                                                          // Velouté Koko
  "2":  { contains: ['PEANUTS', 'MUSTARD'], traces: [] },                                      // Salade Tropicale
  "3":  { contains: ['GLUTEN', 'SOY', 'MUSTARD', 'SESAME', 'MOLLUSCS'], traces: [] },          // Salade de poulet
  "4":  {  // Tartare de thon rouge (entrée) AVEC salade — UNION 3 variantes
    contains: ['FISH', 'SESAME'],
    fromSalad: ['MUSTARD', 'SOY', 'GLUTEN'],
    traces: []
  },

  // ─── PLATS CHAUDS ───
  "5":  { contains: ['GLUTEN', 'EGGS', 'SOY', 'MUSTARD', 'SESAME', 'SULPHITES', 'MOLLUSCS'], traces: [] },  // Chao Men (sans salade)
  "6":  {  // Kai Fan AVEC salade
    contains: ['EGGS', 'SESAME', 'SULPHITES', 'MOLLUSCS'],
    fromSalad: ['MUSTARD', 'SOY', 'GLUTEN'],
    traces: []
  },
  "7":  {  // Omelette Fu Young AVEC salade — UNION normale + végé
    contains: ['EGGS', 'SESAME', 'MOLLUSCS'],
    fromSalad: ['MUSTARD', 'SOY', 'GLUTEN'],
    traces: []
  },
  "8":  {  // Wok de bœuf AVEC salade
    contains: ['SESAME', 'SULPHITES', 'MOLLUSCS'],
    fromSalad: ['MUSTARD', 'SOY', 'GLUTEN'],
    traces: []
  },

  // ─── PLATS FROIDS (TOUS AVEC SALADE) ───
  "9":  { contains: ['FISH'], fromSalad: ['MUSTARD', 'SOY', 'GLUTEN'], traces: [] },            // Tartare Tahiti
  "10": { contains: ['FISH', 'SESAME'], fromSalad: ['MUSTARD', 'SOY', 'GLUTEN'], traces: [] },  // Tartare Hawaï
  "11": { contains: ['FISH'], fromSalad: ['MUSTARD', 'SOY', 'GLUTEN'], traces: [] },            // Tartare Samoa
  "12": { contains: ['FISH', 'PEANUTS'], fromSalad: ['MUSTARD', 'SOY', 'GLUTEN'], traces: [] }, // Tartare Manoa

  // ─── FORMULES (composition variable, message dédié dans UI) ───
  "13": { contains: [], traces: [] },  // Formule Découverte
  "14": { contains: [], traces: [] },  // Formule Voyage

  // ─── DESSERTS (sans salade) ───
  "15": { contains: ['GLUTEN', 'EGGS', 'MILK'], traces: ['NUTS'] },                                          // Coulant au chocolat
  "16": { contains: ['GLUTEN', 'EGGS', 'MILK'], traces: ['NUTS'] },                                          // Crème Tropicale
  "17": { contains: [], traces: ['NUTS'] },                                                                  // Po'e Banane
  "18": { contains: ['GLUTEN', 'EGGS', 'SOY', 'MILK'], traces: ['NUTS', 'MUSTARD', 'SULPHITES'] },           // Cheesecake

  // ─── BOISSONS ───
  "19": { contains: [], traces: [] },  // Jus exotiques
  "20": { contains: [], traces: [] },  // Eau plate/gazeuse
};

// Lecture sûre — un id inconnu renvoie une structure vide cohérente.
export function getAllergensForItem(itemId) {
  return ITEM_ALLERGENS[String(itemId)] || { contains: [], traces: [] };
}

// Retourne TOUS les allergènes (contains + fromSalad) — utilisé pour
// l'affichage compact "worst-case" sur la carte du plat.
export function getAllAllergens(itemAllergens) {
  if (!itemAllergens) return [];
  const c = itemAllergens.contains || [];
  const s = itemAllergens.fromSalad || [];
  return [...new Set([...c, ...s])];
}

// Indique si un plat est servi avec salade d'accompagnement.
export function hasSaladSide(itemAllergens) {
  return !!(itemAllergens?.fromSalad && itemAllergens.fromSalad.length > 0);
}

// Convertit une liste de clés (['GLUTEN','EGGS']) en noms FR ('Gluten, Œufs').
export function formatAllergenNames(keys) {
  return keys.map(k => ALLERGENS[k]?.name || k).join(', ');
}

// Version courte pour la carte — tronque à 3 + compteur si plus.
export function formatAllergenNamesShort(keys, max = 3) {
  if (keys.length === 0) return '';
  const shown = keys.slice(0, max).map(k => ALLERGENS[k]?.name || k);
  const rest = keys.length - max;
  return rest > 0 ? `${shown.join(', ')}, +${rest}` : shown.join(', ');
}
