// src/refonte/productMeta.js
//
// Métadonnées d'AFFICHAGE de la grille refonte : photo détourée, badge et
// description courte. Ce fichier ne porte AUCUN prix, AUCUNE règle de rupture
// et AUCUNE option : tout cela reste dans MENU (src/App.jsx), menuMeta.js et
// stockRules.js, qui restent les seules sources de vérité côté commande.
//
// Les clés sont les ids de MENU (1 à 24, wok inclus).

// Dossier des PNG détourés. Les fichiers n'existent pas encore — voir
// src/refonte/PHOTOS_PNG.md pour le brief photo complet. Tant qu'un PNG est
// absent, la carte retombe automatiquement sur le JPG actuel (`jpg`), donc la
// grille est déjà consultable aujourd'hui.
export const PNG_DIR = '/plats';

// ─── DESCRIPTIONS COURTES ────────────────────────────────────────────────────
//
// La vignette fait 178 px de large sur mobile, soit ~28 signes tenables sur une
// ligne. Les descriptions officielles (`desc` dans MENU, src/App.jsx) montent
// jusqu'à 90 signes : affichées telles quelles, les quatre tartares de thon
// rouge se couperaient tous sur le même « Thon rouge mariné au citron… », ce
// qui n'apprend rien au client.
//
// `short` est donc une version taillée pour cette largeur, dérivée du `desc`
// officiel sans rien inventer : on garde ce qui distingue le plat. Les plats
// dont le `desc` tient déjà sur une ligne n'ont PAS de `short` — la carte lit
// alors directement `item.desc`.
//
// ⚠ `short` sert UNIQUEMENT à la vignette. Le panier, les modaux d'options, le
// checkout et le ticket cuisine continuent tous d'afficher le `desc` complet.
//
// ⚠ Les avis (« ★ 4.7 (61) ») ont été retirés des cartes : aucune source réelle
// n'existait dans le projet — ni table Supabase, ni import Google Business — et
// les valeurs affichées étaient des placeholders. Les remettre suppose de
// brancher une vraie source d'abord.

// ─── BADGES ──────────────────────────────────────────────────────────────────
//
// Cinq types seulement : 'halal' | 'maison' | 'nouveau' | 'populaire' |
// 'signature'. Un plat n'en porte qu'UN — la pastille est en position absolue
// dans le coin haut-gauche de la photo, deux se superposeraient. Poser un
// nouveau badge sur une carte qui en avait déjà un le REMPLACE donc.
//
// ⚠ 'halal' reste disponible dans le système mais n'est posé sur AUCUN plat, et
// c'est délibéré : le halal se joue au niveau de la GARNITURE, pas du plat.
// Une même base part en poulet comme en porc — l'annoncer sur la fiche produit
// serait faux la moitié du temps. La mention vit donc sur les garnitures du
// composeur (WOK_GARNITURES dans src/App.jsx : Poulet et Bœuf). Ne rien poser
// ici tant que le restaurant n'a pas tranché pour les plats hors composeur.
export const BADGE_LABELS = {
  halal: 'Halal',
  maison: 'Maison',
  nouveau: 'Nouveau',
  populaire: 'Populaire',
  signature: 'Signature',
};

// ─── CADRAGE DES JPG ─────────────────────────────────────────────────────────
//
// `jpgPos` surcharge l'`object-position` du repli JPG. Les photos sont en
// 6000×4000 (3:2) alors que la vignette est carrée : `object-fit: cover` rogne
// donc 2000 px de largeur, 1000 de chaque côté par défaut. Quand le sujet n'est
// pas au centre du cadre photo, ce rognage l'ampute — c'est le cas du
// cheesecake, dont la part est dans le tiers gauche de l'image.
//
// La valeur ne change AUCUNE dimension : `object-position` ne fait que
// déplacer l'image à l'intérieur d'une boîte dont la taille est fixée par le
// CSS. Baisser le pourcentage montre plus du côté GAUCHE de la photo, ce qui
// décale le sujet vers la DROITE dans la vignette.
//
// Les photos d'entrée sont en 4000×6000 (PORTRAIT) : là c'est la HAUTEUR qui
// est rognée de 2000 px, pas la largeur. Le deuxième pourcentage compte donc,
// et monter sa valeur descend la fenêtre dans la photo — ce qui fait REMONTER
// le sujet dans la vignette.
//
// ⚠ Ne s'applique qu'au JPG. Un PNG détouré s'affiche en `contain` et doit
// rester centré : ProductCard ignore `jpgPos` dans ce cas.

export const PRODUCT_META = {
  // ── Entrées ──────────────────────────────────────────────────────────────
  '1':  { png: `${PNG_DIR}/entree-veloute.png`,           jpg: '/entree-veloute.jpg',      badge: null,        short: 'Légumes de saison, coco', jpgPos: '50% 20%' },
  '2':  { png: `${PNG_DIR}/entree-salade-tropicale.png`,  jpg: '/entree-avocat.jpg',       badge: null,        short: 'Guacamole et cacahuètes' },
  '3':  { png: `${PNG_DIR}/entree-salade-poulet.png`,     jpg: '/entree-poulet.jpg',       badge: null,        short: 'Tomate, concombre, poulet', jpgPos: '50% 85%' },
  '4':  { png: `${PNG_DIR}/entree-tartare-thon.png`,      jpg: '/entree-tartare.jpg',      badge: 'signature', short: 'Mariné citron vert, 3 sauces' },

  // ── Plats chauds ─────────────────────────────────────────────────────────
  '5':  { png: `${PNG_DIR}/chaud-chao-men.png`,           jpg: '/chaud-chaomen.jpg',       badge: 'populaire', short: 'Nouilles sautées, légumes, viande au choix' },
  '6':  { png: `${PNG_DIR}/chaud-kai-fan.png`,            jpg: '/chaud-kaifan.jpg',        badge: 'populaire', short: 'Riz sauté, viande au choix' },
  '7':  { png: `${PNG_DIR}/chaud-omelette-fu-young.png`,  jpg: '/chaud-omelette.jpg',      badge: null,        short: 'Omelette, légumes sautés' },
  '8':  { png: `${PNG_DIR}/chaud-wok-boeuf.png`,          jpg: '/chaud-boeuf.jpg',         badge: 'signature', short: 'Bœuf, légumes, sauce sésame' },

  // ── Plats froids ─────────────────────────────────────────────────────────
  //    Le nom porte déjà la déclinaison, la section porte déjà l'accompagnement
  //    (« Servis avec riz et salade ») : la ligne courte dit donc la marinade,
  //    commune aux quatre, et la sauce, qui les sépare.
  '9':  { png: `${PNG_DIR}/froid-tahiti.png`,             jpg: '/froid-tahitien.jpg',      badge: 'signature', short: 'Citron vert, sauce coco' },
  '10': { png: `${PNG_DIR}/froid-hawai.png`,              jpg: '/froid-kaikai.jpg',        badge: null,        short: 'Citron vert, sauce sésame' },
  '11': { png: `${PNG_DIR}/froid-samoa.png`,              jpg: '/froid-haka.jpg',          badge: null,        short: 'Citron vert, sauce piment' },
  '12': { png: `${PNG_DIR}/froid-manoa.png`,              jpg: '/froid-mokai.jpg',         badge: null,        short: 'Citron vert, sauce arachide' },

  // ── Formules ─────────────────────────────────────────────────────────────
  //    13 tient déjà sur une ligne : pas de `short`, le `desc` officiel passe.
  '13': { png: `${PNG_DIR}/formule-decouverte.png`,       jpg: '/formule-decouverte.jpg',  badge: null },
  '14': { png: `${PNG_DIR}/formule-voyage.png`,           jpg: '/formule-voyage.jpg',      badge: null,        short: '2 plats, 2 boissons, 1 dessert' },

  // ── Desserts ─────────────────────────────────────────────────────────────
  //    16 et 18 partagent le `desc` « Coulis au choix », qui tient tel quel.
  '15': { png: `${PNG_DIR}/dessert-coulant-chocolat.png`, jpg: '/dessert-coulant.jpg',     badge: null,        short: 'Gâteau au chocolat fondant' },
  '16': { png: `${PNG_DIR}/dessert-creme-tropicale.png`,  jpg: '/dessert-creme.jpg',       badge: 'maison' },
  '17': { png: `${PNG_DIR}/dessert-poe-banane.png`,       jpg: '/dessert-poe.jpg',         badge: 'maison',    short: 'Dessert tahitien à la banane' },
  '18': { png: `${PNG_DIR}/dessert-cheesecake.png`,       jpg: '/dessert-cheesecake.jpg',  badge: null, jpgPos: '0% 50%' },

  // ── Boissons ─────────────────────────────────────────────────────────────
  //    19 : quatre parfums dans JUS_OPTS (menuMeta.js), le détail est dans le
  //    modal de choix. 20 tient déjà sur une ligne.
  '19': { png: `${PNG_DIR}/boisson-jus-exotiques.png`,    jpg: '/boisson-jus.jpg',         badge: null,        short: '4 parfums au choix' },
  '20': { png: `${PNG_DIR}/boisson-eau.png`,              jpg: '/boisson-eau.jpg',         badge: null },

  // ── Bases du composeur de wok (jamais rendues en fiche produit ; le PNG
  //    sert aux vignettes du composeur une fois shooté). Aucun JPG n'existe,
  //    et pas de `short` : ces entrées ne passent jamais par ProductCard.
  '21': { png: `${PNG_DIR}/wok-nouilles-sautees.png`,     jpg: null, badge: 'nouveau' },
  '22': { png: `${PNG_DIR}/wok-riz-curry.png`,            jpg: null, badge: 'nouveau' },
  '23': { png: `${PNG_DIR}/wok-riz-saute.png`,            jpg: null, badge: 'nouveau' },
  '24': { png: `${PNG_DIR}/wok-riz-blanc.png`,            jpg: null, badge: 'nouveau' },
};

const EMPTY_META = { png: null, jpg: null, badge: null, short: null, jpgPos: null };

// Lecture tolérante : un id inconnu ne casse pas la grille, il rend une carte
// sans photo ni badge — la description retombe sur celle du plat.
export function getProductMeta(id) {
  return PRODUCT_META[String(id)] || EMPTY_META;
}
