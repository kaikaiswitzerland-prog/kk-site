// Métadonnées plates des 20 plats du menu — usage admin (ruptures de stock,
// allergènes). Tiré du MENU défini dans src/App.jsx (qui contient en plus
// les prix, descriptions, variantes nécessaires côté client).
//
// ⚠ Si un plat est ajouté/retiré du MENU dans App.jsx, dupliquer ici. À
// terme, extraire MENU vers ce fichier et le ré-importer côté client.

export const MENU_GROUPS = [
  { id: 'entrees',  label: 'Entrées' },
  { id: 'chaud',    label: 'Plats chauds' },
  { id: 'froid',    label: 'Plats froids' },
  { id: 'formules', label: 'Formules' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'boissons', label: 'Boissons' },
];

export const MENU_ITEMS = [
  { id: '1',  name: 'Velouté koko',         category: 'entrees' },
  { id: '2',  name: 'Salade Tropicale',     category: 'entrees' },
  { id: '3',  name: 'Salade de poulet',     category: 'entrees' },
  { id: '4',  name: 'Tartare de thon rouge', category: 'entrees' },

  { id: '5',  name: 'Chao Men',             category: 'chaud' },
  { id: '6',  name: 'Kai Fan',              category: 'chaud' },
  { id: '7',  name: 'Omelette Fu Young',    category: 'chaud' },
  { id: '8',  name: 'Wok de Bœuf',          category: 'chaud' },

  { id: '9',  name: 'Tahiti',               category: 'froid' },
  { id: '10', name: 'Hawaï',                category: 'froid' },
  { id: '11', name: 'Samoa',                category: 'froid' },
  { id: '12', name: 'Manoa',                category: 'froid' },

  { id: '13', name: 'Formule Découverte',   category: 'formules' },
  { id: '14', name: 'Formule Voyage',       category: 'formules' },

  { id: '15', name: 'Coulant au chocolat',  category: 'desserts' },
  { id: '16', name: 'Crème Tropicale',      category: 'desserts' },
  { id: '17', name: "Po'e Banane",          category: 'desserts' },
  { id: '18', name: 'Cheesecake',           category: 'desserts' },

  { id: '19', name: 'Jus exotiques',        category: 'boissons' },
  { id: '20', name: 'Eau plate/gazeuse',    category: 'boissons' },
];

// Regroupement par catégorie dans l'ordre de MENU_GROUPS.
export function getMenuByGroup() {
  return MENU_GROUPS.map(group => ({
    ...group,
    items: MENU_ITEMS.filter(it => it.category === group.id),
  }));
}

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
// id. Cette table fait le pont, en prévision du chantier « disponibilité ».
//
// ⚠ Deux pièges vérifiés :
//
//  1. Les 3 libellés « Tartare … » ne correspondent à AUCUN name de MENU_ITEMS
//     (le menu dit "Tahiti" / "Hawaï" / "Samoa"). Le rattachement aux plats
//     froids 9/10/11 est corroboré par src/data/allergens.js:71-73, qui
//     commente ces mêmes ids « Tartare Tahiti / Hawaï / Samoa ».
//
//  2. Ces mêmes chaînes sont AUSSI, à l'octet près, les `name` des variantes
//     du plat 4 (VARIANTS_TARTARE). Un rapprochement par nom est donc
//     ambigu : ne jamais résoudre un libellé de formule autrement que via
//     cette table.
//
// Table non consommée pour l'instant — introduite sans effet fonctionnel.
export const FORMULE_NAME_TO_ID = {
  'Chao Men': '5', 'Kai Fan': '6', 'Omelette Fu Young': '7', 'Wok de Bœuf': '8',
  'Tartare Tahiti': '9', 'Tartare Hawaï': '10', 'Tartare Samoa': '11',
  'Coulant au chocolat': '15', 'Crème Tropicale': '16', "Po'e Banane": '17',
  'Cheesecake': '18',
};
