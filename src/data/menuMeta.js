// Métadonnées plates des 20 plats du menu — usage admin (ruptures de stock,
// allergènes) et catalogue d'options partagé avec la carte publique.
//
// ⚠ Si un plat est ajouté/retiré du MENU dans App.jsx, dupliquer ici. À
// terme, extraire MENU vers ce fichier et le ré-importer côté client.

import {
  isItemUnavailable as isItemUnavailableRule,
  isOptionOut,
  makeStockKey,
  parseStockKey,
} from '../lib/stockRules.js';

export const MENU_GROUPS = [
  { id: 'entrees',  label: 'Entrées' },
  { id: 'chaud',    label: 'Plats chauds' },
  { id: 'froid',    label: 'Plats froids' },
  { id: 'formules', label: 'Formules' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'boissons', label: 'Boissons' },
];

// ═══════════════════════════════════════════════════════════════════════
// CATALOGUE D'OPTIONS
// ═══════════════════════════════════════════════════════════════════════
// Recopie à l'identique des tableaux d'options qui vivaient inline dans la
// constante MENU de src/App.jsx. Aucun id / name / desc n'a été modifié.
//
// ⚠ Les `name` ne sont PAS cosmétiques : ils sont persistés tels quels dans
// orders.items[].variants (JSONB) et ré-imprimés sur le ticket cuisine via
// renderVariantLines(). Toute retouche de libellé est un changement
// fonctionnel — la traiter comme tel.
//
// Aucune option ne porte de prix : le prix est porté par le plat seul
// (cf. api/_lib/menuPrices.js).

// ─── Options côté carte (constante MENU) ──────────────────────────────

// Plat 1 — Velouté koko
export const VARIANTS_VELOUTE = [
  { id: "froid", name: "Servi froid", desc: "Idéal pour les beaux jours" },
  { id: "chaud", name: "Servi chaud", desc: "Réconfortant et parfumé" }
];

// Plat 4 — Tartare de thon rouge
export const VARIANTS_TARTARE = [
  { id: "tahiti", name: "Tartare Tahiti", desc: "Sauce coco" },
  { id: "hawaii", name: "Tartare Hawaï", desc: "Sauce sésame, mangue et ananas" },
  { id: "samoa", name: "Tartare Samoa", desc: "Sauce piment maison" }
];

// Plats 5 (Chao Men) et 6 (Kai Fan) — tableaux vérifiés strictement
// identiques avant mutualisation.
export const PROTEIN_OPTS_STANDARD = [
  { id: "porc", name: "Porc", desc: "Viande de porc mijotée façon KaïKaï" },
  { id: "poulet", name: "Poulet", desc: "Wok de poulet" },
  { id: "porc-poulet", name: "Porc + Poulet", desc: "Mix des deux viandes" },
  { id: "veggie", name: "Veggie", desc: "100% végétarien" }
];

// Plat 7 — Omelette Fu Young (jeu réduit, ordre inversé vs STANDARD)
export const PROTEIN_OPTS_OMELETTE = [
  { id: "veggie", name: "Veggie", desc: "100% végétarien" },
  { id: "poulet", name: "Poulet", desc: "Avec poulet" }
];

// Plats 16 (Crème Tropicale) et 18 (Cheesecake) — vérifiés identiques.
export const COULIS_OPTS = [
  { id: "mangue", name: "Coulis Mangue", desc: "Doux et tropical" },
  { id: "fruits-rouges", name: "Coulis Fruits Rouges", desc: "Frais et acidulé" }
];

// Plat 19 — Jus exotiques. L'emoji fait partie du `name` (JusModal le retire
// à l'affichage via une regex, mais le name complet part en DB).
export const JUS_OPTS = [
  { id: "pomme-kiwi", name: "🍏 Pomme/Kiwi", desc: "Frais et vitaminé" },
  { id: "fraise-framboise", name: "🍓 Fraise/Framboise", desc: "Doux et fruité" },
  { id: "ananas-citron", name: "🍍 Ananas/Citron/Gingembre", desc: "Tropical et piquant" },
  { id: "ace", name: "🍊 Cocktail ACE", desc: "Vitaminé (A, C, E)" }
];

// Plat 20 — Eau. Même remarque que JUS_OPTS sur l'emoji dans le `name`.
export const EAU_OPTS = [
  { id: "plate", name: "💧 Eau Plate", desc: "Eau minérale naturelle" },
  { id: "gazeuse", name: "🫧 Eau Gazeuse", desc: "Eau pétillante" }
];

// ═══════════════════════════════════════════════════════════════════════
// PLATS
// ═══════════════════════════════════════════════════════════════════════
// Les tableaux d'options sont attachés sous les MÊMES noms de champ que dans
// la constante MENU de App.jsx, pour que getItemOptions() (stockRules.js)
// fonctionne indifféremment sur un plat de MENU ou sur une entrée d'ici.

export const MENU_ITEMS = [
  { id: '1',  name: 'Velouté koko',         category: 'entrees', variants: VARIANTS_VELOUTE },
  { id: '2',  name: 'Salade Tropicale',     category: 'entrees' },
  { id: '3',  name: 'Salade de poulet',     category: 'entrees' },
  { id: '4',  name: 'Tartare de thon rouge', category: 'entrees', variants: VARIANTS_TARTARE },

  { id: '5',  name: 'Chao Men',             category: 'chaud', proteinVariants: PROTEIN_OPTS_STANDARD },
  { id: '6',  name: 'Kai Fan',              category: 'chaud', proteinVariants: PROTEIN_OPTS_STANDARD },
  { id: '7',  name: 'Omelette Fu Young',    category: 'chaud', proteinVariants: PROTEIN_OPTS_OMELETTE },
  { id: '8',  name: 'Wok de Bœuf',          category: 'chaud' },

  { id: '9',  name: 'Tahiti',               category: 'froid' },
  { id: '10', name: 'Hawaï',                category: 'froid' },
  { id: '11', name: 'Samoa',                category: 'froid' },
  { id: '12', name: 'Manoa',                category: 'froid' },

  { id: '13', name: 'Formule Découverte',   category: 'formules', hasFormule: true, formuleType: 'decouverte' },
  { id: '14', name: 'Formule Voyage',       category: 'formules', hasFormule: true, formuleType: 'voyage' },

  { id: '15', name: 'Coulant au chocolat',  category: 'desserts' },
  { id: '16', name: 'Crème Tropicale',      category: 'desserts', coulisVariants: COULIS_OPTS },
  { id: '17', name: "Po'e Banane",          category: 'desserts' },
  { id: '18', name: 'Cheesecake',           category: 'desserts', coulisVariants: COULIS_OPTS },

  { id: '19', name: 'Jus exotiques',        category: 'boissons', jusVariants: JUS_OPTS },
  { id: '20', name: 'Eau plate/gazeuse',    category: 'boissons', eauVariants: EAU_OPTS },
];

export const MENU_ITEMS_BY_ID = Object.fromEntries(
  MENU_ITEMS.map((it) => [it.id, it]),
);

// Regroupement par catégorie dans l'ordre de MENU_GROUPS.
export function getMenuByGroup() {
  return MENU_GROUPS.map(group => ({
    ...group,
    items: MENU_ITEMS.filter(it => it.category === group.id),
  }));
}

// ─── Options côté formules (FormuleModal) ─────────────────────────────
// Les formules ont TOUJOURS eu leur propre jeu d'options, qui diverge de
// celui de la carte sur 3 familles (constaté, pas introduit ici) :
//
//   protéines std  → desc "Mix des deux"  au lieu de "Mix des deux viandes"
//   jus            → "Pomme / Kiwi" (espacé, sans emoji dans le name) au lieu
//                    de "🍏 Pomme/Kiwi" ; desc "Vitaminé A, C, E" au lieu de
//                    "Vitaminé (A, C, E)"
//   eau            → "Eau Plate" au lieu de "💧 Eau Plate"
//
// Ces `name` sont stockés en DB (FormuleModal persiste opt.name) et imprimés
// sur le ticket : on les conserve à l'octet près. Les 2 familles réellement
// identiques (omelette, coulis) sont dérivées du catalogue carte.

// Emojis d'options — séparés du catalogue partagé, uniquement consommés par
// SubSheet pour l'affichage. Clés = id d'option (pas de collision entre familles).
export const OPTION_EMOJIS = {
  porc: '🍖',
  poulet: '🍗',
  'porc-poulet': '🍽️',
  veggie: '🥦',
  mangue: '🥭',
  'fruits-rouges': '🫐',
  'pomme-kiwi': '🍏',
  'fraise-framboise': '🍓',
  'ananas-citron': '🍍',
  ace: '🍊',
  plate: '💧',
  gazeuse: '🫧',
};

const withEmoji = (opts) => opts.map(o => ({ ...o, emoji: OPTION_EMOJIS[o.id] }));

// Diverge de PROTEIN_OPTS_STANDARD : desc de `porc-poulet`.
export const FORMULE_PROTEIN_OPTS_STANDARD = withEmoji([
  { id: 'porc', name: 'Porc', desc: 'Viande de porc mijotée façon KaïKaï' },
  { id: 'poulet', name: 'Poulet', desc: 'Wok de poulet' },
  { id: 'porc-poulet', name: 'Porc + Poulet', desc: 'Mix des deux' },
  { id: 'veggie', name: 'Veggie', desc: '100% végétarien' },
]);

// Strictement identique à PROTEIN_OPTS_OMELETTE (emoji mis à part) → dérivé.
export const FORMULE_PROTEIN_OPTS_OMELETTE = withEmoji(PROTEIN_OPTS_OMELETTE);

// Strictement identique à COULIS_OPTS (emoji mis à part) → dérivé.
export const FORMULE_COULIS_OPTS = withEmoji(COULIS_OPTS);

// Diverge de JUS_OPTS : names espacés et sans emoji, desc du cocktail ACE.
export const FORMULE_JUS_OPTS = withEmoji([
  { id: 'pomme-kiwi', name: 'Pomme / Kiwi', desc: 'Frais et vitaminé' },
  { id: 'fraise-framboise', name: 'Fraise / Framboise', desc: 'Doux et fruité' },
  { id: 'ananas-citron', name: 'Ananas / Citron / Gingembre', desc: 'Tropical et piquant' },
  { id: 'ace', name: 'Cocktail ACE', desc: 'Vitaminé A, C, E' },
]);

// Diverge de EAU_OPTS : names sans emoji.
export const FORMULE_EAU_OPTS = withEmoji([
  { id: 'plate', name: 'Eau Plate', desc: 'Eau minérale naturelle' },
  { id: 'gazeuse', name: 'Eau Gazeuse', desc: 'Eau pétillante' },
]);

// ─── Libellés de formule → id de plat ─────────────────────────────────
// FormuleModal manipule ses plats/desserts par NOM (chaînes en dur), pas par
// id. Cette table fait le pont.
//
// ⚠ Deux pièges vérifiés :
//
//  1. Les 3 libellés « Tartare … » ne correspondent à AUCUN name de MENU_ITEMS
//     (le menu dit "Tahiti" / "Hawaï" / "Samoa"). Le rattachement aux plats
//     froids 9/10/11 est confirmé : ce sont bien les plats froids, pas les
//     variantes de l'entrée 4 (corroboré par src/data/allergens.js:71-73).
//
//  2. Ces mêmes chaînes sont AUSSI, à l'octet près, les `name` des variantes
//     du plat 4 (VARIANTS_TARTARE), dont les clés de rupture sont "4:tahiti",
//     "4:hawaii", "4:samoa" — distinctes de "9" / "10" / "11". Entrée tartare
//     et plat froid sont deux produits différents : ne jamais résoudre un
//     libellé de formule autrement que via cette table.
export const FORMULE_NAME_TO_ID = {
  'Chao Men': '5', 'Kai Fan': '6', 'Omelette Fu Young': '7', 'Wok de Bœuf': '8',
  'Tartare Tahiti': '9', 'Tartare Hawaï': '10', 'Tartare Samoa': '11',
  'Coulant au chocolat': '15', 'Crème Tropicale': '16', "Po'e Banane": '17',
  'Cheesecake': '18',
};

// Dans une formule, le jus et l'eau sont les plats 19 et 20 de la carte :
// une rupture "19:ace" retire donc aussi le cocktail ACE des formules.
export const FORMULE_JUS_ITEM_ID = '19';
export const FORMULE_EAU_ITEM_ID = '20';

// ─── Libellé d'option de formule → id d'option ────────────────────────
// FormuleModal persiste opt.name (pas opt.id) et ce format de payload ne
// change pas. Cette table inverse est GÉNÉRÉE depuis les catalogues FORMULE_*
// pour rester synchronisée automatiquement.
//
// Séparée par famille volontairement : deux familles pourraient un jour
// employer le même libellé pour des ids différents, une table à plat les
// écraserait silencieusement. (Au sein de la famille `protein`, STANDARD et
// OMELETTE partagent "Poulet"/"Veggie" avec les MÊMES ids — fusion sûre,
// vérifiée par assertNoFormuleNameCollision ci-dessous.)
const byName = (opts) => Object.fromEntries(opts.map((o) => [o.name, o.id]));

export const FORMULE_OPTION_NAME_TO_ID = {
  protein: { ...byName(FORMULE_PROTEIN_OPTS_STANDARD), ...byName(FORMULE_PROTEIN_OPTS_OMELETTE) },
  coulis: byName(FORMULE_COULIS_OPTS),
  jus: byName(FORMULE_JUS_OPTS),
  eau: byName(FORMULE_EAU_OPTS),
};

// Garde-fou de développement : si un même libellé désignait deux ids
// différents dans la famille protein, la fusion ci-dessus perdrait de
// l'information silencieusement. Retourne la liste des conflits ([] si sain).
export function findFormuleNameCollisions() {
  const conflicts = [];
  const seen = new Map();
  [...FORMULE_PROTEIN_OPTS_STANDARD, ...FORMULE_PROTEIN_OPTS_OMELETTE].forEach((o) => {
    const prev = seen.get(o.name);
    if (prev && prev !== o.id) conflicts.push({ family: 'protein', name: o.name, ids: [prev, o.id] });
    seen.set(o.name, o.id);
  });
  return conflicts;
}

// ═══════════════════════════════════════════════════════════════════════
// RÉSOLUTION D'UNE VARIANTE → CLÉS DE RUPTURE
// ═══════════════════════════════════════════════════════════════════════
// Une entrée de orders.items[].variants peut être :
//   - une string legacy            → non résolvable, aucune contrainte
//   - une variante simple {id,...} → clé "<platId>:<optionId>"
//   - une formule {type:'decouverte'|'voyage', ...} → plusieurs plats + options
//
// variantRefs() rend les deux natures de dépendance séparément :
//   itemIds    → plats dont dépend cette unité (à passer à isItemUnavailable,
//                pour bénéficier de la cascade)
//   optionKeys → clés d'option exactes à tester
const pushKey = (refs, itemId, optionId) => {
  const key = makeStockKey(itemId, optionId);
  if (key && parseStockKey(key).optionId) refs.optionKeys.push(key);
};

function pushFormulePlat(refs, platName, proteinName) {
  const platId = FORMULE_NAME_TO_ID[platName];
  if (!platId) return;
  refs.itemIds.push(platId);
  const proteinId = proteinName ? FORMULE_OPTION_NAME_TO_ID.protein[proteinName] : null;
  if (proteinId) pushKey(refs, platId, proteinId);
}

function pushFormuleDessert(refs, dessertName, coulisName) {
  const dessertId = FORMULE_NAME_TO_ID[dessertName];
  if (!dessertId) return;
  refs.itemIds.push(dessertId);
  const coulisId = coulisName ? FORMULE_OPTION_NAME_TO_ID.coulis[coulisName] : null;
  if (coulisId) pushKey(refs, dessertId, coulisId);
}

function pushFormuleJus(refs, jusName) {
  if (!jusName) return;
  refs.itemIds.push(FORMULE_JUS_ITEM_ID);
  const jusId = FORMULE_OPTION_NAME_TO_ID.jus[jusName];
  if (jusId) pushKey(refs, FORMULE_JUS_ITEM_ID, jusId);
}

function pushFormuleEau(refs, eauName) {
  if (!eauName) return;
  refs.itemIds.push(FORMULE_EAU_ITEM_ID);
  const eauId = FORMULE_OPTION_NAME_TO_ID.eau[eauName];
  if (eauId) pushKey(refs, FORMULE_EAU_ITEM_ID, eauId);
}

export function variantRefs(itemId, variant) {
  const refs = { itemIds: [], optionKeys: [] };
  if (!variant || typeof variant !== 'object') return refs; // string legacy / null

  try {
    // Formule Découverte
    if (variant.type === 'decouverte') {
      if (variant.plat) pushFormulePlat(refs, variant.plat, variant.proteins?.[variant.plat]);
      if (variant.boisson === 'Jus exotique') pushFormuleJus(refs, variant.jus);
      else if (variant.boisson === 'Eau') pushFormuleEau(refs, variant.eau);
      if (variant.dessert) pushFormuleDessert(refs, variant.dessert, variant.coulisDessert);
      return refs;
    }

    // Formule Voyage — zipping ordonné boissons[] / jus[] / eau[], miroir de
    // renderVariantLines() (orderHelpers.js).
    if (variant.type === 'voyage') {
      const plats = Array.isArray(variant.plats) ? variant.plats : [];
      plats.forEach((plat, idx) => {
        const protein = Array.isArray(variant.proteins)
          ? variant.proteins[idx]
          : variant.proteins?.[plat];
        pushFormulePlat(refs, plat, protein);
      });

      const boissons = Array.isArray(variant.boissons) ? variant.boissons : [];
      const jusList = Array.isArray(variant.jus) ? variant.jus : [];
      const eauList = Array.isArray(variant.eau) ? variant.eau : [];
      let jusIdx = 0;
      let eauIdx = 0;
      boissons.forEach((b) => {
        if (b === 'Jus exotique') pushFormuleJus(refs, jusList[jusIdx++]);
        else if (b === 'Eau') pushFormuleEau(refs, eauList[eauIdx++]);
        // 'Soft' : pas d'article de carte associé → aucune contrainte de stock
      });

      if (variant.dessert) pushFormuleDessert(refs, variant.dessert, variant.coulisDessert);
      return refs;
    }

    // Variante simple {id, name, desc}
    if (typeof variant.id === 'string' && variant.id.trim()) {
      pushKey(refs, itemId, variant.id);
    }
  } catch {
    // Variante au format inattendu : on renvoie ce qu'on a pu résoudre plutôt
    // que de faire échouer l'appelant (purge panier / garde-fou checkout).
  }
  return refs;
}

// Cette unité précise (1 exemplaire du plat, avec ses choix) est-elle devenue
// incommandable ? Vrai si une option choisie est en rupture, ou si l'un des
// plats impliqués est indisponible (rupture explicite ou cascade).
export function isVariantUnavailable(list, itemId, variant, itemsById = MENU_ITEMS_BY_ID) {
  const { itemIds, optionKeys } = variantRefs(itemId, variant);

  for (const key of optionKeys) {
    const { itemId: kItem, optionId } = parseStockKey(key);
    if (isOptionOut(list, kItem, optionId)) return true;
  }
  return itemIds.some((id) => isItemUnavailableRule(list, itemsById?.[id]));
}
