// api/_lib/menuPrices.js — Source de vérité serveur des prix unitaires.
//
// ⚠ Doit rester synchronisé avec MENU dans src/App.jsx (≈ ligne 123).
// Si un prix change là-bas, le changer ici aussi — sinon un client honnête
// paiera un mauvais montant.
//
// Chaque id n'a qu'un seul prix : les variantes (chaud/froid, protéines,
// coulis, jus, eau, tartares) ne modifient pas le prix unitaire.
//
// Utilisé par api/create-checkout.js pour ignorer items[].price envoyé
// par le client (INSERT anon non validé) et empêcher le price tampering.

export const MENU_PRICES = {
  // ENTRÉES
  '1':  4.90,   // Velouté koko
  '2':  7.90,   // Salade Tropicale
  '3':  9.90,   // Salade de poulet
  '4':  12.90,  // Tartare de thon rouge (3 variantes — prix unique)

  // PLATS CHAUDS
  '5':  18.90,  // Chao Men (4 variantes protéines)
  '6':  18.90,  // Kai Fan (4 variantes protéines)
  '7':  17.90,  // Omelette Fu Young (2 variantes protéines)
  '8':  26.90,  // Wok de Bœuf

  // PLATS FROIDS
  '9':  22.90,  // Tahiti
  '10': 22.90,  // Hawaï
  '11': 22.90,  // Samoa
  '12': 24.90,  // Manoa

  // FORMULES
  '13': 19.90,  // Formule Découverte
  '14': 49.90,  // Formule Voyage

  // DESSERTS
  '15': 9.90,   // Coulant au chocolat
  '16': 9.90,   // Crème Tropicale (2 variantes coulis)
  '17': 9.90,   // Po'e Banane
  '18': 12.90,  // Cheesecake (2 variantes coulis)

  // BOISSONS
  '19': 3.50,   // Jus exotiques (4 variantes)
  '20': 3.00,   // Eau plate/gazeuse (2 variantes)

  // BASES DU COMPOSEUR DE WOKS — ces ids n'ont pas de prix propre : c'est la
  // garniture qui fait le prix (MENU_OPTION_PRICES ci-dessous). La valeur ici
  // n'est qu'un repli, utilisé seulement si un panier arrivait sans garniture.
  '21': 18.90,  // Nouilles sautées
  '22': 18.90,  // Riz sauté curry
  '23': 18.90,  // Riz sauté
  '24': 18.90,  // Riz blanc jasmin
};

export function getServerPrice(itemId) {
  return MENU_PRICES[String(itemId)];
}

// ─── Prix d'option (composeur de woks) ────────────────────────────────
//
// Deux sémantiques cohabitent, distinguées par le préfixe de la clé :
//
//   '21:veggie'     → surcharge ABSOLUE. La garniture REMPLACE le prix de la
//                     base : Veggie 17.90, Poulet/Porc/Mix 18.90, Bœuf 26.90.
//   '21:leg:choux'  → supplément ADDITIF. S'AJOUTE au prix, et seulement
//                     au-delà du quota inclus.
//
// Le préfixe 'leg:' marque cette bascule de sens et évite toute collision
// d'id avec une garniture, aujourd'hui comme demain.
//
// Seuls les ids 21 à 24 (les bases du composeur) apparaissent ici. Aucun plat
// de la carte existante n'a de prix d'option : leurs tarifs ne bougent pas.
//
// ⚠ Doit rester synchronisé avec OPTION_PRICES dans src/App.jsx.
export const MENU_OPTION_PRICES = {
  '21:veggie': 17.90, '21:poulet': 18.90, '21:porc': 18.90, '21:porc-poulet': 18.90, '21:boeuf': 26.90,
  '22:veggie': 17.90, '22:poulet': 18.90, '22:porc': 18.90, '22:porc-poulet': 18.90, '22:boeuf': 26.90,
  '23:veggie': 17.90, '23:poulet': 18.90, '23:porc': 18.90, '23:porc-poulet': 18.90, '23:boeuf': 26.90,
  '24:veggie': 17.90, '24:poulet': 18.90, '24:porc': 18.90, '24:porc-poulet': 18.90, '24:boeuf': 26.90,

  '21:leg:choux': 1.50, '21:leg:patate': 1.50, '21:leg:poivrons': 1.50,
  '22:leg:choux': 1.50, '22:leg:patate': 1.50, '22:leg:poivrons': 1.50,
  '23:leg:choux': 1.50, '23:leg:patate': 1.50, '23:leg:poivrons': 1.50,
  '24:leg:choux': 1.50, '24:leg:patate': 1.50, '24:leg:poivrons': 1.50,
};

// Nombre de légumes offerts avec un plat. Au-delà, chacun est facturé.
export const LEGUMES_INCLUS = 1;

// Prix d'UN exemplaire, garniture et légumes compris. `variant` est l'objet
// stocké dans items[].variants[k] : { id, name, legumes?: [{id, name}] }.
//
// Un variant absent, ou dont l'id n'a pas de prix déclaré, rend exactement
// getServerPrice() — donc TOUS les plats de la carte passent par ici sans
// changer de prix.
export function getServerUnitPrice(itemId, variant) {
  const base = getServerPrice(itemId);
  if (typeof base !== 'number') return undefined;

  const id = String(itemId);

  // 1. Prix de la garniture — surcharge ABSOLUE, sinon prix de base.
  const optionId =
    variant && typeof variant === 'object' && typeof variant.id === 'string'
      ? variant.id.trim()
      : '';
  const override = optionId ? MENU_OPTION_PRICES[`${id}:${optionId}`] : undefined;
  let price = typeof override === 'number' ? override : base;

  // 2. Suppléments LÉGUMES — ADDITIFS, et seulement au-delà du quota inclus.
  //
  // On ne retient que les légumes dont la clé existe réellement au catalogue.
  // Un id inconnu, vide ou malformé est purement IGNORÉ : il n'ajoute rien,
  // et surtout il ne consomme pas le légume offert — sinon un panier forgé
  // pourrait glisser un faux légume en tête pour faire offrir un vrai.
  // Les doublons sont écartés au passage (« choux, choux » n'est qu'un choux).
  if (variant && typeof variant === 'object' && Array.isArray(variant.legumes)) {
    const seen = new Set();
    const supplements = [];
    for (const leg of variant.legumes) {
      const legId = (typeof leg === 'string' ? leg : leg?.id);
      if (typeof legId !== 'string' || !legId.trim()) continue;
      const key = `${id}:leg:${legId.trim()}`;
      if (seen.has(key)) continue;
      const p = MENU_OPTION_PRICES[key];
      if (typeof p !== 'number' || p < 0) continue; // inconnu → ignoré
      seen.add(key);
      supplements.push(p);
    }
    // C'est le légume le MOINS cher qui est offert. À supplément égal (cas
    // actuel : tout est à 1.50) le choix est neutre ; si les prix venaient à
    // diverger, c'est l'option prudente côté encaissement — elle ne peut
    // jamais sous-facturer.
    supplements.sort((a, b) => a - b);
    supplements.slice(LEGUMES_INCLUS).forEach((p) => { price += p; });
  }

  // Arrondi au centime : 18.90 + 1.50 traîne des flottants en binaire.
  return Math.round(price * 100) / 100;
}
