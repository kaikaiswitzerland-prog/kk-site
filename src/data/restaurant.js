// src/data/restaurant.js
//
// Coordonnées et informations publiques du restaurant. Extrait de App.jsx pour
// être partagé entre le site actuel et les composants de la refonte sans
// dupliquer l'adresse, le téléphone ni les horaires.

// Informations du restaurant
export const RESTAURANT_INFO = {
  name: "KaïKaï",
  address: "Bd de la Tour 1, 1205 Genève",
  phone: "+41765197670",
  phoneDisplay: "+41 76 519 76 70",
  instagram: "https://www.instagram.com/kaikaifood.ch",
  facebook: "#",
  email: "contact@kaikai.ch",
  // Fiche Google Business KaïKaï (avis, photos, horaires) — utilisée par
  // les liens "Voir sur Google Maps". Distinct de l'iframe embed qui doit
  // garder une URL embed-friendly (?output=embed).
  google_page: "https://maps.app.goo.gl/P1rmU4VNfXNxLWQi9?g_st=ic",
  // Identifiant de lieu Google Places de cette même fiche — à renseigner une
  // fois connu ; sinon api/google-reviews.js le retrouve par recherche
  // textuelle (nom + adresse) au premier appel, puis le mémorise.
  google_place_id: "",
  
  // Display uniquement — heures de SERVICE affichées aux clients. Source de
  // vérité numérique : src/lib/restaurantHours.js (SERVICE_DEFAULT /
  // SERVICE_SATURDAY). Service continu, sept jours sur sept ; le samedi
  // n'ouvre qu'à 18h. Mis à jour le 27.09.2026 (branche test/accueil-v2).
  hours: {
    daily:    { start: "11:30", end: "22:00" },   // dimanche → vendredi
    saturday: { start: "18:00", end: "22:00" },
  },
  
  // Liste des NPA et frais : voir src/lib/deliveryZones.js (source de vérité).
  // Le champ deliveryZones ci-dessus était hardcodé à plat ; il est désormais
  // dérivé de la table NPA_TO_ZONE via getAllNpas().
  //
  // deliveryTime : ETA total livraison (préparation + course coursier).
  // prepTime     : préparation seule, pour le mode "À emporter".
  // À garder synchronisés avec api/_lib/emails/orderConfirmation.js (ETA).
  deliveryTime: "30-45",
  prepTime: "20-25",
  
  coordinates: {
    lat: 46.1983,
    lng: 6.1472
  }
};

// "11:30" → "11h30", "22:00" → "22h" (format d'affichage des horaires).
export function formatHourDisplay(hhmm) {
  if (typeof hhmm !== 'string' || !hhmm.includes(':')) return '';
  const [h, m] = hhmm.split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

// Phrase d'horaires affichée aux clients (footer historique, AboutModal,
// footer refonte). UNE seule source, dérivée de RESTAURANT_INFO.hours :
// « Tous les jours 11h30 – 22h · samedi 18h – 22h ».
export const HOURS_DISPLAY =
  `Tous les jours ${formatHourDisplay(RESTAURANT_INFO.hours.daily.start)} – ${formatHourDisplay(RESTAURANT_INFO.hours.daily.end)}`
  + ` · samedi ${formatHourDisplay(RESTAURANT_INFO.hours.saturday.start)} – ${formatHourDisplay(RESTAURANT_INFO.hours.saturday.end)}`;
