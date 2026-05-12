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
