// src/App.jsx - VERSION NETTOYÉE
// Modifications du 6 mai 2026 :
//   - Suppression de HeroSliderLegacy (fonction non utilisée, ~360 lignes mortes)
//   - Suppression de PalmLeaves (composant désactivé qui retourne null)
// Tout le reste est identique à la version précédente.

import React, { useMemo, useState, useEffect } from "react";
import { ShoppingCart, Minus, Plus, X, MapPin, Bike, Check, Phone, Instagram, Facebook, Clock, Info, AlertCircle, ChevronRight } from "lucide-react";
import IslandModeToggle from "./components/IslandModeToggle.jsx";
import HeroSliderV2 from "./components/HeroSliderV2.jsx";
import OrderSuccessPage from "./pages/OrderSuccessPage.jsx";
import { supabase } from "./lib/supabase.js";
import { useRestaurantOpen } from "./hooks/useRestaurantOpen.js";
import { useOutOfStock } from "./hooks/useOutOfStock.js";
import {
  ALLERGENS,
  getAllergensForItem,
  getAllAllergens,
  hasSaladSide,
  formatAllergenNames,
  formatAllergenNamesShort,
} from "./data/allergens.js";
import {
  DELIVERY_ZONES,
  NPA_TO_ZONE,
  getZoneByNpa,
  getDeliveryFee,
  getAllNpas,
} from "./lib/deliveryZones.js";

// Clé localStorage versionnée — bump le suffixe v* si la structure change.
const CART_STORAGE_KEY = 'kaikai_cart_v1';

// Limites des notes (alignées avec ce que le serveur re-sanitize dans
// api/create-checkout.js — garder les deux synchronisés).
const NOTE_KITCHEN_MAX = 500;
const NOTE_DELIVERY_MAX = 200;
const sanitizeNote = (s, max) => String(s || '').trim().slice(0, max);
// TTL panier : 24h. Au-delà, on jette (le client a peut-être oublié, ou les
// prix/menu ont pu bouger entre-temps).
const CART_TTL_MS = 24 * 60 * 60 * 1000;

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

`;

// Informations du restaurant
const RESTAURANT_INFO = {
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
  
  // Display uniquement (footer + AboutModal) — heures de SERVICE affichées
  // aux clients. Source de vérité numérique des plages de pré-commande :
  // src/lib/restaurantHours.js (LUNCH/DINNER, dinner.open=17:30 pour la
  // pré-commande). Ici on affiche 18h-22h (service réel) et on mentionne
  // "pré-commande dès 17h30" séparément dans le copy footer/AboutModal.
  hours: {
    lunch: { start: "12:00", end: "14:00" },
    dinner: { start: "18:00", end: "22:00" }
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

// --- Menu réel (CHF)
const MENU = [
  // ENTRÉES
  {
    id: "1",
    name: "Velouté koko",
    desc: "Légumes de saison et crème coco",
    price: 4.90,
    category: "entrees",
    hasVariants: true,
    variantSubtitle: "Servi froid ou chaud ?",
    variants: [
      { id: "froid", name: "Servi froid", desc: "Idéal pour les beaux jours" },
      { id: "chaud", name: "Servi chaud", desc: "Réconfortant et parfumé" }
    ]
  },
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
  { id: "8",  name: "Wok de Bœuf", desc: "Wok de bœuf, légumes de saison, sauce sésame, servi avec du riz et une salade", price: 26.90, category: "chaud" },

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
  "5": "center 60%",
  "6": "center 60%",
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

// Badge d'état affiché dans le header sticky.
// 3 couleurs :
//   - Vert : ouvert (statusLabel = "Ouvert · ferme à 14h")
//   - Rouge : fermé temporairement (toggle admin "Stop commandes")
//   - Orange : fermé automatiquement (lundi ou hors heures de service)
function OpenStatus({ isOpen, manualClosure, statusLabel }) {
  let palette;
  if (isOpen) {
    palette = {
      bg: 'bg-green-500/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
      dot: 'bg-green-400 animate-pulse',
    };
  } else if (manualClosure) {
    palette = {
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
      dot: 'bg-red-400',
    };
  } else {
    palette = {
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
    };
  }
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${palette.bg} ${palette.border} ${palette.text}`}>
      <div className={`h-2 w-2 rounded-full ${palette.dot}`}></div>
      <span className="text-sm font-medium">{statusLabel}</span>
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
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const check = () => {
      const sentinel = document.getElementById("hero-end");
      if (!sentinel) return;
      setVisible(sentinel.getBoundingClientRect().top < 1);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  React.useEffect(() => {
    if (activeRef.current && navRef.current) {
      const nav = navRef.current;
      const btn = activeRef.current;
      nav.scrollTo({
        left: btn.offsetLeft - nav.offsetWidth / 2 + btn.offsetWidth / 2,
        behavior: "smooth",
      });
    }
  }, [activeCategory]);

  const scrollToCategory = (id) => {
    const el = document.getElementById(`section-${id}`);
    if (!el) return;
    const navH = navRef.current ? navRef.current.offsetHeight : 44;
    const top = el.getBoundingClientRect().top + window.scrollY - navH - 8;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div
      ref={navRef}
      className="cat-nav"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        gap: "8px",
        overflowX: "auto",
        padding: "10px 16px",
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
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
              padding: "5px 14px",
              fontSize: "14px",
              fontWeight: 500,
              transition: "all 0.2s ease",
              background: isActive ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)",
              color: isActive ? "#ffffff" : "rgba(255,255,255,0.75)",
              border: isActive ? "1px solid rgba(255,255,255,0.40)" : "1px solid rgba(255,255,255,0.15)",
              cursor: "pointer",
            }}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
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
  const { isOpen: restaurantOpen, manualClosure, statusLabel: openStatusLabel, status: openStatus } = useRestaurantOpen();
  const { items: outOfStockItems } = useOutOfStock();

  const [cart, setCart] = useState({});
  const [cartVariants, setCartVariants] = useState({});
  const [mode, setMode] = useState("delivery");
  // NPA saisi par le client au checkout. Élevé au niveau KaiKaiApp parce
  // qu'il pilote deliveryFee (donc total) et l'affichage MiniCart.
  const [deliveryNpa, setDeliveryNpa] = useState("");
  // Modale "Voir les zones desservies" — ouverte depuis le Checkout (si NPA
  // hors zone) ou depuis l'AboutModal.
  const [showZonesModal, setShowZonesModal] = useState(false);
  // TODO réactiver -10% quand le Mode Île (programme membre) revient.
  // Garder le couponApplied pour que la logique discount/MiniCart/Checkout
  // continue de fonctionner sans changement quand on remettra à true.
  const [couponApplied] = useState(false);
  const [step, setStep] = useState(
    window.location.pathname === '/payment-success' ? 'success' : 'menu'
  );
  // ID de la commande à passer à OrderSuccessPage pour les flows internes
  // (Cash/Twint juste après l'INSERT). Évite la fragilité d'un lookup
  // window.location.search au mount alors que replaceState n'a peut-être
  // pas encore été appliqué côté navigateur (ou React commit avant).
  const [successOrderId, setSuccessOrderId] = useState(null);
  const [logoVisible, setLogoVisible] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  const activeCategory = useActiveCategory();

  const items = useMemo(() => MENU_SORTED.map(m => ({ ...m, qty: cart[m.id] || 0 })), [cart]);
  const subtotal = useMemo(() => items.reduce((s, it) => s + it.price * it.qty, 0), [items]);
  const discount = useMemo(() => (couponApplied ? subtotal * 0.10 : 0), [couponApplied, subtotal]);
  // deliveryFee dépend du NPA (zone) : 4.90 / 6.90 / 9.90 CHF, ou 0 si
  // NPA hors zone ou mode pickup. Le total qui en découle est aussi
  // recalculé côté serveur (api/create-checkout.js) pour empêcher tout
  // tampering, via la même table NPA → zone (api/_lib/deliveryZones.js).
  const deliveryFee = useMemo(() => {
    if (mode !== "delivery" || subtotal <= 0) return 0;
    return getDeliveryFee(deliveryNpa) ?? 0;
  }, [mode, subtotal, deliveryNpa]);
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

  // ─── Panier persistant (localStorage) ─────────────────────────────────
  // Au mount : restaurer si présent + non expiré + IDs encore au menu.
  // À chaque mutation cart/cartVariants : sauvegarder.
  // À la success de commande : purger explicitement (cf handleOrderSubmit).
  //
  // Le filtre IDs au restore protège contre la situation où on supprime un
  // plat du menu entre 2 sessions client — sinon le client aurait un cart
  // référençant un item fantôme qui apparaîtrait à 0 partout.
  useEffect(() => {
    try {
      // Cas redirect retour SumUp : l'order a déjà été insérée en
      // pending_payment juste avant la redirection. On purge le panier
      // mémorisé pour ne pas le restaurer dans le state derrière la page
      // succès (cliquer "Retour au menu" doit ramener au menu propre).
      if (window.location.pathname === '/payment-success') {
        localStorage.removeItem(CART_STORAGE_KEY);
        return;
      }
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      const { items, variants, savedAt } = parsed;
      if (typeof savedAt !== 'number' || Date.now() - savedAt > CART_TTL_MS) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return;
      }
      const validIds = new Set(MENU_SORTED.map((m) => m.id));
      const cleanedCart = {};
      const cleanedVariants = {};
      Object.entries(items || {}).forEach(([id, qty]) => {
        if (validIds.has(id) && Number.isFinite(qty) && qty > 0) {
          cleanedCart[id] = qty;
          if (Array.isArray(variants?.[id])) cleanedVariants[id] = variants[id];
        }
      });
      if (Object.keys(cleanedCart).length > 0) {
        setCart(cleanedCart);
        setCartVariants(cleanedVariants);
      }
    } catch {
      // JSON corrompu / accès localStorage refusé / Safari privé : ignorer.
    }
  }, []);

  useEffect(() => {
    try {
      const isEmpty = Object.keys(cart).length === 0;
      if (isEmpty) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return;
      }
      const payload = {
        items: cart,
        variants: cartVariants,
        savedAt: Date.now(),
      };
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* quota dépassé / accès refusé : silencieux */
    }
  }, [cart, cartVariants]);

  // Garde-fou rupture : si un plat passe en rupture pendant que l'utilisateur
  // l'a dans son panier (toggle admin entre 2 polls), on le retire au prochain
  // changement de la liste. On utilise setX(prev =>) pour éviter de dépendre
  // de cart/cartVariants dans deps et retourner prev si rien à filtrer.
  useEffect(() => {
    if (outOfStockItems.length === 0) return;
    const outSet = new Set(outOfStockItems);
    setCart(prev => {
      let changed = false;
      const filtered = {};
      for (const [id, qty] of Object.entries(prev)) {
        if (outSet.has(id)) { changed = true; continue; }
        filtered[id] = qty;
      }
      return changed ? filtered : prev;
    });
    setCartVariants(prev => {
      let changed = false;
      const filtered = {};
      for (const [id, v] of Object.entries(prev)) {
        if (outSet.has(id)) { changed = true; continue; }
        filtered[id] = v;
      }
      return changed ? filtered : prev;
    });
  }, [outOfStockItems]);

  const handleOrderSubmit = async ({ form, paymentMethod }) => {
    // Garde-fou front : si le restaurant a fermé entre l'ouverture du
    // Checkout et le clic submit (toggle admin ou bascule horaire pendant
    // la saisie), on refuse l'INSERT. Le serveur a son propre garde-fou
    // (api/create-checkout.js) pour les paiements carte.
    if (!restaurantOpen) {
      return manualClosure
        ? "Le restaurant est temporairement fermé. Réessayez plus tard."
        : `Le restaurant vient de fermer. ${openStatusLabel}.`;
    }

    // Garde-fou front : NPA hors zone en mode livraison. Le bouton "Commander"
    // est déjà désactivé côté UI, mais on garantit ici qu'aucun INSERT ne
    // passe avec un NPA bidon (et le serveur double-check pour le flow carte).
    if (mode === 'delivery' && !getZoneByNpa(deliveryNpa)) {
      return "Code postal hors zone de livraison. Choisissez 'À emporter' ou un autre NPA.";
    }

    const orderItems = items
      .filter(it => it.qty > 0)
      .map(it => ({
        id: it.id,
        name: it.name,
        qty: it.qty,
        price: it.price,
        subtotal: parseFloat((it.price * it.qty).toFixed(2)),
        variants: cartVariants[it.id] || [],
      }));

    try {
      const isCard = paymentMethod === 'card';
      const noteKitchen  = sanitizeNote(form.noteKitchen, NOTE_KITCHEN_MAX);
      const noteDelivery = mode === 'delivery'
        ? sanitizeNote(form.noteDelivery, NOTE_DELIVERY_MAX)
        : '';

      const { data: inserted, error } = await supabase.from('orders').insert([{
        customer_name: `${form.firstName} ${form.lastName}`.trim(),
        customer_email: form.email?.trim() || null,
        customer_phone: form.phone,
        customer_address: mode === 'delivery'
          ? `${form.address}, ${deliveryNpa} Genève`
          : 'À emporter',
        items: orderItems,
        total: parseFloat(total.toFixed(2)),
        payment_method: paymentMethod,
        status: isCard ? 'pending_payment' : 'pending',
        // Legacy `notes` non rempli pour les nouvelles commandes — reste
        // utilisé par api/sumup-refund.js pour log motif refund.
        notes: '',
        note_kitchen:  noteKitchen,
        note_delivery: noteDelivery,
        delivery_mode: mode,
      }]).select('id').single();

      if (error) throw error;

      if (isCard) {
        // Le total est recalculé côté serveur depuis order.items pour empêcher
        // toute manipulation. On envoie uniquement order_id + redirect_url.
        // L'email de confirmation sera déclenché par le webhook SumUp une fois
        // le paiement confirmé — pas besoin d'appeler send-order-confirmation ici.
        const res = await fetch('/api/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: inserted.id,
            redirect_url: `${window.location.origin}/payment-success?order_id=${inserted.id}`,
            // Le serveur recompute deliveryFee depuis ce NPA via sa propre
            // table — pas de confiance dans le total qu'on enverrait.
            npa: mode === 'delivery' ? deliveryNpa : null,
            // Notes re-sanitized côté serveur avant UPDATE (anti-tampering
            // de l'INSERT initial qui passe par RLS anon sans validation
            // contenu).
            noteKitchen,
            noteDelivery,
          }),
        });
        const checkout = await res.json();
        if (!res.ok || !checkout.checkout_url) throw new Error(checkout.error || 'Erreur SumUp');
        window.location.href = checkout.checkout_url;
        return null;
      }

      // Cash / Twint : déclenche l'envoi d'email en fire-and-forget.
      // Si l'email échoue, ça ne doit pas casser le flow checkout — d'où
      // l'absence d'await et le catch silencieux (log côté server uniquement).
      if (form.email?.trim()) {
        fetch('/api/send-order-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: inserted.id }),
        }).catch((err) => {
          console.warn('[KaïKaï] send-order-confirmation failed (non bloquant)', err);
        });
      }

      // 1. URL mise à jour AVANT le changement d'étape — garantit que si
      //    OrderSuccessPage est rendu avant que React voie le state, ou
      //    si l'utilisateur F5, l'URL contient déjà order_id.
      try {
        window.history.replaceState(null, '', `/payment-success?order_id=${inserted.id}`);
      } catch { /* ignore */ }
      // 2. Pose l'ID en state (passé directement en prop à OrderSuccessPage)
      //    pour ne PAS dépendre du timing de l'URL : c'est la source de
      //    vérité du composant succès pour ce flow Cash/Twint.
      setSuccessOrderId(inserted.id);
      setStep("success");
      clear();
      return null;
    } catch (err) {
      console.error('[KaïKaï] Erreur insertion commande:', err);
      return "Oups, votre commande n'a pas pu être enregistrée. Réessayez dans un instant, ou contactez-nous directement au +41 76 519 76 70 ou par WhatsApp. Si vous avez déjà payé, ne vous inquiétez pas : aucun débit n'est perdu, on va régler ça ensemble.";
    }
  };

  return (
    <>
      <style>{globalStyles}</style>
      <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-49 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {logoVisible && <img src={LOGO_SRC} alt="KaïKaï" className="h-8" style={{ mixBlendMode: 'screen' }} onError={() => setLogoVisible(false)} />}
            <div>
              <h1 className="text-xl font-semibold">KaïKaï</h1>
              <OpenStatus
                isOpen={restaurantOpen}
                manualClosure={manualClosure}
                statusLabel={openStatusLabel}
              />
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

      {showAbout && (
        <AboutModal
          onClose={() => setShowAbout(false)}
          onShowZones={() => {
            // Ferme l'AboutModal pour ne pas empiler 2 overlays.
            setShowAbout(false);
            setShowZonesModal(true);
          }}
        />
      )}

      {/* Menu principal */}
      {step === "menu" && (
        <>
          <CategoryNav activeCategory={activeCategory} />
          <HeroSliderV2 />
          <div id="hero-end" />
          <section className="mx-auto max-w-5xl px-4 pt-0 pb-10 md:pt-10">
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
                <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove} outOfStock={outOfStockItems.includes(item.id)}
                  photo={ENTREE_PHOTOS[item.id]} photoPos={ENTREE_PHOTO_POS[item.id]}
                  photoHeight="h-56" />
              ))}

              <h3 id="section-chaud" className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🔥 Plat Chaud</h3>
              {SEC_CHAUD.map(item => (
                <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove} outOfStock={outOfStockItems.includes(item.id)}
                  photo={CHAUD_PHOTOS[item.id]} photoPos={CHAUD_PHOTO_POS[item.id]}
                  photoHeight="h-56" />
              ))}

              <h3 id="section-froid" className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">❄️ Plat Froid</h3>
              {SEC_FROID.map(item => (
                <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove} outOfStock={outOfStockItems.includes(item.id)}
                  photo={FROID_PHOTOS[item.id]} photoPos={FROID_PHOTO_POS[item.id]} />
              ))}

              <h3 id="section-formules" className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🎁 Formules</h3>
              {SEC_FORMULES.map(item => (
                <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove} outOfStock={outOfStockItems.includes(item.id)} isFormula
                  photo={FORMULE_PHOTOS[item.id]} photoPos={FORMULE_PHOTO_POS[item.id]} photoHeight="h-64" />
              ))}

              <h3 id="section-desserts" className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🍰 Desserts</h3>
              {SEC_DESSERT.map(item => (
                <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove} outOfStock={outOfStockItems.includes(item.id)}
                  photo={DESSERT_PHOTOS[item.id]} photoPos={DESSERT_PHOTO_POS[item.id]} />
              ))}

              <h3 id="section-boissons" className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🧉 Boissons</h3>
              {SEC_BOISSON.map(item => (
                <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove} outOfStock={outOfStockItems.includes(item.id)}
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
          onSuccess={handleOrderSubmit}
          restaurantOpen={restaurantOpen}
          manualClosure={manualClosure}
          openStatusLabel={openStatusLabel}
          openStatus={openStatus}
          deliveryNpa={deliveryNpa}
          setDeliveryNpa={setDeliveryNpa}
          onShowZones={() => setShowZonesModal(true)}
        />
      )}

      {showZonesModal && <ZonesModal onClose={() => setShowZonesModal(false)} />}

      {step === "success" && (
        <OrderSuccessPage
          initialOrderId={successOrderId}
          onBackToMenu={() => {
            // Nettoie l'URL pour que F5 ne ramène pas sur /payment-success
            try { window.history.replaceState(null, '', '/'); } catch { /* ignore */ }
            setSuccessOrderId(null);
            setStep('menu');
          }}
        />
      )}

      {step === "menu" && Object.values(cart).reduce((s, q) => s + q, 0) > 0 && (
        <MiniCart
          cart={cart}
          items={items}
          total={total}
          discount={discount}
          mode={mode}
          onOpen={() => setStep("checkout")}
          restaurantOpen={restaurantOpen}
          manualClosure={manualClosure}
          openStatusLabel={openStatusLabel}
        />
      )}

      {/* Mode Île — pastille membres */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '40px auto' }}>
        <IslandModeToggle />
      </div>

      {/* Footer */}
      <footer className="mt-0 border-t border-white/10 py-10 text-center text-sm text-white/60">
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
          <div className="mt-1">📞 {RESTAURANT_INFO.phoneDisplay} · 🕐 12h-14h | 18h-22h (pré-commande dès 11h / 17h30)</div>
          <div className="mt-1">
            📍 Livraison à Genève · Centre + 1ère et 2ème couronnes ·{' '}
            <button
              type="button"
              onClick={() => setShowZonesModal(true)}
              className="underline hover:text-white transition-colors"
            >
              voir les zones
            </button>
          </div>
          <div className="mt-2">© {new Date().getFullYear()} KaïKaï — Tous droits réservés.</div>

        </div>
      </footer>
    </div>
    </>
  );
}

// Composant MenuItem avec support de TOUS les modals
function MenuItem({ item, cart, add, remove, outOfStock = false, isFormula = false, photo = null, photoPos = "center", photoHeight = "h-48" }) {
  const [showVariants, setShowVariants] = useState(false);
  const [showJus, setShowJus] = useState(false);
  const [showFormuleModal, setShowFormuleModal] = useState(false);
  const [showProteinModal, setShowProteinModal] = useState(false);
  const [showCoulisModal, setShowCoulisModal] = useState(false);
  const [showEauModal, setShowEauModal] = useState(false);
  const [showAllergens, setShowAllergens] = useState(false);

  const allergens = getAllergensForItem(item.id);
  const allAllergens = getAllAllergens(allergens);
  const hasNoAllergens = allAllergens.length === 0 && allergens.traces.length === 0;
  
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
    if (outOfStock) return;
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
      <div className={`relative rounded-3xl border border-white/10 overflow-hidden transition-all hover:border-white/20 hover:shadow-lg hover:shadow-white/5 ${isFormula ? 'bg-gradient-to-br from-white/5 to-transparent' : ''} ${outOfStock ? 'opacity-50' : ''}`}>
        {photo && (
          <div className={`w-full ${photoHeight} overflow-hidden`}>
            <img
              src={photo}
              alt={item.name}
              className="w-full h-full object-cover"
              style={{
                objectPosition: photoPos,
                ...(item.id === "6" ? { transform: "scale(1.05)", transformOrigin: "center center" } : {}),
              }}
              onError={e => { e.target.style.display = 'none'; e.target.parentNode.style.display = 'none'; }}
            />
          </div>
        )}
        <div className="flex items-start justify-between gap-4 p-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-lg font-medium">{item.name}</div>
              {outOfStock && (
                <span className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-red-300">
                  En rupture
                </span>
              )}
            </div>
            <div className="mt-1 text-sm text-white/60">{item.desc}</div>
            <div className="mt-2 text-white/90">{format(item.price)}</div>
            {(isFormula || allergens.isComposite) ? (
              <div className="mt-2 text-[11px] text-white/55">
                Allergènes : selon votre composition
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAllergens(true)}
                className="mt-2 block text-left transition-opacity hover:opacity-70"
                aria-label="Voir le détail des allergènes"
              >
                {hasNoAllergens ? (
                  <span className="text-[11px] text-emerald-400/70">Sans allergène majeur</span>
                ) : (
                  <>
                    <span className="text-[11px] text-white/55">
                      Contient : {formatAllergenNamesShort(allAllergens)}
                    </span>
                    {allergens.traces.length > 0 && allAllergens.length > 0 && (
                      <span className="mt-0.5 block text-[10px] text-white/35">
                        Traces : {formatAllergenNamesShort(allergens.traces)}
                      </span>
                    )}
                  </>
                )}
              </button>
            )}
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
              disabled={outOfStock}
              title={outOfStock ? 'En rupture de stock' : 'Ajouter au panier'}
              className={`rounded-2xl border border-white/20 p-2 transition-all ${outOfStock ? 'cursor-not-allowed opacity-60' : 'hover:bg-white/10 active:scale-95'}`}
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

      {showAllergens && (
        <AllergensModal
          item={item}
          allergens={allergens}
          onClose={() => setShowAllergens(false)}
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

function OptionTile({ emoji, name, desc, isSelected, onClick, index, badge, disabled }) {
  return (
    <button
      className={`modal-tile tile-${Math.min(index, 6)}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px', marginBottom: 8,
        background: isSelected ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.03)',
        border: isSelected ? '1px solid rgba(255,255,255,0.28)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        opacity: disabled ? 0.4 : 1,
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

function SelectionList({ label, items, onRemove }) {
  return (
    <div style={{
      marginTop: 4,
      marginBottom: 4,
      padding: 10,
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 14,
      border: '1px dashed rgba(255,255,255,0.12)',
    }}>
      <div style={{
        fontSize: 9,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.50)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 8,
        paddingLeft: 2,
      }}>
        {label}
      </div>
      {items.map((it) => (
        <div key={it.key} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '7px 10px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 10,
          marginBottom: 4,
        }}>
          {it.emoji && <span style={{ fontSize: 18, flexShrink: 0 }}>{it.emoji}</span>}
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {it.name}
            {it.detail && (
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginLeft: 6 }}>
                · {it.detail}
              </span>
            )}
          </span>
          <button
            onClick={() => onRemove(it.key)}
            aria-label="Retirer"
            style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: 'none', color: 'rgba(255,255,255,0.65)',
              fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      ))}
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
  const variantEmojis = { tahiti: '🥥', hawaii: '🥭', samoa: '🌶️', froid: '❄️', chaud: '🔥' };
  const subtitle = item.variantSubtitle || 'Choisissez votre sauce';
  return (
    <BottomSheet title={item.name} subtitle={subtitle} photo={getPhoto(item.id)} photoPos={getPhotoPos(item.id)} onClose={onClose}>
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
        <OptionTile key={v.id} emoji={v.id === 'mangue' ? '🥭' : '🫐'} name={v.name} desc={v.desc} isSelected={false} onClick={() => onSelect(v)} index={i} />
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

// ─── ALLERGÈNES MODAL ────────────────────────────────────────────────────────
function AllergensModal({ item, allergens, onClose }) {
  const withSalad = hasSaladSide(allergens);
  const contains  = allergens.contains  || [];
  const fromSalad = allergens.fromSalad || [];
  const traces    = allergens.traces    || [];
  // Cas 2 (sans salade) : "rien" = contains vide + traces vide.
  const noAllergensAtAll = !withSalad && contains.length === 0 && traces.length === 0;

  return (
    <BottomSheet
      title={`Allergènes — ${item.name}`}
      subtitle="Liste des 14 allergènes à déclaration obligatoire (UE/Suisse)"
      photo={getPhoto(item.id)}
      photoPos={getPhotoPos(item.id)}
      onClose={onClose}
    >
      <div className="space-y-5 pb-2">
        {noAllergensAtAll ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="text-sm text-emerald-300">Sans allergène majeur</div>
            <p className="mt-1 text-xs text-white/55">
              Aucun des 14 allergènes à déclaration obligatoire n'est présent dans ce plat.
            </p>
          </div>
        ) : withSalad ? (
          <>
            {/* Section 1 — Le plat lui-même */}
            <div>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">Le plat contient</div>
              {contains.length > 0 ? (
                <ul className="space-y-1.5">
                  {contains.map(k => (
                    <li key={k} className="flex items-center gap-2.5 text-sm text-white/85">
                      <span className="block h-1.5 w-1.5 rounded-full bg-amber-400" />
                      {ALLERGENS[k]?.name || k}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-white/65">Aucun allergène majeur</div>
              )}
            </div>

            {/* Section 2 — La salade d'accompagnement */}
            <div className="border-t border-white/10 pt-4">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">Salade d'accompagnement contient</div>
              <ul className="space-y-1.5">
                {fromSalad.map(k => (
                  <li key={k} className="flex items-center gap-2.5 text-sm text-white/85">
                    <span className="block h-1.5 w-1.5 rounded-full bg-amber-400" />
                    {ALLERGENS[k]?.name || k}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs italic text-white/55">
                Vous pouvez demander sans salade via les instructions cuisine lors de la commande.
              </p>
            </div>

            {/* Section 3 — Traces (si applicable) */}
            {traces.length > 0 && (
              <div className="border-t border-white/10 pt-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">Peut contenir des traces de</div>
                <ul className="space-y-1.5">
                  {traces.map(k => (
                    <li key={k} className="flex items-center gap-2.5 text-sm text-white/60">
                      <span className="block h-1.5 w-1.5 rounded-full bg-white/30" />
                      {ALLERGENS[k]?.name || k}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Cas 2 — Sans salade : comportement initial */}
            {contains.length > 0 && (
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">Contient</div>
                <ul className="space-y-1.5">
                  {contains.map(k => (
                    <li key={k} className="flex items-center gap-2.5 text-sm text-white/85">
                      <span className="block h-1.5 w-1.5 rounded-full bg-amber-400" />
                      {ALLERGENS[k]?.name || k}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {traces.length > 0 && (
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">Peut contenir des traces de</div>
                <ul className="space-y-1.5">
                  {traces.map(k => (
                    <li key={k} className="flex items-center gap-2.5 text-sm text-white/60">
                      <span className="block h-1.5 w-1.5 rounded-full bg-white/30" />
                      {ALLERGENS[k]?.name || k}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/70">
          Pour toute allergie sévère, contactez-nous au{' '}
          <a href={`tel:${RESTAURANT_INFO.phone}`} className="text-white underline underline-offset-2">
            {RESTAURANT_INFO.phoneDisplay}
          </a>{' '}avant de commander.
        </div>
      </div>
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
  const [proteinForPlatIdx, setProteinForPlatIdx] = useState(null);
  // Voyage: array aligné sur selectedPlats[idx] → permet 2× même plat avec protéines distinctes.
  // Découverte: objet { [platName]: protein } (1 seul plat possible, format inchangé).
  const [selectedProteins, setSelectedProteins] = useState(
    item.formuleType === 'voyage' ? [] : {}
  );
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
  const coulisOpts = [{ id:'mangue', name:'Coulis Mangue', desc:'Doux et tropical', emoji:'🥭' },{ id:'fruits-rouges', name:'Coulis Fruits Rouges', desc:'Frais et acidulé', emoji:'🫐' }];

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
      for (let i = 0; i < selectedPlats.length; i++) {
        if (needsProtein(selectedPlats[i]) && !selectedProteins[i]) return false;
      }
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
    if (selectedPlats.length >= 2) return;
    const newIdx = selectedPlats.length;
    setSelectedPlats([...selectedPlats, plat]);
    setSelectedProteins(prev => [...(Array.isArray(prev) ? prev : []), null]);
    if (needsProtein(plat)) {
      setProteinForPlat(plat);
      setProteinForPlatIdx(newIdx);
      setShowProteinSelector(true);
    }
  };

  const removePlatAt = (idx) => {
    setSelectedPlats(prev => prev.filter((_, i) => i !== idx));
    setSelectedProteins(prev =>
      Array.isArray(prev) ? prev.filter((_, i) => i !== idx) : prev
    );
  };

  const handleBoissonDec = (b) => {
    if (selectedBoisson === b) { setSelectedBoisson(null); if(b==='Jus exotique') setSelectedJusDecouverte(null); if(b==='Eau') setSelectedEauDecouverte(null); return; }
    setSelectedBoisson(b);
    if (b === 'Jus exotique') setShowJusSelector(true);
    if (b === 'Eau') setShowEauSelector(true);
  };

  const handleBoissonVoy = (b) => {
    if (selectedBoissons.length >= 2) return;
    if (b === 'Jus exotique') {
      const jusCount = selectedBoissons.filter(x => x === 'Jus exotique').length;
      setSelectedBoissons([...selectedBoissons, b]);
      setJusIndex(jusCount);
      setShowJusSelector(true);
    } else {
      const eauCount = selectedBoissons.filter(x => x === 'Eau').length;
      setSelectedBoissons([...selectedBoissons, b]);
      setEauIndex(eauCount);
      setShowEauSelector(true);
    }
  };

  const removeBoissonAt = (idx) => {
    const b = selectedBoissons[idx];
    if (b === 'Jus exotique') {
      const jusIdxToRemove = selectedBoissons.slice(0, idx).filter(x => x === 'Jus exotique').length;
      setSelectedJusVoyage(prev => prev.filter((_, i) => i !== jusIdxToRemove));
    } else if (b === 'Eau') {
      const eauIdxToRemove = selectedBoissons.slice(0, idx).filter(x => x === 'Eau').length;
      setSelectedEauVoyage(prev => prev.filter((_, i) => i !== eauIdxToRemove));
    }
    setSelectedBoissons(prev => prev.filter((_, i) => i !== idx));
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
          // Découverte: protéine par nom de plat. Voyage: la protéine peut différer
          // par occurrence — on n'affiche pas de sub-label sur le tile (la SelectionList
          // détaille chaque occurrence avec sa protéine).
          const protDec = !isVoyage ? selectedProteins[plat] : null;
          const platCount = isVoyage ? selectedPlats.filter(p => p === plat).length : 0;
          const platLimit = isVoyage && selectedPlats.length >= 2;
          // Badge "choix requis" :
          //  - Découverte : ce plat est sélectionné mais pas encore de protéine
          //  - Voyage : au moins une occurrence de ce plat n'a pas encore de protéine assignée
          const needsProteinBadge = needsProtein(plat) && sel && (
            isVoyage
              ? selectedPlats.some((p, idx) => p === plat && !selectedProteins[idx])
              : !protDec
          );
          return (
            <OptionTile
              key={plat}
              emoji={platEmojis[plat]}
              name={plat + (platCount > 1 ? ` ×${platCount}` : '')}
              desc={protDec ? `${platDescs[plat]} · ${protDec}` : platDescs[plat]}
              isSelected={sel}
              onClick={() => isVoyage ? togglePlatVoy(plat) : togglePlatDec(plat)}
              index={i}
              badge={needsProteinBadge ? 'choix requis' : null}
              disabled={platLimit}
            />
          );
        })}

        {isVoyage && selectedPlats.length > 0 && (
          <SelectionList
            label={`Votre sélection (${selectedPlats.length}/2 plats)`}
            items={selectedPlats.map((p, i) => ({
              key: i,
              emoji: platEmojis[p],
              name: p,
              detail: (Array.isArray(selectedProteins) ? selectedProteins[i] : null) || null,
            }))}
            onRemove={removePlatAt}
          />
        )}

        <SectionLabel>{isVoyage ? "Boissons (jusqu'à 2)" : 'Votre boisson'}</SectionLabel>
        {['Jus exotique', 'Eau'].map((b, i) => {
          const selDec = selectedBoisson === b;
          const countVoy = selectedBoissons.filter(x => x === b).length;
          const selVoy = countVoy > 0;
          const sel = isVoyage ? selVoy : selDec;
          const boissonLimit = isVoyage && selectedBoissons.length >= 2;
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
              disabled={boissonLimit}
            />
          );
        })}

        {isVoyage && selectedBoissons.length > 0 && (
          <SelectionList
            label={`Votre sélection (${selectedBoissons.length}/2 boissons)`}
            items={selectedBoissons.map((b, i) => {
              const jusIdx = selectedBoissons.slice(0, i).filter(x => x === 'Jus exotique').length;
              const eauIdx = selectedBoissons.slice(0, i).filter(x => x === 'Eau').length;
              const detail = b === 'Jus exotique'
                ? (selectedJusVoyage[jusIdx] || null)
                : (selectedEauVoyage[eauIdx] || null);
              return {
                key: i,
                emoji: b === 'Jus exotique' ? '🧉' : '💧',
                name: b,
                detail,
              };
            })}
            onRemove={removeBoissonAt}
          />
        )}

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
          onSelect={opt => {
            if (item.formuleType === 'voyage') {
              setSelectedProteins(prev => {
                const arr = Array.isArray(prev) ? [...prev] : [];
                arr[proteinForPlatIdx] = opt.name;
                return arr;
              });
            } else {
              setSelectedProteins(p => ({ ...p, [proteinForPlat]: opt.name }));
            }
            setShowProteinSelector(false);
            setProteinForPlat(null);
            setProteinForPlatIdx(null);
          }}
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
function MiniCart({ cart, items, total, discount, mode = 'delivery', onOpen, restaurantOpen = true, manualClosure = false, openStatusLabel = '' }) {
  const totalQty = Object.values(cart).reduce((s, q) => s + q, 0);
  const cartItems = items.filter(i => i.qty > 0).slice(0, 3);
  // ETA visible directement dans le mini-cart pour rassurer avant clic
  // (mode='delivery' par défaut tant que le client n'a pas ouvert le
  // Checkout : on est sur la home, mode est dans le state parent).
  const etaLabel = mode === 'pickup'
    ? `Prêt en ${RESTAURANT_INFO.prepTime} min`
    : `Livré en ${RESTAURANT_INFO.deliveryTime} min`;

  // Si fermé : on garde le mini-panier visible (l'utilisateur voit ce qu'il
  // a sélectionné) mais le tap ouvre le Checkout qui affichera son bandeau
  // bloquant. Visuellement, on dim le bouton et on ajoute un petit texte
  // explicatif.
  const closedHint = !restaurantOpen
    ? (manualClosure ? 'Fermé temporairement' : openStatusLabel)
    : null;

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
        opacity: restaurantOpen ? 1 : 0.65,
        animation: 'tileIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
      }}
      title={closedHint || undefined}
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
        {restaurantOpen && (
          <div style={{ fontSize: 10, fontWeight: 600, color: '#C9A96E', marginTop: 1 }}>
            {etaLabel}
          </div>
        )}
      </div>

      <ChevronRight size={16} color="rgba(0,0,0,0.4)" style={{ flexShrink: 0 }} />
    </div>
  );
}

// Modale "Voir les zones desservies" — ouverte depuis le Checkout (NPA hors
// zone) ou depuis AboutModal. Affiche les 3 zones, leurs prix, et la liste
// des NPA couverts. Source : src/lib/deliveryZones.js.
function ZonesModal({ onClose }) {
  // Regroupe les NPA par zone pour l'affichage.
  const grouped = useMemo(() => {
    const out = { ZONE_1: [], ZONE_2: [], ZONE_3: [] };
    Object.entries(NPA_TO_ZONE).forEach(([npa, { zone, label }]) => {
      out[zone].push({ npa, label });
    });
    Object.values(out).forEach((arr) => arr.sort((a, b) => a.npa.localeCompare(b.npa)));
    return out;
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-black border border-white/20 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Zones de livraison</h2>
          <button onClick={onClose} className="rounded-xl border border-white/20 p-2 hover:bg-white/10 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-white/70 mb-6">
          Livraison à Genève uniquement, dans un rayon d'environ 8 km autour
          de notre cuisine (1 Bd de la Tour, Plainpalais). Les frais varient
          selon la zone.
        </p>

        <div className="space-y-4">
          {Object.values(DELIVERY_ZONES).map((zone) => (
            <div key={zone.id} className="rounded-2xl border border-white/10 p-4">
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <h3 className="text-lg font-semibold text-white">
                  {zone.name}
                </h3>
                <span className="text-sm font-mono text-[#C9A96E]">
                  {format(zone.fee)}
                </span>
              </div>
              <p className="text-xs text-white/60 mb-3">{zone.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {grouped[zone.id].map(({ npa, label }) => (
                  <span
                    key={npa}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/80"
                    title={label}
                  >
                    <span className="font-mono">{npa}</span>
                    <span className="text-white/50">·</span>
                    <span>{label}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-white/50 italic">
          NPA non listé ? Choisissez « À emporter » à 1 Bd de la Tour.
        </p>
      </div>
    </div>
  );
}

function AboutModal({ onClose, onShowZones = null }) {
  const [showAllergensInfo, setShowAllergensInfo] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-black border border-white/20 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">À propos de KaïKaï</h2>
          <button onClick={onClose} className="rounded-xl border border-white/20 p-2 hover:bg-white/10 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {showAllergensInfo && (
          <AllergensInfoModal onClose={() => setShowAllergensInfo(false)} />
        )}

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
            <h3 className="text-lg font-semibold mb-2 text-white">Allergènes</h3>
            <p className="text-sm leading-relaxed">
              Les allergènes de chaque plat sont déclarés sur la carte (touchez la ligne
              « Contient : ... » sous le plat). Pour toute allergie sévère, contactez-nous
              au{' '}
              <a href={`tel:${RESTAURANT_INFO.phone}`} className="text-white underline underline-offset-2">
                {RESTAURANT_INFO.phoneDisplay}
              </a>{' '}avant de commander.
            </p>
            <button
              type="button"
              onClick={() => setShowAllergensInfo(true)}
              className="mt-2 text-sm underline text-[#C9A96E] hover:text-white transition-colors"
            >
              Voir la liste des 14 allergènes
            </button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-white">🚲 Livraison</h3>
            <p className="text-sm leading-relaxed">
              Livraison à Genève uniquement, dans un rayon d'environ 8 km
              autour de notre cuisine. Frais selon zone : 4.90 / 6.90 / 9.90 CHF.
            </p>
            {onShowZones && (
              <button
                type="button"
                onClick={onShowZones}
                className="mt-2 text-sm underline text-[#C9A96E] hover:text-white transition-colors"
              >
                Voir les zones desservies
              </button>
            )}
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
                <span>Service midi : 12h-14h (pré-commande dès 11h)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>Service soir : 18h-22h (pré-commande dès 17h30)</span>
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
                src="https://maps.google.com/maps?q=Ka%C3%AFKa%C3%AF+Boulevard+de+la+Tour+1+1205+Gen%C3%A8ve&z=15&output=embed"
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href={RESTAURANT_INFO.google_page}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm underline text-[#C9A96E] hover:text-white transition-colors"
            >
              Voir sur Google Maps
            </a>
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
                <span>@kaikaifood.ch</span>
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

// Modale globale "14 allergènes" — ouverte depuis AboutModal. Empilable
// au-dessus d'AboutModal (z-index 60 vs son 50). Pas de photo (info légale).
function AllergensInfoModal({ onClose }) {
  const keys = Object.keys(ALLERGENS);
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-black border border-white/20 rounded-3xl p-6 max-w-lg w-full max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold">Les 14 allergènes</h2>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/20 p-2 hover:bg-white/10 transition-all"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-white/65 leading-relaxed mb-4">
          Liste des allergènes à déclaration obligatoire selon la législation
          UE/Suisse. Les allergènes présents dans chaque plat sont affichés sur
          la carte sous le prix.
        </p>

        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 mb-5">
          {keys.map((k) => (
            <li key={k} className="flex items-center gap-2 text-sm text-white/85">
              <span className="block h-1.5 w-1.5 rounded-full bg-amber-400" />
              {ALLERGENS[k].name}
            </li>
          ))}
        </ul>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/70">
          Pour toute allergie sévère, contactez-nous au{' '}
          <a href={`tel:${RESTAURANT_INFO.phone}`} className="text-white underline underline-offset-2">
            {RESTAURANT_INFO.phoneDisplay}
          </a>{' '}avant de commander.
        </div>
      </div>
    </div>
  );
}

// Email basique : présence d'un @ entouré de caractères non-espacés et
// d'un domaine avec extension. Pas RFC 5322 complet — c'est volontaire,
// la validation finale c'est Resend qui la fera.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Checkout({ items, cartVariants, subtotal, discount, deliveryFee, total, mode, setMode, onClose, onClear, onRemoveOne, onAdd, onSuccess, restaurantOpen = true, manualClosure = false, openStatusLabel = '', deliveryNpa = '', setDeliveryNpa = () => {}, onShowZones = () => {} }) {
  // `postalCode` ne fait plus partie de form : le NPA est élevé au niveau
  // parent (KaiKaiApp) pour piloter deliveryFee. On le lit/écrit via les
  // props deliveryNpa / setDeliveryNpa.
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    // Notes séparées : cuisine vs livreur. Le client peut transmettre
    // allergies/cuissons (cuisine) et instructions d'accès (livreur)
    // sans les mélanger — l'admin les voit en 2 sections distinctes.
    noteKitchen: "",
    noteDelivery: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);

  const MINIMUM_DELIVERY = 20.00;
  const canDelivery = subtotal >= MINIMUM_DELIVERY;

  const hasItems = items.some(i => i.qty > 0);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // NPA : sanitize (digits only, max 4) et délègue au parent.
  const handleNpaChange = (e) => {
    const raw = e.target.value || '';
    const cleaned = raw.replace(/\D/g, '').slice(0, 4);
    setDeliveryNpa(cleaned);
  };

  // Descripteur de zone pour le NPA courant. null si vide ou hors zone.
  const zoneInfo = mode === 'delivery' ? getZoneByNpa(deliveryNpa) : null;
  const npaIsFull = deliveryNpa.length === 4;
  const npaOutOfZone = mode === 'delivery' && npaIsFull && !zoneInfo;

  // Validation email :
  //  - paiement Carte  → email obligatoire ET au format valide
  //  - paiement Cash/Twint → email facultatif mais SI rempli, au format valide
  const emailRequired = paymentMethod === "card";
  const emailFormatOk = !form.email || EMAIL_REGEX.test(form.email.trim());
  const emailOk = emailFormatOk && (!emailRequired || !!form.email.trim());

  const canSubmit = restaurantOpen &&
                    hasItems &&
                    form.firstName &&
                    form.lastName &&
                    form.phone &&
                    emailOk &&
                    (mode === "pickup" || (form.address && !!zoneInfo));
  
  useEffect(() => {
    if (!canDelivery && mode === "delivery") {
      setMode("pickup");
    }
  }, [canDelivery, mode, setMode]);

  useEffect(() => {
    if (mode === "delivery" && paymentMethod === "cash") {
      setPaymentMethod("card");
    }
  }, [mode, paymentMethod]);

  return (
    <section className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm">
      <div className="h-full w-full max-w-xl overflow-auto border-l border-white/10 bg-black p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Commande</h2>
          <button onClick={onClose} className="rounded-xl border border-white/20 p-2 hover:bg-white/10 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!restaurantOpen && (
          <div
            className={`mb-4 rounded-2xl border p-4 flex items-start gap-3 ${
              manualClosure
                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            }`}
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium mb-0.5">
                {manualClosure
                  ? 'Restaurant temporairement fermé'
                  : 'Restaurant fermé'}
              </div>
              <div className="opacity-90">
                {manualClosure
                  ? 'La cuisine est surchargée — réessayez plus tard.'
                  : openStatusLabel + '.'}
              </div>
            </div>
          </div>
        )}

        {mode === "delivery" ? (
          <div className="mb-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3 flex items-center gap-2 text-sm">
            <Bike className="h-4 w-4 text-blue-400" />
            <span className="text-blue-400">Livraison estimée : {RESTAURANT_INFO.deliveryTime} min</span>
          </div>
        ) : (
          <div className="mb-4 rounded-2xl border border-[#C9A96E]/30 bg-[#C9A96E]/10 p-3 flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-[#C9A96E]" />
            <span className="text-[#C9A96E]">Prêt à emporter dans : {RESTAURANT_INFO.prepTime} min</span>
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
                                {variant.plats && variant.plats.map((plat, idx) => {
                                  const protein = Array.isArray(variant.proteins)
                                    ? variant.proteins[idx]
                                    : variant.proteins?.[plat];
                                  return (
                                    <div key={idx}>• {plat}{protein && ` (${protein})`}</div>
                                  );
                                })}
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
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={emailRequired
              ? "Email * (pour la confirmation)"
              : "Email (recommandé pour recevoir la confirmation)"}
            className={`rounded-xl border ${
              form.email && !emailFormatOk
                ? 'border-red-500/50'
                : 'border-white/20'
            } bg-transparent px-3 py-2 outline-none focus:border-white/40 transition-colors`}
            value={form.email}
            onChange={handleChange}
          />
          {form.email && !emailFormatOk && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Format email invalide</span>
            </div>
          )}
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
                placeholder="Rue et numéro *"
                autoComplete="street-address"
                className="rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white/40 transition-colors"
                value={form.address}
                onChange={handleChange}
              />
              <input
                name="npa"
                placeholder="Code postal (NPA) *"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                autoComplete="postal-code"
                list="kk-npa-list"
                className={`rounded-xl border ${
                  npaOutOfZone
                    ? 'border-red-500/50'
                    : zoneInfo
                      ? 'border-green-500/40'
                      : 'border-white/20'
                } bg-transparent px-3 py-2 outline-none focus:border-white/40 transition-colors`}
                value={deliveryNpa}
                onChange={handleNpaChange}
              />
              {/* Datalist : autocomplete natif. Affiche "1205 — Plainpalais (Zone 1)" */}
              <datalist id="kk-npa-list">
                {getAllNpas().map((n) => {
                  const z = NPA_TO_ZONE[n];
                  const zoneNumber = z.zone === 'ZONE_1' ? 1 : z.zone === 'ZONE_2' ? 2 : 3;
                  return (
                    <option key={n} value={n}>{`${n} — ${z.label} (Zone ${zoneNumber})`}</option>
                  );
                })}
              </datalist>

              {zoneInfo && (
                <div className="flex items-start gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/30 rounded-xl p-2">
                  <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    {zoneInfo.label} · {zoneInfo.name} · Livraison {format(zoneInfo.fee)}
                  </span>
                </div>
              )}
              {npaOutOfZone && (
                <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div>Hors zone de livraison.</div>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onShowZones}
                        className="underline hover:text-red-300"
                      >
                        Voir les zones desservies
                      </button>
                      <span className="opacity-60">·</span>
                      <button
                        type="button"
                        onClick={() => setMode('pickup')}
                        className="underline hover:text-red-300"
                      >
                        Passer en À emporter
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-white/50">
              Note pour la cuisine
            </label>
            <textarea
              name="noteKitchen"
              placeholder="Allergies, cuisson, modifs… (ex : pas de sauce soja, allergique aux fruits à coque)"
              maxLength={500}
              rows={3}
              className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white/40 transition-colors resize-none"
              value={form.noteKitchen}
              onChange={handleChange}
            />
          </div>

          {mode === "delivery" && (
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-white/50">
                Note pour le livreur
              </label>
              <textarea
                name="noteDelivery"
                placeholder="Digicode, étage, instructions d'accès… (ex : code 1234B, 3e étage porte gauche)"
                maxLength={200}
                rows={2}
                className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white/40 transition-colors resize-none"
                value={form.noteDelivery}
                onChange={handleChange}
              />
            </div>
          )}
        </div>

        {/* Choix du mode de paiement */}
        <div className="mt-6">
          <p className="mb-2 text-sm text-white/60">Mode de paiement</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={`flex-1 rounded-2xl border px-3 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                paymentMethod === "card"
                  ? "border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E]"
                  : "border-white/20 hover:bg-white/10"
              }`}
            >
              💳 Carte
            </button>
            {/* TODO réactiver Twint (intégration Stripe ou TWINT Business).
                Le backend gère encore payment_method='twint' pour les
                anciennes commandes en DB — voir useOrders.js / orderHelpers.js. */}
            {false && (
              <button
                type="button"
                onClick={() => setPaymentMethod("twint")}
                className={`flex-1 rounded-2xl border px-3 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  paymentMethod === "twint"
                    ? "border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E]"
                    : "border-white/20 hover:bg-white/10"
                }`}
              >
                📱 Twint
              </button>
            )}
            {mode === "pickup" && (
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`flex-1 rounded-2xl border px-3 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  paymentMethod === "cash"
                    ? "border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E]"
                    : "border-white/20 hover:bg-white/10"
                }`}
              >
                💵 Cash
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-2 rounded-2xl border border-white/10 p-4">
          <Line label="Sous-total" value={format(subtotal)} />
          {discount > 0 && (
            <Line label="Réduction site (-10%)" value={`- ${format(discount)}`} />
          )}
          {mode === "delivery" && <Line label="Frais de livraison" value={format(deliveryFee)} />}
          <Line label="Total" value={format(total)} bold />
        </div>

        {orderError && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {orderError}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={onClear}
            className="rounded-2xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10 transition-all"
          >
            Vider le panier
          </button>
          <button
            disabled={!canSubmit || submitting}
            onClick={async () => {
              setSubmitting(true);
              setOrderError(null);
              const err = await onSuccess({ form, paymentMethod });
              if (err) setOrderError(err);
              setSubmitting(false);
            }}
            className={`rounded-2xl px-5 py-2 transition-all font-medium ${
              canSubmit && !submitting
                ? "bg-white text-black hover:bg-white/90"
                : "border border-white/20 text-white/50 cursor-not-allowed"
            }`}
          >
            {submitting ? "Envoi…" : "Commander"}
          </button>
        </div>
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
