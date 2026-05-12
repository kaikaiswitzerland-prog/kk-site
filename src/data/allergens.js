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
// `contains` = ingrédients déclarés. `traces` = contamination croisée possible.
export const ITEM_ALLERGENS = {
  // ── ENTRÉES ───────────────────────────────────────────────
  '1': { contains: [], traces: [] },                                                // Velouté koko
  '2': { contains: ['MUSTARD'], traces: [] },                                       // Salade Tropicale
  '3': { contains: ['GLUTEN', 'EGGS', 'SOY', 'MUSTARD'], traces: [] },              // Salade de poulet
  // id 4 (Tartare de thon rouge, entrée à 3 variantes) — non explicitement
  // listé dans le mapping initial. Union des variantes plat-froid Tahiti/
  // Hawaï/Samoa pour rester safe côté allergique.
  '4': { contains: ['GLUTEN', 'FISH', 'SOY', 'SESAME'], traces: [] },

  // ── PLATS CHAUDS ──────────────────────────────────────────
  '5': { contains: ['GLUTEN', 'EGGS', 'SOY', 'SESAME', 'SULPHITES'], traces: [] },                       // Chao Men
  '6': { contains: ['GLUTEN', 'EGGS', 'SOY', 'SESAME', 'SULPHITES'], traces: [] },                       // Kai Fan
  // Union variante "avec poulet" + variante "veggie" — l'avec-poulet
  // chargeait CRUSTACEANS/MOLLUSCS via la sauce, l'autre non. On garde
  // l'union pour ne pas tromper les clients qui choisissent veggie tard.
  '7': { contains: ['GLUTEN', 'EGGS', 'SOY', 'SESAME', 'CRUSTACEANS', 'MOLLUSCS'], traces: [] },         // Omelette Fu Young
  '8': { contains: ['GLUTEN', 'SOY', 'SESAME', 'SULPHITES', 'MOLLUSCS'], traces: [] },                   // Wok de Bœuf

  // ── PLATS FROIDS (les "tartares" du mapping initial) ─────
  '9':  { contains: ['FISH'], traces: [] },                                         // Tahiti
  '10': { contains: ['GLUTEN', 'FISH', 'SOY'], traces: [] },                        // Hawaï
  '11': { contains: ['GLUTEN', 'FISH', 'SOY', 'SESAME'], traces: [] },              // Samoa
  '12': { contains: ['GLUTEN', 'FISH', 'SOY'], traces: [] },                        // Manoa

  // ── FORMULES ─────────────────────────────────────────────
  // Composition variable selon le choix client — défaut vide, à
  // remplir par Enzo s'il souhaite déclarer un set par défaut.
  '13': { contains: [], traces: [] },                                               // Formule Découverte
  '14': { contains: [], traces: [] },                                               // Formule Voyage

  // ── DESSERTS ─────────────────────────────────────────────
  '15': { contains: ['GLUTEN', 'EGGS', 'MILK'], traces: [] },                                                              // Coulant au chocolat
  '16': { contains: ['GLUTEN', 'EGGS', 'MILK', 'NUTS'], traces: [] },                                                      // Crème Tropicale
  '17': { contains: [], traces: [] },                                                                                      // Po'e Banane
  '18': { contains: ['GLUTEN', 'EGGS', 'MILK', 'SOY'], traces: ['MUSTARD', 'SULPHITES', 'NUTS'] },                         // Cheesecake

  // ── BOISSONS ─────────────────────────────────────────────
  // Défaut vide. À valider par Enzo (les jus industriels contiennent
  // souvent des SULPHITES en traces).
  '19': { contains: [], traces: [] },                                               // Jus exotiques
  '20': { contains: [], traces: [] },                                               // Eau plate/gazeuse
};

// Lecture sûre — un id inconnu renvoie une structure vide cohérente.
export function getAllergensForItem(itemId) {
  return ITEM_ALLERGENS[String(itemId)] || { contains: [], traces: [] };
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
