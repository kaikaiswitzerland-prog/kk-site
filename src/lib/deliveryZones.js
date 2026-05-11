// src/lib/deliveryZones.js
// Source de vérité unique pour les zones de livraison KaïKaï à Genève.
//
// Principe : table NPA → zone hardcodée (pas d'API Google), 3 zones
// forfaitaires basées sur un rayon ~8 km autour de Bring Kitchens
// (1 Bd de la Tour, 1205 Plainpalais).
//
// Si tu modifies cette table, modifie AUSSI api/_lib/deliveryZones.js
// (copie miroir côté serveur — voir la note dans ce fichier).

export const DELIVERY_ZONES = {
  ZONE_1: {
    id: 'ZONE_1',
    name: 'Centre-ville',
    fee: 4.90,
    description: '0-3 km · Genève centre, Plainpalais, Eaux-Vives…',
  },
  ZONE_2: {
    id: 'ZONE_2',
    name: '1ère couronne',
    fee: 6.90,
    description: '3-5 km · Lancy, Carouge, Chêne-Bougeries…',
  },
  ZONE_3: {
    id: 'ZONE_3',
    name: '2ème couronne',
    fee: 9.90,
    description: '5-8 km · Vernier, Meyrin, Veyrier…',
  },
};

// Map NPA (string 4 chiffres) → { zone, label }. Les labels sont indicatifs
// (premier quartier reconnaissable) et servent à l'autocomplete UI.
export const NPA_TO_ZONE = {
  // ZONE 1 — 4.90 CHF
  '1201': { zone: 'ZONE_1', label: 'Saint-Gervais / Pâquis' },
  '1202': { zone: 'ZONE_1', label: 'Sécheron' },
  '1203': { zone: 'ZONE_1', label: 'Grottes / Saint-Jean' },
  '1204': { zone: 'ZONE_1', label: 'Cité-Centre / Vieille-Ville' },
  '1205': { zone: 'ZONE_1', label: 'Plainpalais' },
  '1206': { zone: 'ZONE_1', label: 'Champel / Florissant' },
  '1207': { zone: 'ZONE_1', label: 'Eaux-Vives' },
  '1208': { zone: 'ZONE_1', label: 'Eaux-Vives (ext.)' },
  '1209': { zone: 'ZONE_1', label: 'Petit-Saconnex / Servette' },
  '1227': { zone: 'ZONE_1', label: 'Les Acacias / Carouge' },
  '1231': { zone: 'ZONE_1', label: 'Conches' },

  // ZONE 2 — 6.90 CHF
  '1212': { zone: 'ZONE_2', label: 'Grand-Lancy' },
  '1213': { zone: 'ZONE_2', label: 'Petit-Lancy / Onex' },
  '1218': { zone: 'ZONE_2', label: 'Le Grand-Saconnex' },
  '1219': { zone: 'ZONE_2', label: 'Châtelaine / Le Lignon' },
  '1220': { zone: 'ZONE_2', label: 'Les Avanchets' },
  '1223': { zone: 'ZONE_2', label: 'Cologny' },
  '1224': { zone: 'ZONE_2', label: 'Chêne-Bougeries' },
  '1225': { zone: 'ZONE_2', label: 'Chêne-Bourg' },
  '1226': { zone: 'ZONE_2', label: 'Thônex' },
  '1228': { zone: 'ZONE_2', label: 'Plan-les-Ouates' },
  '1234': { zone: 'ZONE_2', label: 'Vessy' },
  '1245': { zone: 'ZONE_2', label: 'Collonge-Bellerive' },
  '1253': { zone: 'ZONE_2', label: 'Vandœuvres' },

  // ZONE 3 — 9.90 CHF
  '1214': { zone: 'ZONE_3', label: 'Vernier' },
  '1216': { zone: 'ZONE_3', label: 'Cointrin' },
  '1217': { zone: 'ZONE_3', label: 'Meyrin' },
  '1232': { zone: 'ZONE_3', label: 'Confignon' },
  '1233': { zone: 'ZONE_3', label: 'Bernex' },
  '1241': { zone: 'ZONE_3', label: 'Puplinge' },
  '1242': { zone: 'ZONE_3', label: 'Satigny' },
  '1244': { zone: 'ZONE_3', label: 'Choulex' },
  '1246': { zone: 'ZONE_3', label: 'Corsier' },
  '1252': { zone: 'ZONE_3', label: 'Meinier' },
  '1255': { zone: 'ZONE_3', label: 'Veyrier' },
  '1293': { zone: 'ZONE_3', label: 'Bellevue' },
};

// API publique ──────────────────────────────────────────────────────────────

// Retourne un descripteur complet { npa, label, id, name, fee, description }
// ou null si le NPA n'est pas dans la zone de livraison.
export function getZoneByNpa(npa) {
  if (typeof npa !== 'string') return null;
  const entry = NPA_TO_ZONE[npa];
  if (!entry) return null;
  return {
    npa,
    label: entry.label,
    ...DELIVERY_ZONES[entry.zone],
  };
}

export function isDeliverableNpa(npa) {
  return !!getZoneByNpa(npa);
}

export function getDeliveryFee(npa) {
  const z = getZoneByNpa(npa);
  return z ? z.fee : null;
}

export function getAllNpas() {
  return Object.keys(NPA_TO_ZONE).sort();
}
