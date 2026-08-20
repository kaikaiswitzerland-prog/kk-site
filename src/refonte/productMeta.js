// src/refonte/productMeta.js
//
// Métadonnées d'AFFICHAGE de la grille refonte : photo détourée, badge et avis.
// Ce fichier ne porte AUCUN prix, AUCUNE règle de rupture et AUCUNE option :
// tout cela reste dans MENU (src/App.jsx), menuMeta.js et stockRules.js, qui
// restent les seules sources de vérité côté commande.
//
// Les clés sont les ids de MENU (1 à 24, wok inclus).

// Dossier des PNG détourés. Les fichiers n'existent pas encore — voir
// src/refonte/PHOTOS_PNG.md pour le brief photo complet. Tant qu'un PNG est
// absent, la carte retombe automatiquement sur le JPG actuel (`jpg`), donc la
// grille est déjà consultable aujourd'hui.
export const PNG_DIR = '/plats';

// ─── AVIS ────────────────────────────────────────────────────────────────────
//
// ⚠ AUCUN avis réel n'existe dans le projet à ce jour : ni table Supabase, ni
// import Google Business. Les valeurs `rating` / `reviews` ci-dessous sont des
// PLACEHOLDERS destinés à valider la maquette, PAS à être mis en ligne.
//
// Avant toute mise en production, il faut soit brancher une vraie source
// (avis Google via RESTAURANT_INFO.google_page, ou une table `reviews`), soit
// passer RATINGS_SOURCE à 'none' — la carte masque alors proprement la ligne
// d'avis, sans trou dans la mise en page.
export const RATINGS_SOURCE = 'placeholder'; // 'placeholder' | 'none'

// ─── BADGES ──────────────────────────────────────────────────────────────────
//
// Trois types seulement : 'halal' | 'nouveau' | 'signature'. Un plat n'en porte
// qu'un — deux pastilles sur une vignette de 170 px, c'est illisible.
//
// ⚠ 'halal' n'est volontairement posé sur AUCUN plat ici. La carte contient du
// porc (Chao Men, Kai Fan, garniture Porc du composeur) et les plats partagent
// les mêmes woks : seul le restaurant peut dire quels plats sont réellement
// certifiés/annonçables halal. À remplir par KaïKaï, pas à deviner.
export const BADGE_LABELS = {
  halal: 'Halal',
  nouveau: 'Nouveau',
  signature: 'Signature',
};

export const PRODUCT_META = {
  // ── Entrées ──────────────────────────────────────────────────────────────
  '1':  { png: `${PNG_DIR}/entree-veloute.png`,           jpg: '/entree-veloute.jpg',      badge: null,        rating: 4.6, reviews: 41 },
  '2':  { png: `${PNG_DIR}/entree-salade-tropicale.png`,  jpg: '/entree-avocat.jpg',       badge: null,        rating: 4.7, reviews: 58 },
  '3':  { png: `${PNG_DIR}/entree-salade-poulet.png`,     jpg: '/entree-poulet.jpg',       badge: null,        rating: 4.5, reviews: 36 },
  '4':  { png: `${PNG_DIR}/entree-tartare-thon.png`,      jpg: '/entree-tartare.jpg',      badge: 'signature', rating: 4.9, reviews: 132 },

  // ── Plats chauds ─────────────────────────────────────────────────────────
  '5':  { png: `${PNG_DIR}/chaud-chao-men.png`,           jpg: '/chaud-chaomen.jpg',       badge: null,        rating: 4.8, reviews: 117 },
  '6':  { png: `${PNG_DIR}/chaud-kai-fan.png`,            jpg: '/chaud-kaifan.jpg',        badge: null,        rating: 4.7, reviews: 94 },
  '7':  { png: `${PNG_DIR}/chaud-omelette-fu-young.png`,  jpg: '/chaud-omelette.jpg',      badge: null,        rating: 4.5, reviews: 47 },
  '8':  { png: `${PNG_DIR}/chaud-wok-boeuf.png`,          jpg: '/chaud-boeuf.jpg',         badge: 'signature', rating: 4.9, reviews: 86 },

  // ── Plats froids ─────────────────────────────────────────────────────────
  '9':  { png: `${PNG_DIR}/froid-tahiti.png`,             jpg: '/froid-tahitien.jpg',      badge: 'signature', rating: 4.9, reviews: 148 },
  '10': { png: `${PNG_DIR}/froid-hawai.png`,              jpg: '/froid-kaikai.jpg',        badge: null,        rating: 4.8, reviews: 121 },
  '11': { png: `${PNG_DIR}/froid-samoa.png`,              jpg: '/froid-haka.jpg',          badge: null,        rating: 4.7, reviews: 73 },
  '12': { png: `${PNG_DIR}/froid-manoa.png`,              jpg: '/froid-mokai.jpg',         badge: null,        rating: 4.8, reviews: 65 },

  // ── Formules ─────────────────────────────────────────────────────────────
  '13': { png: `${PNG_DIR}/formule-decouverte.png`,       jpg: '/formule-decouverte.jpg',  badge: null,        rating: 4.8, reviews: 52 },
  '14': { png: `${PNG_DIR}/formule-voyage.png`,           jpg: '/formule-voyage.jpg',      badge: null,        rating: 4.9, reviews: 39 },

  // ── Desserts ─────────────────────────────────────────────────────────────
  '15': { png: `${PNG_DIR}/dessert-coulant-chocolat.png`, jpg: '/dessert-coulant.jpg',     badge: null,        rating: 4.7, reviews: 61 },
  '16': { png: `${PNG_DIR}/dessert-creme-tropicale.png`,  jpg: '/dessert-creme.jpg',       badge: null,        rating: 4.6, reviews: 44 },
  '17': { png: `${PNG_DIR}/dessert-poe-banane.png`,       jpg: '/dessert-poe.jpg',         badge: 'signature', rating: 4.9, reviews: 97 },
  '18': { png: `${PNG_DIR}/dessert-cheesecake.png`,       jpg: '/dessert-cheesecake.jpg',  badge: null,        rating: 4.7, reviews: 55 },

  // ── Boissons ─────────────────────────────────────────────────────────────
  '19': { png: `${PNG_DIR}/boisson-jus-exotiques.png`,    jpg: '/boisson-jus.jpg',         badge: null,        rating: null, reviews: null },
  '20': { png: `${PNG_DIR}/boisson-eau.png`,              jpg: '/boisson-eau.jpg',         badge: null,        rating: null, reviews: null },

  // ── Bases du composeur de wok (jamais rendues en fiche produit ; le PNG
  //    sert aux vignettes du composeur une fois shooté). Aucun JPG n'existe.
  '21': { png: `${PNG_DIR}/wok-nouilles-sautees.png`,     jpg: null, badge: 'nouveau', rating: null, reviews: null },
  '22': { png: `${PNG_DIR}/wok-riz-curry.png`,            jpg: null, badge: 'nouveau', rating: null, reviews: null },
  '23': { png: `${PNG_DIR}/wok-riz-saute.png`,            jpg: null, badge: 'nouveau', rating: null, reviews: null },
  '24': { png: `${PNG_DIR}/wok-riz-blanc.png`,            jpg: null, badge: 'nouveau', rating: null, reviews: null },
};

const EMPTY_META = { png: null, jpg: null, badge: null, rating: null, reviews: null };

// Lecture tolérante : un id inconnu ne casse pas la grille, il rend une carte
// sans photo ni badge ni avis.
export function getProductMeta(id) {
  const meta = PRODUCT_META[String(id)] || EMPTY_META;
  if (RATINGS_SOURCE === 'none') return { ...meta, rating: null, reviews: null };
  return meta;
}
