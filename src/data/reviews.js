// src/data/reviews.js — Avis Google de la fiche KaïKaï, transcrits à la main.
//
// Aucun appel à Google, aucune API, aucune clé : les avis sont recopiés depuis
// la fiche Google, à l'identique (texte exact, prénom + initiale du nom, note,
// mois et année tels qu'affichés). Cette liste est la SEULE source de la
// section « Avis Google » de la page d'accueil (src/accueil-v2/V2Reviews.jsx) :
// vide, la section n'apparaît pas.
//
// Mettre à jour : recopier les nouveaux avis ici sans les reformuler, et
// reporter la note moyenne et le nombre d'avis affichés par la fiche dans
// GOOGLE_RATING.

// Note moyenne et nombre d'avis TELS QU'AFFICHÉS sur la fiche Google, avec la
// date du relevé. `count: 0` ou `average: 0` masque l'en-tête chiffré.
export const GOOGLE_RATING = { average: 4.6, count: 8, asOf: '2026-09-28' };

// Un avis = { id, author, rating (1–5), when (mois et année affichés par
// Google), text, badge? (« Local Guide » tel qu'affiché par Google),
// note? (mention affichée sous l'avis, ex. traduction) }.
export const REVIEWS = [
  {
    id: 'val-l-c-2026-09',
    author: 'Val L. C.',
    rating: 5,
    when: 'septembre 2026',
    badge: 'Local Guide',
    text: "Super service traiteur ! J'ai fait une commande pour mon anniversaire pour découvrir de nouvelles saveurs. C'était délicieux, nous avons commandé différents plats de leur carte pour faire une dégustation en famille et c'était une vraie réussite. Les échanges par message étaient très professionnels et conviviaux, la livraison pile à l'heure et la nourriture était toujours chaude pour passer directement à table. Encore merci ! Nous ne manquerons pas de parler de vous à notre entourage !",
  },
  {
    id: 'thalyxay-i-2026-07',
    author: 'Thalyxay I.',
    rating: 5,
    when: 'juillet 2026',
    text: "Une superbe découverte ! Les plats étaient savoureux, préparés avec des produits frais et pleins de saveurs exotiques. On sent que la cuisine est faite avec passion et respecte les traditions tahitiennes. L'accueil était chaleureux, le personnel très agréable et l'ambiance dépaysante. Une excellente adresse que je recommande à tous ceux qui veulent découvrir la cuisine polynésienne. J'y retournerai avec plaisir !",
  },
  {
    id: 'dalil-b-2026-06',
    author: 'Dalil B.',
    rating: 5,
    when: 'juin 2026',
    text: "Nous avons pris une formule avec mon épouse, et quel voyage.. la douceur et la fraîcheur des plats ! Quel bonheur en plus de pouvoir profiter d'une si bonne cuisine avec de la viande Halal. Nous recommandons vivement pour celles et ceux en quête de se faire du bien tout en se faisant plaisir 🫶",
  },
  {
    id: 'kirei-t-2026-06',
    author: 'Kirei T.',
    rating: 5,
    when: 'juin 2026',
    note: "Traduit de l'anglais par Google",
    text: "La nourriture était vraiment excellente, similaire à celle de Tahiti. Le chao men était chaud, ce qui était très appréciable car j'avais 30 minutes de bus et il était encore tiède. Un vrai délice ! Le service était impeccable et rapide. Le personnel est très sympathique et toujours prêt à répondre à mes questions. J'ai tellement hâte de goûter le poisson cru au lait de coco !",
  },
];
