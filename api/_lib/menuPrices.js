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
};

export function getServerPrice(itemId) {
  return MENU_PRICES[String(itemId)];
}
