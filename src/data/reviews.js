// src/data/reviews.js — Avis Google de la fiche KaïKaï, transcrits à la main.
//
// Aucun appel à Google, aucune API, aucune clé : les avis sont recopiés depuis
// des captures de la fiche Google, à l'identique (texte exact, prénom +
// initiale du nom, note, date telle que Google l'affiche). Cette liste est la
// SEULE source de la section « Ce que disent nos clients » de la page
// d'accueil (src/accueil-v2/V2Reviews.jsx) : vide, la section n'apparaît pas.
//
// Mettre à jour : recopier les nouveaux avis ici, et reporter la note moyenne
// et le nombre d'avis affichés par la fiche dans GOOGLE_RATING.

// Note moyenne et nombre d'avis TELS QU'AFFICHÉS sur la fiche Google, avec la
// date du relevé. `count: 0` ou `average: 0` masque l'en-tête chiffré.
export const GOOGLE_RATING = { average: 0, count: 0, asOf: '' };

// Un avis = { id, author, rating (1–5), when (date affichée par Google), text }.
export const REVIEWS = [];
