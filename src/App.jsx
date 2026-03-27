// src/App.jsx - VERSION AVEC TOUS LES MODALS DE VARIANTES
import React, { useMemo, useState, useEffect } from "react";
import { ShoppingCart, Minus, Plus, X, MapPin, Bike, Check, Phone, Instagram, Facebook, Clock, Info, AlertCircle, ChevronRight } from "lucide-react";

// MODIFICATION 1: Logo PNG au lieu du SVG
const LOGO_SRC = "/logo_kaikai.png";

// Style global pour empêcher le scroll horizontal
const globalStyles = `
  html, body { overflow-x: hidden; max-width: 100vw; }
  * { box-sizing: border-box; }

  @keyframes sheetUp {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes backdropIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes tileIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .modal-backdrop { animation: backdropIn 0.22s ease forwards; }
  .modal-sheet   { animation: sheetUp 0.36s cubic-bezier(0.32, 1.1, 0.58, 1) forwards; }
  .tile-0  { animation: tileIn 0.22s ease 0.08s both; }
  .tile-1  { animation: tileIn 0.22s ease 0.13s both; }
  .tile-2  { animation: tileIn 0.22s ease 0.18s both; }
  .tile-3  { animation: tileIn 0.22s ease 0.23s both; }
  .tile-4  { animation: tileIn 0.22s ease 0.28s both; }
  .tile-5  { animation: tileIn 0.22s ease 0.33s both; }
  .tile-6  { animation: tileIn 0.22s ease 0.38s both; }

  .modal-tile { transition: background 0.15s ease, border-color 0.15s ease, transform 0.12s ease; }
  .modal-tile:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.22) !important; }
  .modal-tile:active { transform: scale(0.98); }

  .cat-nav::-webkit-scrollbar { display: none; }
  .cat-nav { -ms-overflow-style: none; scrollbar-width: none; }

  @keyframes bowlExitLeft  { from { transform: translateX(0);     opacity: 1; } to { transform: translateX(-120%); opacity: 0; } }
  @keyframes bowlExitRight { from { transform: translateX(0);     opacity: 1; } to { transform: translateX(120%);  opacity: 0; } }
  @keyframes bowlEnterRight{ from { transform: translateX(120%);  opacity: 0; } to { transform: translateX(0);     opacity: 1; } }
  @keyframes bowlEnterLeft { from { transform: translateX(-120%); opacity: 0; } to { transform: translateX(0);     opacity: 1; } }

  @keyframes wordExitLeft     { from { transform: translateX(0);   } to { transform: translateX(60%);  } }
  @keyframes wordExitRight    { from { transform: translateX(0);   } to { transform: translateX(-60%); } }
  @keyframes wordEnterFromRight { from { transform: translateX(-60%); } to { transform: translateX(0); } }
  @keyframes wordEnterFromLeft  { from { transform: translateX(60%);  } to { transform: translateX(0); } }

  @keyframes infoFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes floatDecor { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-8px) rotate(5deg); } }
  @keyframes decorAppear { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }

  .hero-bowl { width: 55vmin; height: 55vmin; border-radius: 50%; overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,0.55); flex-shrink: 0; }
  .hero-word  { font-size: 18vw; font-weight: 900; color: rgba(255,255,255,0.18); text-transform: uppercase; letter-spacing: -0.03em; user-select: none; white-space: nowrap; line-height: 1; }
  .hero-arrow { width: 56px; height: 56px; min-width: 48px; min-height: 48px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.25); background: rgba(0,0,0,0.35); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #fff; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
  .hero-arrow:hover { background: rgba(0,0,0,0.6); }
  @media (max-width: 768px) {
    .hero-bowl { width: 80vw; height: 80vw; }
    .hero-word  { font-size: 22vw; }
    .hero-arrow { width: 48px; height: 48px; }
  }
`;

// Informations du restaurant
const RESTAURANT_INFO = {
  name: "KaïKaï",
  address: "Bd de la Tour 1, 1205 Genève",
  phone: "+41765197670",
  phoneDisplay: "+41 76 519 76 70",
  instagram: "https://www.instagram.com/kaikaiswitzerland",
  facebook: "#",
  email: "contact@kaikai.ch",
  
  hours: {
    lunch: { start: "11:30", end: "14:00" },
    dinner: { start: "18:00", end: "22:00" }
  },
  
  deliveryZones: ["1200", "1201", "1202", "1203", "1204", "1205", "1206", "1207", "1208", "1209"],
  deliveryTime: "30-45",
  
  coordinates: {
    lat: 46.1983,
    lng: 6.1472
  }
};

// --- Menu réel (CHF)
const MENU = [
  // ENTRÉES
  { id: "1",  name: "Velouté koko", desc: "Légumes de saison et crème coco", price: 4.90, category: "entrees" },
  { id: "2",  name: "Salade Tropicale", desc: "Salade, tomate, patate, concombre, guacamole maison, cacahuètes", price: 7.90, category: "entrees" },
  { id: "3",  name: "Salade de poulet", desc: "Salade, tomate, patate, concombre, poulet", price: 9.90, category: "entrees" },
  { 
    id: "4",  
    name: "Tartare de thon rouge", 
    desc: "Mariné au citron vert et gingembre (3 variantes: Tahiti, Hawaï, Samoa)", 
    price: 12.90, 
    category: "entrees",
    hasVariants: true,
    variants: [
      { id: "tahiti", name: "Tartare Tahiti", desc: "Sauce coco" },
      { id: "hawaii", name: "Tartare Hawaï", desc: "Sauce sésame, mangue et ananas" },
      { id: "samoa", name: "Tartare Samoa", desc: "Sauce piment maison" }
    ]
  },

  // PLATS CHAUDS
  { 
    id: "5",  
    name: "Chao Men", 
    desc: "Nouilles sautées, légumes de saison, wok de porc et/ou poulet, sauce crevette et champignons", 
    price: 18.90, 
    category: "chaud",
    hasProteinVariants: true,
    proteinVariants: [
      { id: "porc", name: "Porc", desc: "Viande de porc mijotée façon KaïKaï" },
      { id: "poulet", name: "Poulet", desc: "Wok de poulet" },
      { id: "porc-poulet", name: "Porc + Poulet", desc: "Mix des deux viandes" },
      { id: "veggie", name: "Veggie", desc: "100% végétarien" }
    ]
  },
  { 
    id: "6",  
    name: "Kai Fan", 
    desc: "Riz sauté, wok de porc et/ou poulet, sauce crevette et champignons, servi avec sa salade exotique", 
    price: 18.90, 
    category: "chaud",
    hasProteinVariants: true,
    proteinVariants: [
      { id: "porc", name: "Porc", desc: "Viande de porc mijotée façon KaïKaï" },
      { id: "poulet", name: "Poulet", desc: "Wok de poulet" },
      { id: "porc-poulet", name: "Porc + Poulet", desc: "Mix des deux viandes" },
      { id: "veggie", name: "Veggie", desc: "100% végétarien" }
    ]
  },
  { 
    id: "7",  
    name: "Omelette Fu Young", 
    desc: "Omelette aux légumes sautés de saison", 
    price: 17.90, 
    category: "chaud",
    hasProteinVariants: true,
    proteinVariants: [
      { id: "veggie", name: "Veggie", desc: "100% végétarien" },
      { id: "poulet", name: "Poulet", desc: "Avec poulet" }
    ]
  },
  { id: "8",  name: "Wok de Bœuf", desc: "Wok de bœuf, légumes de saison, sauce sésame, servi avec du riz et de salade", price: 26.90, category: "chaud" },

  // PLATS FROIDS
  { id: "9",  name: "Tahiti", desc: "Thon rouge mariné au citron vert et gingembre, tomate, concombre, sauce coco", price: 22.90, category: "froid" },
  { id: "10", name: "Hawaï", desc: "Thon rouge mariné au citron vert et gingembre, tomate, concombre, sauce sésame, mangue et ananas", price: 22.90, category: "froid" },
  { id: "11", name: "Samoa", desc: "Thon rouge mariné au citron vert et gingembre, tomate, concombre, sauce piment maison", price: 22.90, category: "froid" },
  { id: "12", name: "Manoa", desc: "Thon rouge mariné au citron vert et gingembre, tomate, concombre, sauce arachide et guacamole maison", price: 24.90, category: "froid" },

  // FORMULES
  { 
    id: "13", 
    name: "Formule Découverte", 
    desc: "Velouté + Plat + Boisson", 
    price: 19.90, 
    category: "formules",
    hasFormule: true,
    formuleType: "decouverte"
  },
  { 
    id: "14", 
    name: "Formule Voyage", 
    desc: "2x Plats + 2x Boissons + 1x Dessert", 
    price: 49.90, 
    category: "formules",
    hasFormule: true,
    formuleType: "voyage"
  },

  // DESSERTS
  { id: "15", name: "Coulant au chocolat", desc: "Gâteau au chocolat à la texture fondante", price: 9.90, category: "desserts" },
  { 
    id: "16", 
    name: "Crème Tropicale", 
    desc: "Coulis au choix", 
    price: 9.90, 
    category: "desserts",
    hasCoulisVariants: true,
    coulisVariants: [
      { id: "mangue", name: "Coulis Mangue", desc: "Doux et tropical" },
      { id: "fruits-rouges", name: "Coulis Fruits Rouges", desc: "Frais et acidulé" }
    ]
  },
  { id: "17", name: "Po'e Banane", desc: "Dessert traditionnel tahitien à base de banane", price: 9.90, category: "desserts" },
  { 
    id: "18", 
    name: "Cheesecake", 
    desc: "Coulis au choix", 
    price: 12.90, 
    category: "desserts",
    hasCoulisVariants: true,
    coulisVariants: [
      { id: "mangue", name: "Coulis Mangue", desc: "Doux et tropical" },
      { id: "fruits-rouges", name: "Coulis Fruits Rouges", desc: "Frais et acidulé" }
    ]
  },

  // BOISSONS
  { 
    id: "19", 
    name: "Jus exotiques", 
    desc: "Pomme/kiwi, fraise/framboise, ananas/citron/gingembre, cocktail ACE", 
    price: 3.50, 
    category: "boissons",
    hasJusVariants: true,
    jusVariants: [
      { id: "pomme-kiwi", name: "🍏 Pomme/Kiwi", desc: "Frais et vitaminé" },
      { id: "fraise-framboise", name: "🍓 Fraise/Framboise", desc: "Doux et fruité" },
      { id: "ananas-citron", name: "🍍 Ananas/Citron/Gingembre", desc: "Tropical et piquant" },
      { id: "ace", name: "🍊 Cocktail ACE", desc: "Vitaminé (A, C, E)" }
    ]
  },
  { 
    id: "20", 
    name: "Eau plate/gazeuse", 
    desc: "Eau minérale ou gazeuse", 
    price: 3.00, 
    category: "boissons",
    hasEauVariants: true,
    eauVariants: [
      { id: "plate", name: "💧 Eau Plate", desc: "Eau minérale naturelle" },
      { id: "gazeuse", name: "🫧 Eau Gazeuse", desc: "Eau pétillante" }
    ]
  },
];

// Ordre des sections
const IDS_ENTREES  = [1, 2, 3, 4];
const IDS_CHAUD    = [5, 6, 7, 8];
const IDS_FROID    = [9, 10, 11, 12];
const IDS_FORMULES = [13, 14];
const IDS_DESSERT  = [15, 16, 17, 18];
const IDS_BOISSON  = [19, 20];

const byIds = (ids) => ids.map(id => MENU.find(m => m.id === String(id))).filter(Boolean);
const SEC_ENTREES  = byIds(IDS_ENTREES);
const SEC_CHAUD    = byIds(IDS_CHAUD);
const SEC_FROID    = byIds(IDS_FROID);
const SEC_FORMULES = byIds(IDS_FORMULES);
const SEC_DESSERT  = byIds(IDS_DESSERT);
const SEC_BOISSON  = byIds(IDS_BOISSON);

const ORDERED_IDS = [...IDS_ENTREES, ...IDS_CHAUD, ...IDS_FROID, ...IDS_FORMULES, ...IDS_DESSERT, ...IDS_BOISSON];
const MENU_SORTED = byIds(ORDERED_IDS);

const ENTREE_PHOTOS = {
  "1": "/entree-veloute.jpg",
  "2": "/entree-avocat.jpg",
  "3": "/entree-poulet.jpg",
  "4": "/entree-tartare.jpg",
};
const ENTREE_PHOTO_POS = {
  "1": "center 30%",
  "2": "center 65%",
  "3": "center 62%",
  "4": "center 40%",
};

const CHAUD_PHOTOS = {
  "5": "/chaud-chaomen.jpg",
  "6": "/chaud-kaifan.jpg",
  "7": "/chaud-omelette.jpg",
  "8": "/chaud-boeuf.jpg",
};
const CHAUD_PHOTO_POS = {
  "5": "center 50%",
  "6": "center 70%",
  "7": "center 40%",
  "8": "center 45%",
};

const FROID_PHOTOS = {
  "9":  "/froid-tahitien.jpg",
  "10": "/froid-kaikai.jpg",
  "11": "/froid-haka.jpg",
  "12": "/froid-mokai.jpg",
};
const FROID_PHOTO_POS = {
  "9":  "center 55%",
  "10": "center 62%",
  "11": "center 50%",
  "12": "center 58%",
};

const FORMULE_PHOTOS = {
  "13": "/formule-decouverte.jpg",
  "14": "/formule-voyage.jpg",
};
const FORMULE_PHOTO_POS = {
  "13": "center 45%",
  "14": "center 45%",
};

const DESSERT_PHOTOS = {
  "15": "/dessert-coulant.jpg",
  "16": "/dessert-creme.jpg",
  "17": "/dessert-poe.jpg",
  "18": "/dessert-cheesecake.jpg",
};
const DESSERT_PHOTO_POS = {
  "15": "center 58%",
  "16": "center 60%",
  "17": "center 62%",
  "18": "center 52%",
};

const BOISSON_PHOTOS = {
  "19": "/boisson-jus.jpg",
  "20": "/boisson-eau.jpg",
};
const BOISSON_PHOTO_POS = {
  "19": "center 50%",
  "20": "center 45%",
};

function format(price) {
  return new Intl.NumberFormat("fr-CH", { style: "currency", currency: "CHF" }).format(price);
}

function isRestaurantOpen() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  const lunchStart = 11 * 60 + 30;
  const lunchEnd = 14 * 60;
  const dinnerStart = 18 * 60;
  const dinnerEnd = 22 * 60;
  
  return (currentTime >= lunchStart && currentTime < lunchEnd) || 
         (currentTime >= dinnerStart && currentTime < dinnerEnd);
}

function getNextOpeningTime() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  const lunchStart = 11 * 60 + 30;
  const dinnerStart = 18 * 60;
  
  if (currentTime < lunchStart) {
    return "11h30";
  } else if (currentTime >= 14 * 60 && currentTime < dinnerStart) {
    return "18h00";
  } else {
    return "11h30 demain";
  }
}

function HeroSlider() {
  const SLIDES = [
    { name: "Tahiti",            category: "POISSON",  price: "22.90 CHF", description: "Thon rouge, citron vert, gingembre, sauce coco",          bgColor: "#0d2a1a", image: "/froid-tahitien.jpg",  decorElements: ["🐟", "🌿", "🍋"] },
    { name: "Hawaï",             category: "POISSON",  price: "22.90 CHF", description: "Thon rouge, mangue, ananas, sauce sésame",                bgColor: "#7a3d10", image: "/froid-kaikai.jpg",   decorElements: ["🍍", "🥭", "🌺"] },
    { name: "Chao Men",          category: "CHAUD",    price: "18.90 CHF", description: "Nouilles sautées, wok de porc, sauce crevettes",           bgColor: "#4a1208", image: "/chaud-chaomen.jpg",  decorElements: ["🍜", "🥢", "🌶️"] },
    { name: "Kai Fan",           category: "CHAUD",    price: "18.90 CHF", description: "Riz sauté, wok de porc, sauce champignons",                bgColor: "#1a2e0a", image: "/chaud-kaifan.jpg",   decorElements: ["🍚", "🥬", "🍄"] },
    { name: "Coulant Chocolat",  category: "DESSERT",  price: "9.90 CHF",  description: "Coulant fondant, servi chaud",                             bgColor: "#200e03", image: "/dessert-coulant.jpg", decorElements: ["🍫", "🍮", "✨"] },
  ];
  const N = SLIDES.length;

  const [cur,       setCur]       = React.useState(0);
  const [nxt,       setNxt]       = React.useState(null);
  const [dir,       setDir]       = React.useState(null);
  const [animating, setAnimating] = React.useState(false);
  const [hoverPaused, setHoverPaused] = React.useState(false);
  const [arrowPaused, setArrowPaused] = React.useState(false);
  const [progress,  setProgress]  = React.useState(0);

  const animTimerRef    = React.useRef(null);
  const pauseTimerRef   = React.useRef(null);
  const rafRef          = React.useRef(null);
  const progressStart   = React.useRef(null);
  const stateRef        = React.useRef({ cur: 0, animating: false });
  stateRef.current      = { cur, animating };

  const autoplayPaused = hoverPaused || arrowPaused;

  const navigate = (nextIdx, direction) => {
    if (stateRef.current.animating) return;
    setAnimating(true);
    setNxt(nextIdx);
    setDir(direction);
    animTimerRef.current = setTimeout(() => {
      setCur(nextIdx);
      setNxt(null);
      setDir(null);
      setAnimating(false);
    }, 520);
  };

  const goNext = () => navigate((stateRef.current.cur + 1) % N, 'next');
  const goPrev = () => navigate((stateRef.current.cur - 1 + N) % N, 'prev');

  const handleArrow = (fn) => {
    fn();
    setArrowPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setArrowPaused(false);
      pauseTimerRef.current = null;
    }, 8000);
  };

  const goNextRef = React.useRef(goNext);
  goNextRef.current = goNext;

  React.useEffect(() => {
    if (autoplayPaused) return;
    const id = setInterval(() => goNextRef.current(), 5000);
    return () => clearInterval(id);
  }, [autoplayPaused]);

  React.useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (autoplayPaused) { setProgress(0); return; }
    progressStart.current = Date.now();
    setProgress(0);
    const tick = () => {
      const p = Math.min((Date.now() - progressStart.current) / 5000, 1);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cur, autoplayPaused]);

  React.useEffect(() => () => {
    clearTimeout(animTimerRef.current);
    clearTimeout(pauseTimerRef.current);
    cancelAnimationFrame(rafRef.current);
  }, []);

  const slide       = SLIDES[cur];
  const nextSlide   = nxt !== null ? SLIDES[nxt] : null;
  const displaySlide = animating && nextSlide ? nextSlide : slide;
  const bgColor      = animating && nextSlide ? nextSlide.bgColor : slide.bgColor;

  const bowlExitAnim  = dir === 'next' ? 'bowlExitLeft 0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards'  : 'bowlExitRight 0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards';
  const bowlEnterAnim = dir === 'next' ? 'bowlEnterRight 0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards' : 'bowlEnterLeft 0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards';
  const wordExitAnim  = dir === 'next' ? 'wordExitLeft 0.5s ease-in-out forwards'      : 'wordExitRight 0.5s ease-in-out forwards';
  const wordEnterAnim = dir === 'next' ? 'wordEnterFromRight 0.5s ease-in-out forwards' : 'wordEnterFromLeft 0.5s ease-in-out forwards';

  const DECOR_POS = [
    { top: '18%', right: '14%' },
    { top: '60%', right: '7%'  },
    { top: '40%', right: '24%' },
  ];

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: bgColor, transition: 'background-color 0.5s ease-in-out' }}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
    >
      {/* ── EXITING SLIDE ── */}
      {animating && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <span className="hero-word" style={{ animation: wordExitAnim }}>{slide.category}</span>
          </div>
          <div className="hero-bowl" style={{ animation: bowlExitAnim }}>
            <img src={slide.image} alt={slide.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
          </div>
        </div>
      )}

      {/* ── ENTERING / IDLE SLIDE ── */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        {/* Giant word — parallax inverse */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <span className="hero-word" style={animating ? { animation: wordEnterAnim } : {}}>
            {displaySlide.category}
          </span>
        </div>

        {/* Circular dish image */}
        <div className="hero-bowl" style={animating ? { animation: bowlEnterAnim } : {}}>
          <img src={displaySlide.image} alt={displaySlide.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
        </div>

        {/* Floating decorative elements */}
        {displaySlide.decorElements.map((emoji, i) => (
          <div
            key={`${animating ? nxt : cur}-decor-${i}`}
            style={{
              position: 'absolute',
              ...DECOR_POS[i],
              fontSize: 'clamp(1.4rem, 2.8vmin, 2.2rem)',
              animation: `floatDecor 3s ease-in-out ${i * 0.7}s infinite, decorAppear 0.4s ease ${i * 0.15}s both`,
              userSelect: 'none',
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* ── INFO — bas gauche ── */}
      <div
        key={`info-${animating ? nxt : cur}`}
        style={{ position: 'absolute', bottom: '12%', left: '5%', maxWidth: '52%', animation: 'infoFadeUp 0.4s ease 0.3s both', pointerEvents: 'none', zIndex: 2 }}
      >
        <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', margin: '0 0 0.45rem' }}>
          {displaySlide.category}
        </p>
        <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#fff', lineHeight: 1.05, margin: '0 0 0.35rem' }}>
          {displaySlide.name}
        </h2>
        <p style={{ fontSize: 'clamp(1rem, 2.2vw, 1.4rem)', fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: '0 0 0.5rem' }}>
          {displaySlide.price}
        </p>
        <p style={{ fontSize: 'clamp(0.78rem, 1.4vw, 0.9rem)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>
          {displaySlide.description}
        </p>
      </div>

      {/* ── FLÈCHES ── */}
      <button
        onClick={() => handleArrow(goPrev)}
        className="hero-arrow"
        style={{ position: 'absolute', left: '2%', top: '50%', transform: 'translateY(-50%)', zIndex: 3 }}
        aria-label="Plat précédent"
      >◀</button>
      <button
        onClick={() => handleArrow(goNext)}
        className="hero-arrow"
        style={{ position: 'absolute', right: '2%', top: '50%', transform: 'translateY(-50%)', zIndex: 3 }}
        aria-label="Plat suivant"
      >▶</button>

      {/* ── DOTS ── */}
      <div style={{ position: 'absolute', bottom: '4%', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', alignItems: 'center', zIndex: 3 }}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => !animating && navigate(i, i > cur ? 'next' : 'prev')}
            style={{ width: i === cur ? 24 : 8, height: 8, borderRadius: 4, background: i === cur ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* ── BARRE DE PROGRESSION ── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.1)', zIndex: 3 }}>
        <div style={{ height: '100%', background: 'rgba(255,255,255,0.75)', width: `${progress * 100}%`, transition: 'width 0.1s linear' }} />
      </div>
    </div>
  );
}

function Badge({ type }) {
  const badges = {
    halal: { text: "HALAL" },
    healthy: { text: "HEALTHY FOOD" }
  };
  
  const badge = badges[type];
  
  return (
    <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/20 text-xs font-semibold text-white">
      <span>{badge.text}</span>
    </div>
  );
}

function OpenStatus() {
  const [isOpen, setIsOpen] = useState(isRestaurantOpen());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOpen(isRestaurantOpen());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${isOpen ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
      <div className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
      <span className="text-sm font-medium">
        {isOpen ? 'Ouvert' : `Fermé - Ouvre à ${getNextOpeningTime()}`}
      </span>
    </div>
  );
}

// ─── NOUVEAU : Navigation sticky par catégorie ───────────────────────────────
const CATEGORIES = [
  { id: "entrees",  label: "🥗 Entrées" },
  { id: "chaud",    label: "🔥 Plats Chauds" },
  { id: "froid",    label: "❄️ Plats Froids" },
  { id: "formules", label: "🎁 Formules" },
  { id: "desserts", label: "🍰 Desserts" },
  { id: "boissons", label: "🧉 Boissons" },
];

function CategoryNav({ activeCategory }) {
  const navRef = React.useRef(null);
  const activeRef = React.useRef(null);
  const [scrolled, setScrolled] = React.useState(false);
  const [headerH, setHeaderH] = React.useState(0);

  useEffect(() => {
    const measure = () => {
      const h = document.querySelector("header");
      if (h) setHeaderH(h.offsetHeight);
    };
    measure();
    const t = setTimeout(measure, 100);
    window.addEventListener("resize", measure);
    return () => { clearTimeout(t); window.removeEventListener("resize", measure); };
  }, []);

  useEffect(() => {
    if (headerH === 0) return;
    const handleScroll = () => setScrolled(window.scrollY > headerH);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headerH]);

  useEffect(() => {
    if (activeRef.current && navRef.current) {
      const nav = navRef.current;
      const btn = activeRef.current;
      const scrollLeft = btn.offsetLeft - nav.offsetWidth / 2 + btn.offsetWidth / 2;
      nav.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [activeCategory]);

  const scrollToCategory = (id) => {
    const el = document.getElementById(`section-${id}`);
    if (el) {
      const navH = navRef.current ? navRef.current.offsetHeight : 36;
      const offset = (scrolled ? 0 : headerH) + navH + 8;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const topPos = headerH === 0 ? -200 : scrolled ? 0 : headerH;

  return (
    <>
      <div
        ref={navRef}
        className="cat-nav"
        style={{
          position: "fixed",
          top: topPos,
          left: 0,
          right: 0,
          zIndex: 35,
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          padding: scrolled ? "5px 16px" : "8px 16px",
          background: scrolled ? "rgba(0,0,0,0.70)" : "rgba(0,0,0,0.95)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(255,255,255,0.10)",
          transition: "top 0.25s ease, padding 0.2s ease, background 0.25s ease",
        }}
      >
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              ref={isActive ? activeRef : null}
              onClick={() => scrollToCategory(cat.id)}
              style={{
                flexShrink: 0,
                whiteSpace: "nowrap",
                borderRadius: "999px",
                padding: scrolled ? "3px 12px" : "6px 16px",
                fontSize: scrolled ? "13px" : "15px",
                fontWeight: 500,
                transition: "all 0.2s ease",
                background: isActive ? "white" : "transparent",
                color: isActive ? "black" : scrolled ? "rgba(255,255,255,0.40)" : "rgba(255,255,255,0.70)",
                border: isActive ? "none" : scrolled ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(255,255,255,0.20)",
                cursor: "pointer",
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

function useActiveCategory() {
  const [active, setActive] = useState("entrees");

  useEffect(() => {
    const handleScroll = () => {
      const offset = 130;
      for (let i = CATEGORIES.length - 1; i >= 0; i--) {
        const el = document.getElementById(`section-${CATEGORIES[i].id}`);
        if (el && el.getBoundingClientRect().top <= offset) {
          setActive(CATEGORIES[i].id);
          return;
        }
      }
      setActive(CATEGORIES[0].id);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return active;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function KaiKaiApp() {
  const [cart, setCart] = useState({});
  const [cartVariants, setCartVariants] = useState({});
  const [mode, setMode] = useState("delivery");
  const [couponApplied] = useState(true);
  const [step, setStep] = useState("menu");
  const [logoVisible, setLogoVisible] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  const activeCategory = useActiveCategory();

  const items = useMemo(() => MENU_SORTED.map(m => ({ ...m, qty: cart[m.id] || 0 })), [cart]);
  const subtotal = useMemo(() => items.reduce((s, it) => s + it.price * it.qty, 0), [items]);
  const discount = useMemo(() => (couponApplied ? subtotal * 0.10 : 0), [couponApplied, subtotal]);
  const deliveryFee = useMemo(() => (mode === "delivery" && subtotal > 0 ? 4.9 : 0), [mode, subtotal]);
  const total = useMemo(() => Math.max(0, subtotal - discount) + deliveryFee, [subtotal, discount, deliveryFee]);

  const add = (id, variant = null) => {
    setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
    if (variant) {
      setCartVariants(cv => {
        const currentVariants = cv[id] || [];
        return { ...cv, [id]: [...currentVariants, variant] };
      });
    }
  };
  
  const removeOne = (id, variantIndex = null) => {
    setCart(c => {
      const q = (c[id] || 0) - 1;
      const n = { ...c };
      if (q <= 0) {
        delete n[id];
        setCartVariants(cv => { const nv = {...cv}; delete nv[id]; return nv; });
      } else {
        n[id] = q;
        if (variantIndex !== null) {
          setCartVariants(cv => {
            const arr = [...(cv[id] || [])];
            arr.splice(variantIndex, 1);
            return { ...cv, [id]: arr };
          });
        } else {
          setCartVariants(cv => {
            const arr = cv[id] || [];
            if (arr.length > 0) return { ...cv, [id]: arr.slice(0, -1) };
            return cv;
          });
        }
      }
      return n;
    });
  };

  const remove = (id) => setCart(c => { 
    const q = (c[id] || 0) - 1; 
    const n = { ...c }; 
    if (q <= 0) { 
      delete n[id]; 
      setCartVariants(cv => { 
        const nv = {...cv}; 
        delete nv[id]; 
        return nv; 
      }); 
    } else {
      n[id] = q;
      setCartVariants(cv => {
        const currentVariants = cv[id] || [];
        if (currentVariants.length > 0) {
          return { ...cv, [id]: currentVariants.slice(0, -1) };
        }
        return cv;
      });
    }
    return n; 
  });
  const clear = () => { setCart({}); setCartVariants({}); };

  return (
    <>
      <style>{globalStyles}</style>
      <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {logoVisible && <img src={LOGO_SRC} alt="KaïKaï" className="h-8 rounded" onError={() => setLogoVisible(false)} />}
            <div>
              <h1 className="text-xl font-semibold">KaïKaï</h1>
              <OpenStatus />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={`tel:${RESTAURANT_INFO.phone}`}
              className="rounded-2xl border border-white/20 p-2.5 hover:bg-white/10 transition-all"
              aria-label="Appeler"
            >
              <Phone className="h-5 w-5" />
            </a>
            <button 
              onClick={() => setShowAbout(true)}
              className="rounded-2xl border border-white/20 p-2.5 hover:bg-white/10 transition-all"
              aria-label="À propos"
            >
              <Info className="h-5 w-5" />
            </button>
            <button onClick={() => setStep("checkout")} className="relative rounded-2xl border border-white/20 p-2.5 hover:bg-white/10 transition-all">
              <ShoppingCart className="h-5 w-5" />
              {Object.values(cart).reduce((s, q) => s + q, 0) > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-black animate-pulse">
                  {Object.values(cart).reduce((s, q) => s + q, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      {step === "menu" && <CategoryNav activeCategory={activeCategory} />}

      {/* Menu principal */}
      {step === "menu" && (
        <>
          <HeroSlider />
          <section className="mx-auto max-w-5xl px-4 py-10">
            {/* Grille de plats */}
            <div className="grid gap-6 sm:grid-cols-2">
              <h3 id="section-entrees" className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🥗 Entrées</h3>
              {Object.values(cart).reduce((s, q) => s + q, 0) === 0 && (
                <div className="col-span-full flex items-center justify-center gap-2 py-2 text-sm text-white/35 animate-pulse">
                  <span>Appuyez sur</span>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/25 text-white/50 text-xs font-bold">+</span>
                  <span>pour commencer à commander</span>
                </div>
              )}
              {SEC_ENTREES.map(item => (
                <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove}
                  photo={ENTREE_PHOTOS[item.id]} photoPos={ENTREE_PHOTO_POS[item.id]}
                  photoHeight="h-56" />
              ))}

              <h3 id="section-chaud" className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🔥 Plat Chaud</h3>
              {SEC_CHAUD.map(item => (
                <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove}
                  photo={CHAUD_PHOTOS[item.id]} photoPos={CHAUD_PHOTO_POS[item.id]}
                  photoHeight="h-56" />
              ))}

              <h3 id="section-froid" className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">❄️ Plat Froid</h3>
              {SEC_FROID.map(item => (
                <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove}
                  photo={FROID_PHOTOS[item.id]} photoPos={FROID_PHOTO_POS[item.id]} />
              ))}

              <h3 id="section-formules" className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🎁 Formules</h3>
              {SEC_FORMULES.map(item => (
                <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove} isFormula
                  photo={FORMULE_PHOTOS[item.id]} photoPos={FORMULE_PHOTO_POS[item.id]} photoHeight="h-64" />
              ))}

              <h3 id="section-desserts" className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🍰 Desserts</h3>
              {SEC_DESSERT.map(item => (
                <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove}
                  photo={DESSERT_PHOTOS[item.id]} photoPos={DESSERT_PHOTO_POS[item.id]} />
              ))}

              <h3 id="section-boissons" className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🧉 Boissons</h3>
              {SEC_BOISSON.map(item => (
                <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove}
                  photo={BOISSON_PHOTOS[item.id]} photoPos={BOISSON_PHOTO_POS[item.id]} />
              ))}
            </div>

            <div className="mt-8 text-center text-sm text-white/50 italic">
              Tous nos plats sont accompagnés de riz et de salade
            </div>
          </section>
        </>
      )}

      {step === "checkout" && (
        <Checkout
          items={items}
          cartVariants={cartVariants}
          subtotal={subtotal}
          discount={discount}
          deliveryFee={deliveryFee}
          total={total}
          mode={mode}
          setMode={setMode}
          onClose={() => setStep("menu")}
          onClear={clear}
          onRemoveOne={removeOne}
          onAdd={add}
          onSuccess={() => { setStep("success"); clear(); }}
        />
      )}

      {step === "success" && (
        <section className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-white text-black"><Check className="h-6 w-6" /></div>
          <h2 className="text-2xl font-semibold">Merci ! Votre commande a été reçue.</h2>
          <p className="mt-2 text-white/70">Un e-mail de confirmation vous a été envoyé. Préparation en cours.</p>
          <button onClick={() => setStep("menu")} className="mt-6 rounded-2xl bg-white px-4 py-2 text-black hover:bg-white/90 transition-colors">Revenir au menu</button>
        </section>
      )}

      {step === "menu" && Object.values(cart).reduce((s, q) => s + q, 0) > 0 && (
        <MiniCart cart={cart} items={items} total={total} discount={discount} onOpen={() => setStep("checkout")} />
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 py-10 text-center text-sm text-white/60">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex justify-center gap-4 mb-4">
            <a href={RESTAURANT_INFO.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <Instagram className="h-6 w-6" />
            </a>
            <a href={RESTAURANT_INFO.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <Facebook className="h-6 w-6" />
            </a>
          </div>
          <div>KaïKaï — restaurant tahitien · {RESTAURANT_INFO.address}</div>
          <div className="mt-1">📞 {RESTAURANT_INFO.phoneDisplay} · 🕐 {RESTAURANT_INFO.hours.lunch.start}-{RESTAURANT_INFO.hours.lunch.end} | {RESTAURANT_INFO.hours.dinner.start}-{RESTAURANT_INFO.hours.dinner.end}</div>
          <div className="mt-2">© {new Date().getFullYear()} KaïKaï — Tous droits réservés.</div>
        </div>
      </footer>
    </div>
    </>
  );
}

// Composant MenuItem avec support de TOUS les modals
function MenuItem({ item, cart, add, remove, isFormula = false, photo = null, photoPos = "center", photoHeight = "h-48" }) {
  const [showVariants, setShowVariants] = useState(false);
  const [showJus, setShowJus] = useState(false);
  const [showFormuleModal, setShowFormuleModal] = useState(false);
  const [showProteinModal, setShowProteinModal] = useState(false);
  const [showCoulisModal, setShowCoulisModal] = useState(false);
  const [showEauModal, setShowEauModal] = useState(false);
  
  const handleAdd = (variant = null) => {
    add(item.id, variant);
    setShowVariants(false);
    setShowJus(false);
    setShowFormuleModal(false);
    setShowProteinModal(false);
    setShowCoulisModal(false);
    setShowEauModal(false);
  };
  
  const handleFormuleConfirm = (formuleDetails) => {
    add(item.id, formuleDetails);
    setShowFormuleModal(false);
  };
  
  const handlePlusClick = () => {
    if (item.hasVariants) {
      setShowVariants(true);
    } else if (item.hasJusVariants) {
      setShowJus(true);
    } else if (item.hasFormule) {
      setShowFormuleModal(true);
    } else if (item.hasProteinVariants) {
      setShowProteinModal(true);
    } else if (item.hasCoulisVariants) {
      setShowCoulisModal(true);
    } else if (item.hasEauVariants) {
      setShowEauModal(true);
    } else {
      handleAdd();
    }
  };
  
  return (
    <>
      <div className={`rounded-3xl border border-white/10 overflow-hidden transition-all hover:border-white/20 hover:shadow-lg hover:shadow-white/5 ${isFormula ? 'bg-gradient-to-br from-white/5 to-transparent' : ''}`}>
        {photo && (
          <div className={`w-full ${photoHeight} overflow-hidden`}>
            <img src={photo} alt={item.name} className="w-full h-full object-cover" style={{ objectPosition: photoPos }}
              onError={e => { e.target.style.display = 'none'; e.target.parentNode.style.display = 'none'; }} />
          </div>
        )}
        <div className="flex items-start justify-between gap-4 p-5">
          <div>
            <div className="text-lg font-medium">{item.name}</div>
            <div className="mt-1 text-sm text-white/60">{item.desc}</div>
            <div className="mt-2 text-white/90">{format(item.price)}</div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => remove(item.id)} 
              className="rounded-2xl border border-white/20 p-2 hover:bg-white/10 transition-all active:scale-95"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center font-medium">{cart[item.id] || 0}</span>
            <button 
              onClick={handlePlusClick}
              className="rounded-2xl border border-white/20 p-2 hover:bg-white/10 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {showVariants && item.hasVariants && (
        <VariantModal 
          item={item} 
          onSelect={handleAdd} 
          onClose={() => setShowVariants(false)} 
        />
      )}
      
      {showJus && item.hasJusVariants && (
        <JusModal 
          item={item} 
          onSelect={handleAdd} 
          onClose={() => setShowJus(false)} 
        />
      )}
      
      {showFormuleModal && item.hasFormule && (
        <FormuleModal 
          item={item} 
          onConfirm={handleFormuleConfirm} 
          onClose={() => setShowFormuleModal(false)} 
        />
      )}
      
      {showProteinModal && item.hasProteinVariants && (
        <ProteinModal 
          item={item} 
          onSelect={handleAdd} 
          onClose={() => setShowProteinModal(false)} 
        />
      )}
      
      {showCoulisModal && item.hasCoulisVariants && (
        <CoulisModal 
          item={item} 
          onSelect={handleAdd} 
          onClose={() => setShowCoulisModal(false)} 
        />
      )}
      
      {showEauModal && item.hasEauVariants && (
        <EauModal 
          item={item} 
          onSelect={handleAdd} 
          onClose={() => setShowEauModal(false)} 
        />
      )}
    </>
  );
}

// ─── SYSTÈME DE MODAUX BOTTOM SHEET ─────────────────────────────────────────

function BottomSheet({ title, subtitle, photo, photoPos, children, onClose, footerContent }) {
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="modal-sheet w-full max-w-lg flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #0d0d0d 0%, #111 100%)',
          borderRadius: '28px 28px 0 0',
          border: '1px solid rgba(255,255,255,0.09)',
          borderBottom: 'none',
          maxHeight: '91vh',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
        </div>

        {photo && (
          <div style={{ position: 'relative', height: 190, flexShrink: 0, overflow: 'hidden', margin: '10px 16px 0', borderRadius: 20 }}>
            <img
              src={photo} alt={title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: photoPos || 'center' }}
              onError={e => { e.target.parentNode.style.display = 'none'; }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(13,13,13,0.92) 100%)' }} />
            <div style={{ position: 'absolute', bottom: 14, left: 16, right: 52 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'white', textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>{title}</div>
              {subtitle && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{subtitle}</div>}
            </div>
            <button
              onClick={onClose}
              style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
            ><X size={15} /></button>
          </div>
        )}

        {!photo && (
          <div style={{ padding: '6px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>{title}</div>
              {subtitle && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{subtitle}</div>}
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0, marginTop: 2 }}>
              <X size={15} />
            </button>
          </div>
        )}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '14px 0 0', flexShrink: 0 }} />

        <div style={{ overflowY: 'auto', flex: 1, padding: '10px 16px 16px' }}>
          {children}
        </div>

        {footerContent && (
          <div style={{ padding: '12px 16px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
}

function OptionTile({ emoji, name, desc, isSelected, onClick, index, badge }) {
  return (
    <button
      className={`modal-tile tile-${Math.min(index, 6)}`}
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px', marginBottom: 8,
        background: isSelected ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.03)',
        border: isSelected ? '1px solid rgba(255,255,255,0.28)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, cursor: 'pointer', textAlign: 'left',
      }}
    >
      {emoji && (
        <span style={{ fontSize: 26, width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 13, flexShrink: 0 }}>
          {emoji}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
          {name}
          {badge && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 999, background: 'rgba(255,180,0,0.15)', color: 'rgba(255,180,0,0.85)', border: '1px solid rgba(255,180,0,0.2)' }}>{badge}</span>}
        </div>
        {desc && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</div>}
      </div>
      {isSelected
        ? <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={13} color="black" strokeWidth={3} /></div>
        : <ChevronRight size={15} style={{ color: 'rgba(255,255,255,0.20)', flexShrink: 0 }} />
      }
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.09em', textTransform: 'uppercase', padding: '14px 2px 10px' }}>
      {children}
    </div>
  );
}

function SubSheet({ title, subtitle, options, onSelect, onClose }) {
  return (
    <div
      className="modal-backdrop fixed inset-0 z-[100] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="modal-sheet w-full max-w-lg"
        style={{
          background: '#181818',
          borderRadius: '24px 24px 0 0',
          border: '1px solid rgba(255,255,255,0.09)',
          borderBottom: 'none',
          maxHeight: '65vh',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 34, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <div style={{ padding: '10px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'white' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 16px 28px' }}>
          {options.map((opt, i) => (
            <OptionTile key={opt.id} emoji={opt.emoji} name={opt.name} desc={opt.desc} isSelected={false} onClick={() => onSelect(opt)} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MODAUX SIMPLES ───────────────────────────────────────────────────────────

function getPhoto(id) {
  return ENTREE_PHOTOS[id] || CHAUD_PHOTOS[id] || FROID_PHOTOS[id] || FORMULE_PHOTOS[id] || DESSERT_PHOTOS[id] || BOISSON_PHOTOS[id] || null;
}
function getPhotoPos(id) {
  return ENTREE_PHOTO_POS[id] || CHAUD_PHOTO_POS[id] || FROID_PHOTO_POS[id] || FORMULE_PHOTO_POS[id] || DESSERT_PHOTO_POS[id] || BOISSON_PHOTO_POS[id] || 'center';
}

function VariantModal({ item, onSelect, onClose }) {
  const variantEmojis = { tahiti: '🥥', hawaii: '🥭', samoa: '🌶️' };
  return (
    <BottomSheet title={item.name} subtitle="Choisissez votre sauce" photo={getPhoto(item.id)} photoPos={getPhotoPos(item.id)} onClose={onClose}>
      {item.variants.map((v, i) => (
        <OptionTile key={v.id} emoji={variantEmojis[v.id] || '🍽️'} name={v.name} desc={v.desc} isSelected={false} onClick={() => onSelect(v)} index={i} />
      ))}
    </BottomSheet>
  );
}

function JusModal({ item, onSelect, onClose }) {
  const jusEmojis = { 'pomme-kiwi': '🍏', 'fraise-framboise': '🍓', 'ananas-citron': '🍍', ace: '🍊' };
  return (
    <BottomSheet title="Jus exotiques maison" subtitle="Pressés à la commande" photo={getPhoto(item.id)} photoPos={getPhotoPos(item.id)} onClose={onClose}>
      {item.jusVariants.map((v, i) => (
        <OptionTile key={v.id} emoji={jusEmojis[v.id] || '🧃'} name={v.name.replace(/^[^\s]+ /, '')} desc={v.desc} isSelected={false} onClick={() => onSelect(v)} index={i} />
      ))}
    </BottomSheet>
  );
}

function ProteinModal({ item, onSelect, onClose }) {
  const protEmojis = { porc: '🍖', poulet: '🍗', 'porc-poulet': '🍽️', veggie: '🥦' };
  return (
    <BottomSheet title={item.name} subtitle="Choisissez votre protéine" photo={getPhoto(item.id)} photoPos={getPhotoPos(item.id)} onClose={onClose}>
      {item.proteinVariants.map((v, i) => (
        <OptionTile key={v.id} emoji={protEmojis[v.id] || '🍽️'} name={v.name} desc={v.desc} isSelected={false} onClick={() => onSelect(v)} index={i} />
      ))}
    </BottomSheet>
  );
}

function CoulisModal({ item, onSelect, onClose }) {
  return (
    <BottomSheet title={item.name} subtitle="Choisissez votre coulis" photo={getPhoto(item.id)} photoPos={getPhotoPos(item.id)} onClose={onClose}>
      {item.coulisVariants.map((v, i) => (
        <OptionTile key={v.id} emoji={v.id === 'mangue' ? '🥭' : '🍓'} name={v.name} desc={v.desc} isSelected={false} onClick={() => onSelect(v)} index={i} />
      ))}
    </BottomSheet>
  );
}

function EauModal({ item, onSelect, onClose }) {
  return (
    <BottomSheet title="Eau minérale" subtitle="Plate ou gazeuse ?" photo={getPhoto(item.id)} photoPos={getPhotoPos(item.id)} onClose={onClose}>
      {item.eauVariants.map((v, i) => (
        <OptionTile key={v.id} emoji={v.id === 'plate' ? '💧' : '🫧'} name={v.name.replace(/^[^\s]+ /, '')} desc={v.desc} isSelected={false} onClick={() => onSelect(v)} index={i} />
      ))}
    </BottomSheet>
  );
}

// ─── FORMULE MODAL COMPLET ────────────────────────────────────────────────────
function FormuleModal({ item, onConfirm, onClose }) {
  const [selectedPlat, setSelectedPlat] = useState(null);
  const [selectedPlats, setSelectedPlats] = useState([]);
  const [selectedBoissons, setSelectedBoissons] = useState([]);
  const [selectedJusDecouverte, setSelectedJusDecouverte] = useState(null);
  const [selectedJusVoyage, setSelectedJusVoyage] = useState([]);
  const [selectedBoisson, setSelectedBoisson] = useState(null);
  const [selectedDessert, setSelectedDessert] = useState(null);
  const [showJusSelector, setShowJusSelector] = useState(false);
  const [jusIndex, setJusIndex] = useState(0);
  const [showProteinSelector, setShowProteinSelector] = useState(false);
  const [proteinForPlat, setProteinForPlat] = useState(null);
  const [selectedProteins, setSelectedProteins] = useState({});
  const [showEauSelector, setShowEauSelector] = useState(false);
  const [selectedEauDecouverte, setSelectedEauDecouverte] = useState(null);
  const [selectedEauVoyage, setSelectedEauVoyage] = useState([]);
  const [eauIndex, setEauIndex] = useState(0);
  const [showCoulisSelector, setShowCoulisSelector] = useState(false);
  const [selectedCoulisDessert, setSelectedCoulisDessert] = useState(null);

  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const platsDec = ['Chao Men','Kai Fan','Omelette Fu Young','Tartare Tahiti','Tartare Hawaï','Tartare Samoa'];
  const platsVoy = ['Chao Men','Kai Fan','Omelette Fu Young','Wok de Bœuf','Tartare Tahiti','Tartare Hawaï','Tartare Samoa'];
  const platEmojis = { 'Chao Men':'🍜','Kai Fan':'🍚','Omelette Fu Young':'🍳','Wok de Bœuf':'🥩','Tartare Tahiti':'🐟','Tartare Hawaï':'🥭','Tartare Samoa':'🌶️' };
  const platDescs = { 'Chao Men':'Nouilles sautées','Kai Fan':'Riz sauté','Omelette Fu Young':'Omelette aux légumes','Wok de Bœuf':'Wok de bœuf, sauce sésame','Tartare Tahiti':'Thon rouge, sauce coco','Tartare Hawaï':'Thon rouge, sauce sésame','Tartare Samoa':'Thon rouge, sauce piment' };
  const needsProtein = (p) => ['Chao Men','Kai Fan','Omelette Fu Young'].includes(p);
  const needsCoulis = (d) => ['Crème Tropicale','Cheesecake'].includes(d);
  const desserts = ['Coulant au chocolat','Crème Tropicale',"Po'e Banane",'Cheesecake'];
  const dessertEmojis = { 'Coulant au chocolat':'🍫','Crème Tropicale':'🥥',"Po'e Banane":'🍌','Cheesecake':'🍰' };

  const proteinOpts = (plat) => plat === 'Omelette Fu Young'
    ? [{ id:'veggie', name:'Veggie', desc:'100% végétarien', emoji:'🥦' },{ id:'poulet', name:'Poulet', desc:'Avec poulet', emoji:'🍗' }]
    : [{ id:'porc', name:'Porc', desc:'Viande de porc mijotée façon KaïKaï', emoji:'🍖' },{ id:'poulet', name:'Poulet', desc:'Wok de poulet', emoji:'🍗' },{ id:'porc-poulet', name:'Porc + Poulet', desc:'Mix des deux', emoji:'🍽️' },{ id:'veggie', name:'Veggie', desc:'100% végétarien', emoji:'🥦' }];

  const jusOpts = [{ id:'pomme-kiwi', name:'Pomme / Kiwi', desc:'Frais et vitaminé', emoji:'🍏' },{ id:'fraise-framboise', name:'Fraise / Framboise', desc:'Doux et fruité', emoji:'🍓' },{ id:'ananas-citron', name:'Ananas / Citron / Gingembre', desc:'Tropical et piquant', emoji:'🍍' },{ id:'ace', name:'Cocktail ACE', desc:'Vitaminé A, C, E', emoji:'🍊' }];
  const eauOpts = [{ id:'plate', name:'Eau Plate', desc:'Eau minérale naturelle', emoji:'💧' },{ id:'gazeuse', name:'Eau Gazeuse', desc:'Eau pétillante', emoji:'🫧' }];
  const coulisOpts = [{ id:'mangue', name:'Coulis Mangue', desc:'Doux et tropical', emoji:'🥭' },{ id:'fruits-rouges', name:'Coulis Fruits Rouges', desc:'Frais et acidulé', emoji:'🍓' }];

  const getProgress = () => {
    if (item.formuleType === 'decouverte') {
      let done = 0, total = 2;
      if (selectedPlat) done++;
      if (selectedBoisson) done++;
      return { done, total };
    } else {
      let done = 0, total = 3;
      if (selectedPlats.length === 2) done++;
      if (selectedBoissons.length > 0) done++;
      if (selectedDessert) done++;
      return { done, total };
    }
  };

  const canConfirm = () => {
    if (item.formuleType === 'decouverte') {
      if (!selectedPlat || !selectedBoisson) return false;
      if (needsProtein(selectedPlat) && !selectedProteins[selectedPlat]) return false;
      if (selectedBoisson === 'Jus exotique' && !selectedJusDecouverte) return false;
      if (selectedBoisson === 'Eau' && !selectedEauDecouverte) return false;
      return true;
    } else {
      if (selectedPlats.length !== 2) return false;
      for (const p of selectedPlats) { if (needsProtein(p) && !selectedProteins[p]) return false; }
      if (selectedBoissons.length === 0) return false;
      if (!selectedDessert) return false;
      if (needsCoulis(selectedDessert) && !selectedCoulisDessert) return false;
      const nbJus = selectedBoissons.filter(b => b === 'Jus exotique').length;
      if (selectedJusVoyage.filter(Boolean).length < nbJus) return false;
      const nbEau = selectedBoissons.filter(b => b === 'Eau').length;
      if (selectedEauVoyage.filter(Boolean).length < nbEau) return false;
      return true;
    }
  };

  const handleConfirm = () => {
    if (!canConfirm()) return;
    onConfirm({ type: item.formuleType, plat: selectedPlat, plats: selectedPlats, proteins: selectedProteins, boisson: selectedBoisson, boissons: selectedBoissons, jus: item.formuleType === 'decouverte' ? selectedJusDecouverte : selectedJusVoyage, eau: item.formuleType === 'decouverte' ? selectedEauDecouverte : selectedEauVoyage, dessert: selectedDessert, coulisDessert: selectedCoulisDessert });
  };

  const togglePlatDec = (plat) => {
    if (selectedPlat === plat) { setSelectedPlat(null); setSelectedProteins(p => { const n={...p}; delete n[plat]; return n; }); return; }
    setSelectedPlat(plat);
    if (needsProtein(plat)) { setProteinForPlat(plat); setShowProteinSelector(true); }
  };

  const togglePlatVoy = (plat) => {
    if (selectedPlats.includes(plat)) { setSelectedPlats(selectedPlats.filter(p => p !== plat)); setSelectedProteins(p => { const n={...p}; delete n[plat]; return n; }); return; }
    if (selectedPlats.length >= 2) return;
    setSelectedPlats([...selectedPlats, plat]);
    if (needsProtein(plat)) { setProteinForPlat(plat); setShowProteinSelector(true); }
  };

  const handleBoissonDec = (b) => {
    if (selectedBoisson === b) { setSelectedBoisson(null); if(b==='Jus exotique') setSelectedJusDecouverte(null); if(b==='Eau') setSelectedEauDecouverte(null); return; }
    setSelectedBoisson(b);
    if (b === 'Jus exotique') setShowJusSelector(true);
    if (b === 'Eau') setShowEauSelector(true);
  };

  const handleBoissonVoy = (b) => {
    const jusCount = selectedBoissons.filter(x => x === 'Jus exotique').length;
    const eauCount = selectedBoissons.filter(x => x === 'Eau').length;
    if (b === 'Jus exotique') {
      if (jusCount > 0) { setSelectedBoissons(selectedBoissons.filter(x => x !== 'Jus exotique')); setSelectedJusVoyage([]); return; }
      if (selectedBoissons.length >= 2) return;
      setSelectedBoissons([...selectedBoissons, b]); setJusIndex(0); setShowJusSelector(true);
    } else {
      if (eauCount > 0) { setSelectedBoissons(selectedBoissons.filter(x => x !== 'Eau')); setSelectedEauVoyage([]); return; }
      if (selectedBoissons.length >= 2) return;
      setSelectedBoissons([...selectedBoissons, b]); setEauIndex(0); setShowEauSelector(true);
    }
  };

  const prog = getProgress();
  const plats = item.formuleType === 'decouverte' ? platsDec : platsVoy;
  const isVoyage = item.formuleType === 'voyage';

  const cta = (
    <button
      onClick={handleConfirm}
      disabled={!canConfirm()}
      style={{
        width: '100%', padding: '15px 20px', borderRadius: 18,
        background: canConfirm() ? 'white' : 'rgba(255,255,255,0.10)',
        color: canConfirm() ? 'black' : 'rgba(255,255,255,0.28)',
        border: 'none', fontSize: 15, fontWeight: 700,
        cursor: canConfirm() ? 'pointer' : 'not-allowed',
        transition: 'all 0.2s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
    >
      <span>Ajouter au panier</span>
      <span style={{ fontWeight: 400, opacity: 0.65 }}>{format(item.price)}</span>
    </button>
  );

  return (
    <>
      <BottomSheet
        title={item.name}
        subtitle={item.desc}
        photo={getPhoto(item.id)}
        photoPos={getPhotoPos(item.id)}
        onClose={onClose}
        footerContent={cta}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 2px 0', marginBottom: 2 }}>
          {[...Array(prog.total)].map((_, i) => (
            <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i < prog.done ? 'white' : 'rgba(255,255,255,0.14)', transition: 'background 0.3s ease' }} />
          ))}
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 4, whiteSpace: 'nowrap' }}>{prog.done}/{prog.total}</span>
        </div>

        <SectionLabel>{isVoyage ? 'Choisissez vos 2 plats' : 'Votre plat'}</SectionLabel>
        {plats.map((plat, i) => {
          const sel = isVoyage ? selectedPlats.includes(plat) : selectedPlat === plat;
          const prot = selectedProteins[plat];
          return (
            <OptionTile
              key={plat}
              emoji={platEmojis[plat]}
              name={plat}
              desc={prot ? `${platDescs[plat]} · ${prot}` : platDescs[plat]}
              isSelected={sel}
              onClick={() => isVoyage ? togglePlatVoy(plat) : togglePlatDec(plat)}
              index={i}
              badge={needsProtein(plat) && sel && !prot ? 'choix requis' : null}
            />
          );
        })}

        <SectionLabel>{isVoyage ? "Boissons (jusqu'à 2)" : 'Votre boisson'}</SectionLabel>
        {['Jus exotique', 'Eau'].map((b, i) => {
          const selDec = selectedBoisson === b;
          const countVoy = selectedBoissons.filter(x => x === b).length;
          const selVoy = countVoy > 0;
          const sel = isVoyage ? selVoy : selDec;
          const subLabel = b === 'Jus exotique'
            ? (isVoyage ? (selectedJusVoyage[0] || 'Au choix') : (selectedJusDecouverte || 'Au choix'))
            : (isVoyage ? (selectedEauVoyage[0] || 'Plate ou gazeuse') : (selectedEauDecouverte || 'Plate ou gazeuse'));
          return (
            <OptionTile
              key={b}
              emoji={b === 'Jus exotique' ? '🧉' : '💧'}
              name={b + (isVoyage && countVoy > 1 ? ` ×${countVoy}` : '')}
              desc={subLabel}
              isSelected={sel}
              onClick={() => isVoyage ? handleBoissonVoy(b) : handleBoissonDec(b)}
              index={plats.length + i}
            />
          );
        })}

        {isVoyage && (
          <>
            <SectionLabel>Votre dessert</SectionLabel>
            {desserts.map((d, i) => (
              <OptionTile
                key={d}
                emoji={dessertEmojis[d]}
                name={d}
                desc={selectedDessert === d && selectedCoulisDessert ? selectedCoulisDessert : needsCoulis(d) ? 'Coulis au choix' : (d === 'Coulant au chocolat' ? 'Gâteau fondant' : 'Dessert tahitien')}
                isSelected={selectedDessert === d}
                onClick={() => {
                  if (selectedDessert === d) { setSelectedDessert(null); setSelectedCoulisDessert(null); return; }
                  setSelectedDessert(d);
                  if (needsCoulis(d)) setShowCoulisSelector(true);
                }}
                index={i}
                badge={selectedDessert === d && needsCoulis(d) && !selectedCoulisDessert ? 'coulis requis' : null}
              />
            ))}
          </>
        )}
      </BottomSheet>

      {showProteinSelector && (
        <SubSheet
          title="Choisissez votre protéine"
          subtitle={proteinForPlat}
          options={proteinOpts(proteinForPlat)}
          onSelect={opt => { setSelectedProteins(p => ({...p, [proteinForPlat]: opt.name})); setShowProteinSelector(false); setProteinForPlat(null); }}
          onClose={() => setShowProteinSelector(false)}
        />
      )}
      {showJusSelector && (
        <SubSheet
          title="Choisissez votre jus"
          options={jusOpts}
          onSelect={opt => {
            if (item.formuleType === 'decouverte') setSelectedJusDecouverte(opt.name);
            else { const n=[...selectedJusVoyage]; n[jusIndex]=opt.name; setSelectedJusVoyage(n); }
            setShowJusSelector(false);
          }}
          onClose={() => setShowJusSelector(false)}
        />
      )}
      {showEauSelector && (
        <SubSheet
          title="Plate ou gazeuse ?"
          options={eauOpts}
          onSelect={opt => {
            if (item.formuleType === 'decouverte') setSelectedEauDecouverte(opt.name);
            else { const n=[...selectedEauVoyage]; n[eauIndex]=opt.name; setSelectedEauVoyage(n); }
            setShowEauSelector(false);
          }}
          onClose={() => setShowEauSelector(false)}
        />
      )}
      {showCoulisSelector && (
        <SubSheet
          title="Choisissez votre coulis"
          subtitle={selectedDessert}
          options={coulisOpts}
          onSelect={opt => { setSelectedCoulisDessert(opt.name); setShowCoulisSelector(false); }}
          onClose={() => setShowCoulisSelector(false)}
        />
      )}
    </>
  );
}

// ─── MINI PANIER FLOTTANT ────────────────────────────────────────────────────
function MiniCart({ cart, items, total, discount, onOpen }) {
  const totalQty = Object.values(cart).reduce((s, q) => s + q, 0);
  const cartItems = items.filter(i => i.qty > 0).slice(0, 3);

  return (
    <div
      onClick={onOpen}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 16,
        zIndex: 45,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'white',
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        cursor: 'pointer',
        maxWidth: 280,
        animation: 'tileIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.55)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.45)'; }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShoppingCart size={18} color="white" />
        </div>
        <span style={{
          position: 'absolute', top: -6, right: -6,
          width: 20, height: 20, borderRadius: '50%',
          background: '#111', border: '2px solid white',
          color: 'white', fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {totalQty}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', marginBottom: 1 }}>
          {cartItems.map(i => i.name).join(', ')}{cartItems.length < Object.keys(cart).length ? '…' : ''}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'black' }}>
          {format(total)}
          {discount > 0 && <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(0,0,0,0.45)', marginLeft: 4 }}>(-10%)</span>}
        </div>
      </div>

      <ChevronRight size={16} color="rgba(0,0,0,0.4)" style={{ flexShrink: 0 }} />
    </div>
  );
}

function AboutModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-black border border-white/20 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">À propos de KaïKaï</h2>
          <button onClick={onClose} className="rounded-xl border border-white/20 p-2 hover:bg-white/10 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="space-y-6 text-white/80">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-white">🌴 Notre Histoire</h3>
            <p className="text-sm leading-relaxed">
              KaïKaï est né de la passion pour la cuisine tahitienne authentique. Notre mission est de vous faire voyager 
              à travers les saveurs des îles du Pacifique, en utilisant des produits frais et de qualité.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2 text-white">🥗 Notre Engagement</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge type="halal" />
              <Badge type="healthy" />
            </div>
            <p className="text-sm leading-relaxed">
              Tous nos plats sont préparés avec soin, en respectant les traditions culinaires tahitiennes. 
              Nous garantissons une alimentation saine, des produits halal et une fraîcheur incomparable.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3 text-white">📍 Nous Trouver</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{RESTAURANT_INFO.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>{RESTAURANT_INFO.hours.lunch.start}-{RESTAURANT_INFO.hours.lunch.end} | {RESTAURANT_INFO.hours.dinner.start}-{RESTAURANT_INFO.hours.dinner.end}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href={`tel:${RESTAURANT_INFO.phone}`} className="hover:text-white transition-colors">
                  {RESTAURANT_INFO.phoneDisplay}
                </a>
              </div>
            </div>
            
            <div className="mt-4 rounded-2xl overflow-hidden border border-white/10">
              <iframe
                src="https://www.google.com/maps?q=Boulevard+de+la+Tour+1,+1205+Gen%C3%A8ve,+Switzerland&output=embed"
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3 text-white">🌐 Suivez-nous</h3>
            <div className="flex gap-4">
              <a 
                href={RESTAURANT_INFO.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/20 hover:bg-white/10 transition-all"
              >
                <Instagram className="h-5 w-5" />
                <span>@kaikaiswitzerland</span>
              </a>
              <a 
                href={RESTAURANT_INFO.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/20 hover:bg-white/10 transition-all"
              >
                <Facebook className="h-5 w-5" />
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Checkout({ items, cartVariants, subtotal, discount, deliveryFee, total, mode, setMode, onClose, onClear, onRemoveOne, onAdd, onSuccess }) {
  const [form, setForm] = useState({ 
    firstName: "", 
    lastName: "", 
    phone: "", 
    address: "", 
    postalCode: "",
    instructions: ""
  });
  const [deliveryError, setDeliveryError] = useState("");
  
  const MINIMUM_DELIVERY = 20.00;
  const canDelivery = subtotal >= MINIMUM_DELIVERY;
  
  const hasItems = items.some(i => i.qty > 0);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    if (name === "postalCode" && value.length === 4) {
      if (!RESTAURANT_INFO.deliveryZones.includes(value)) {
        setDeliveryError(`Désolé, nous ne livrons pas encore dans la zone ${value}. Essayez "À emporter" !`);
      } else {
        setDeliveryError("");
      }
    }
  };
  
  const canSubmit = hasItems && 
                    form.firstName && 
                    form.lastName && 
                    form.phone && 
                    (mode === "pickup" || (form.address && form.postalCode && !deliveryError));
  
  useEffect(() => {
    if (!canDelivery && mode === "delivery") {
      setMode("pickup");
    }
  }, [canDelivery, mode, setMode]);

  return (
    <section className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm">
      <div className="h-full w-full max-w-xl overflow-auto border-l border-white/10 bg-black p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Commande</h2>
          <button onClick={onClose} className="rounded-xl border border-white/20 p-2 hover:bg-white/10 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {mode === "delivery" && (
          <div className="mb-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3 flex items-center gap-2 text-sm">
            <Bike className="h-4 w-4 text-blue-400" />
            <span className="text-blue-400">Livraison estimée : {RESTAURANT_INFO.deliveryTime} min</span>
          </div>
        )}

        <div className="space-y-3">
          {items.filter(i => i.qty > 0).map(it => {
            const variants = cartVariants[it.id];
            const isArray = Array.isArray(variants);
            const variantsToDisplay = isArray ? variants : (variants ? [variants] : []);
            
            return (
              <div key={it.id} className="rounded-2xl border border-white/10 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium">{it.name}</div>
                    
                    {variantsToDisplay.length > 0 && variantsToDisplay[0]?.type && (
                      <div className="mt-2 space-y-3">
                        {variantsToDisplay.map((variant, formuleIdx) => (
                          <div key={formuleIdx} className="text-xs text-white/60 pl-3 border-l-2 border-white/20">
                            {variantsToDisplay.length > 1 && (
                              <div className="font-semibold text-white/80 mb-1">Formule #{formuleIdx + 1}:</div>
                            )}
                            {variant.type === "decouverte" && (
                              <>
                                <div>• {variant.plat}{variant.proteins && variant.proteins[variant.plat] && ` (${variant.proteins[variant.plat]})`}</div>
                                <div>• {variant.boisson === 'Jus exotique' ? variant.jus : (variant.boisson === 'Eau' ? variant.eau : variant.boisson)}</div>
                              </>
                            )}
                            {variant.type === "voyage" && (
                              <>
                                <div className="font-semibold text-white/70">Plats:</div>
                                {variant.plats && variant.plats.map((plat, idx) => (
                                  <div key={idx}>• {plat}{variant.proteins && variant.proteins[plat] && ` (${variant.proteins[plat]})`}</div>
                                ))}
                                <div className="font-semibold text-white/70 mt-1">Boissons:</div>
                                {variant.boissons && variant.boissons.map((boisson, idx) => {
                                  if (boisson === 'Jus exotique' && variant.jus && variant.jus[idx]) {
                                    return <div key={idx}>• {variant.jus[idx]}</div>;
                                  } else if (boisson === 'Eau' && variant.eau && variant.eau[idx]) {
                                    return <div key={idx}>• {variant.eau[idx]}</div>;
                                  }
                                  return <div key={idx}>• {boisson}</div>;
                                })}
                                <div className="font-semibold text-white/70 mt-1">Dessert:</div>
                                <div>• {variant.dessert}{variant.coulisDessert && ` (${variant.coulisDessert})`}</div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {variantsToDisplay.length > 0 && !variantsToDisplay[0]?.type && (
                      <div className="mt-1 space-y-0.5">
                        {variantsToDisplay.map((v, idx) => (
                          <div key={idx} className="text-xs text-white/60">• {v.name}</div>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-sm text-white/60 mt-1">{it.qty} × {format(it.price)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-right font-medium">{format(it.price * it.qty)}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        onClick={() => onAdd(it.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/15 text-white/50 hover:bg-white/10 hover:text-white transition-all"
                        title="Ajouter 1"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      {it.qty > 1 && (
                        <button
                          onClick={() => onRemoveOne(it.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/15 text-white/50 hover:bg-white/10 hover:text-white transition-all text-xs"
                          title="Retirer 1"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const arr = cartVariants[it.id];
                          const lastIdx = Array.isArray(arr) ? arr.length - 1 : null;
                          onRemoveOne(it.id, lastIdx);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/15 text-white/40 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-400 transition-all"
                        title="Supprimer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {!hasItems && <div className="rounded-2xl border border-white/10 p-4 text-white/60">Votre panier est vide.</div>}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {!canDelivery && (
            <div className="flex items-start gap-2 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Livraison disponible à partir de {format(MINIMUM_DELIVERY)} de commande. Actuellement : {format(subtotal)}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button 
              onClick={() => { if (canDelivery) { setMode("delivery"); } }}
              disabled={!canDelivery}
              className={`flex-1 rounded-2xl px-3 py-2 text-sm transition-all ${
                mode === "delivery" 
                  ? "bg-white text-black" 
                  : !canDelivery 
                    ? "border border-white/10 text-white/30 cursor-not-allowed" 
                    : "border border-white/20 hover:bg-white/10"
              }`}
            >
              Livraison
            </button>
            <button 
              onClick={() => setMode("pickup")} 
              className={`flex-1 rounded-2xl px-3 py-2 text-sm transition-all ${mode === "pickup" ? "bg-white text-black" : "border border-white/20 hover:bg-white/10"}`}
            >
              À emporter
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input 
              name="firstName" 
              placeholder="Prénom *" 
              className="rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white/40 transition-colors" 
              value={form.firstName} 
              onChange={handleChange} 
            />
            <input 
              name="lastName" 
              placeholder="Nom *" 
              className="rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white/40 transition-colors" 
              value={form.lastName} 
              onChange={handleChange} 
            />
          </div>
          <input 
            name="phone" 
            placeholder="Téléphone *" 
            className="rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white/40 transition-colors" 
            value={form.phone} 
            onChange={handleChange} 
          />
          
          {mode === "delivery" && (
            <>
              <input 
                name="address" 
                placeholder="Adresse de livraison *" 
                className="rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white/40 transition-colors" 
                value={form.address} 
                onChange={handleChange} 
              />
              <input 
                name="postalCode" 
                placeholder="Code postal *" 
                maxLength="4"
                className={`rounded-xl border ${deliveryError ? 'border-red-500/50' : 'border-white/20'} bg-transparent px-3 py-2 outline-none focus:border-white/40 transition-colors`} 
                value={form.postalCode} 
                onChange={handleChange} 
              />
              {deliveryError && (
                <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{deliveryError}</span>
                </div>
              )}
            </>
          )}
          
          <textarea
            name="instructions"
            placeholder="Instructions spéciales (allergies, préférences, etc.)"
            className="rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white/40 transition-colors resize-none"
            rows="3"
            value={form.instructions}
            onChange={handleChange}
          />
        </div>

        <div className="mt-6 space-y-2 rounded-2xl border border-white/10 p-4">
          <Line label="Sous-total" value={format(subtotal)} />
          <Line label="Réduction site (-10%)" value={`- ${format(discount)}`} />
          {mode === "delivery" && <Line label="Frais de livraison" value={format(deliveryFee)} />}
          <Line label="Total" value={format(total)} bold />
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button 
            onClick={onClear} 
            className="rounded-2xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10 transition-all"
          >
            Vider le panier
          </button>
          <button 
            disabled={!canSubmit} 
            onClick={() => onSuccess()} 
            className={`rounded-2xl px-4 py-2 transition-all ${canSubmit ? "bg-white text-black hover:bg-white/90" : "border border-white/20 text-white/50 cursor-not-allowed"}`}
          >
            Payer maintenant
          </button>
        </div>
        <p className="mt-3 text-xs text-white/50">(Intégration paiement à brancher : Stripe / Twint / Cartes)</p>
      </div>
    </section>
  );
}

function Line({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? "font-semibold" : "text-white/70"}`}>{label}</span>
      <span className={bold ? "font-semibold" : "text-white/90"}>{value}</span>
    </div>
  );
}
