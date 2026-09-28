// src/accueil-v2/v2Helpers.js
//
// Aides de PRÉSENTATION de l'accueil v2. Aucun prix, aucune donnée de carte,
// aucune règle de rupture ici : tout cela vient de src/App.jsx (menuCatalog)
// et des libs. Ce fichier ne fait que formater ce qu'on lui donne.

// "CHF 4,90" — format du HTML fourni (virgule décimale), utilisé sur toute la
// page v2. Le Checkout partagé garde son propre format ("CHF 4.90").
export function chf(n) {
  return 'CHF ' + Number(n || 0).toFixed(2).replace('.', ',');
}

// "11:30" → "11h30", "22:00" → "22h00" (format du footer du HTML fourni).
export function hmm(hhmm) {
  if (typeof hhmm !== 'string' || !hhmm.includes(':')) return '';
  const [h, m] = hhmm.split(':');
  return `${Number(h)}h${m}`;
}

// Sections de la carte, dans l'ordre du HTML. `key` est la clé de
// menuCatalog.sections (App.jsx) ; les listes de plats ne sont jamais
// recopiées ici. `id` est l'ancre (chips + navigation).
export const SECTIONS = [
  { key: 'entrees',   id: 'entrees',    title: 'Entrées' },
  { key: 'chaud',     id: 'chaud',      title: 'Plats chauds' },
  // `note` : sous-titre discret de la section — la mention riz et salade vit
  // ici, sous « Plats froids », et non plus en bas de la carte.
  { key: 'froid',     id: 'froid',      title: 'Plats froids', note: 'Tous nos plats sont accompagnés de riz et de salade' },
  { key: 'formules',  id: 'formules',   title: 'Formules' },
  { key: 'desserts',  id: 'desserts',   title: 'Desserts' },
  { key: 'jusMaison', id: 'jus-maison', title: 'Boissons fraîches maison' },
  { key: 'boissons',  id: 'boissons',   title: 'Boissons' },
];

// Le composeur de woks s'intercale après les entrées, comme dans le HTML.
export const WOK_ANCHOR = { id: 'wok', title: 'Compose ton wok' };

// Chips de catégories : sections + composeur, dans l'ordre d'affichage.
export const CHIPS = [
  { id: 'entrees', label: 'Entrées' },
  { id: 'wok', label: 'Compose ton wok' },
  { id: 'chaud', label: 'Plats chauds' },
  { id: 'froid', label: 'Plats froids' },
  { id: 'formules', label: 'Formules' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'jus-maison', label: 'Boissons fraîches maison' },
  { id: 'boissons', label: 'Boissons' },
];

// Badge « Signature » — décision de présentation du HTML fourni (plats 4, 8, 9).
export const SIGNATURE_IDS = new Set(['4', '8', '9']);

// Libellé d'une variante pour une ligne du tiroir : miroir textuel de ce que
// le Checkout affiche (formules Découverte/Voyage, options simples, wok
// composé). Rend '' quand il n'y a rien à dire.
export function variantDetail(variant) {
  if (!variant || typeof variant !== 'object') return '';

  if (variant.type === 'decouverte') {
    const parts = [];
    if (variant.plat) {
      const prot = variant.proteins && variant.proteins[variant.plat];
      parts.push(prot ? `${variant.plat} (${prot})` : variant.plat);
    }
    const boisson = variant.boisson === 'Jus exotique'
      ? variant.jus
      : (variant.boisson === 'Eau' ? variant.eau : variant.boisson);
    if (boisson) parts.push(boisson);
    return parts.join(' · ');
  }

  if (variant.type === 'voyage') {
    const parts = [];
    (variant.plats || []).forEach((plat, idx) => {
      const prot = Array.isArray(variant.proteins) ? variant.proteins[idx] : variant.proteins?.[plat];
      parts.push(prot ? `${plat} (${prot})` : plat);
    });
    (variant.boissons || []).forEach((boisson, idx) => {
      if (boisson === 'Jus exotique' && variant.jus?.[idx]) parts.push(variant.jus[idx]);
      else if (boisson === 'Eau' && variant.eau?.[idx]) parts.push(variant.eau[idx]);
      else if (boisson) parts.push(boisson);
    });
    if (variant.dessert) {
      parts.push(variant.coulisDessert ? `${variant.dessert} (${variant.coulisDessert})` : variant.dessert);
    }
    return parts.join(' · ');
  }

  // Option simple (protéine, sauce, coulis, jus, eau) ou wok composé.
  const parts = [];
  if (variant.name) parts.push(variant.name);
  if (Array.isArray(variant.legumes)) {
    variant.legumes.forEach((l) => { const n = typeof l === 'string' ? l : l?.name; if (n) parts.push(n); });
  }
  if (variant.supPortion === true) parts.push(variant.id === 'veggie' ? "Portion d'omelette en plus" : 'Portion de viande en plus');
  if (variant.supXL === true) parts.push('Format XL');
  return parts.join(' · ');
}
