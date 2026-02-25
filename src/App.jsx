// src/App.jsx - VERSION AVEC TOUS LES MODALS DE VARIANTES
import React, { useMemo, useState, useEffect } from "react";
import { ShoppingCart, Minus, Plus, X, MapPin, Bike, Percent, Check, Phone, Instagram, Facebook, Clock, Info, AlertCircle } from "lucide-react";

// MODIFICATION 1: Logo PNG au lieu du SVG
const LOGO_SRC = "/logo_kaikai.png";

// Style global pour empêcher le scroll horizontal
const globalStyles = `
  html, body {
    overflow-x: hidden;
    max-width: 100vw;
  }
  * {
    box-sizing: border-box;
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
  { id: "2",  name: "Salade d'avocat", desc: "Salade, tomate, patate, concombre, guacamole maison, cacahuètes", price: 7.90, category: "entrees" },
  { id: "3",  name: "Salade de poulet", desc: "Salade, tomate, patate, concombre, poulet", price: 9.90, category: "entrees" },
  { 
    id: "4",  
    name: "Tartare de thon rouge", 
    desc: "Mariné au citron vert et gingembre (4 variantes: Tahitien, Haka, Mokaï, KaïKaï)", 
    price: 12.90, 
    category: "entrees",
    hasVariants: true,
    variants: [
      { id: "tahitien", name: "Tahitien", desc: "Sauce coco" },
      { id: "haka", name: "Haka", desc: "Sauce piment maison" },
      { id: "mokai", name: "Mokaï", desc: "Sauce arachide et guacamole" },
      { id: "kaikai", name: "KaïKaï", desc: "Sauce sésame, mangue et ananas" }
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
      { id: "porc", name: "Porc", desc: "Wok de porc" },
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
      { id: "porc", name: "Porc", desc: "Wok de porc" },
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
  { id: "9",  name: "Tahitien", desc: "Thon rouge mariné au citron vert et gingembre, tomate, concombre, sauce coco", price: 22.90, category: "froid" },
  { id: "10", name: "KaïKaï", desc: "Thon rouge mariné au citron vert et gingembre, tomate, concombre, sauce sésame, mangue et ananas", price: 22.90, category: "froid" },
  { id: "11", name: "Haka", desc: "Thon rouge mariné au citron vert et gingembre, tomate, concombre, sauce piment maison", price: 22.90, category: "froid" },
  { id: "12", name: "Mokaï", desc: "Thon rouge mariné au citron vert et gingembre, tomate, concombre, sauce arachide et guacamole maison", price: 24.90, category: "froid" },

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
    desc: "Pomme/kiwi, fraise/framboise, ananas/citron/gingembre, coktail ACE", 
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
  const IMAGES = [
    { src: "/hero-tartare.jpg", alt: "Tartare de thon" },
    { src: "/hero-wok-poulet.jpg", alt: "Wok poulet / nouilles" },
    { src: "/hero-boeuf.jpg", alt: "Wok de bœuf et riz" },
  ];
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % IMAGES.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative">
      <div className="relative max-h-96 rounded-3xl overflow-hidden border border-white/10">
        {IMAGES.map((img, i) => (
          <img
            key={img.src}
            src={img.src}
            alt={img.alt}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === idx ? "opacity-100" : "opacity-0"}`}
            draggable={false}
          />
        ))}
        <img src={IMAGES[0].src} alt="" className="opacity-0 w-full h-full object-cover select-none" />
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
        <button
          onClick={() => setIdx(i => (i - 1 + IMAGES.length) % IMAGES.length)}
          className="pointer-events-auto rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm hover:bg-black/60 transition-colors"
        >
          ◀
        </button>
        <button
          onClick={() => setIdx(i => (i + 1) % IMAGES.length)}
          className="pointer-events-auto rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm hover:bg-black/60 transition-colors"
        >
          ▶
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-2 w-2 rounded-full transition-all ${i === idx ? "bg-white w-8" : "bg-white/30"}`}
            aria-label={`Aller à l'image ${i+1}`}
          />
        ))}
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

export default function KaiKaiApp() {
  const [cart, setCart] = useState({});
  const [cartVariants, setCartVariants] = useState({});
  const [mode, setMode] = useState("delivery");
  const [couponApplied] = useState(true);
  const [step, setStep] = useState("menu");
  const [logoVisible, setLogoVisible] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

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
      // Retirer la dernière variante ajoutée
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

      {/* Menu principal */}
      {step === "menu" && (
        <section className="mx-auto max-w-5xl px-4 py-10">
          <div className="mb-10 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
            <div className="mb-6 text-center">
              <div className="flex flex-wrap items-center justify-center gap-3 mb-3">
                <Badge type="halal" />
                <Badge type="healthy" />
              </div>
              <h2 className="mb-2 text-3xl font-bold">Bienvenue chez KaïKaï</h2>
              <p className="text-white/70">Cuisine tahitienne authentique — Genève</p>
            </div>
            <HeroSlider />
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-white/60">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${RESTAURANT_INFO.coordinates.lat},${RESTAURANT_INFO.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <MapPin className="h-4 w-4" />{RESTAURANT_INFO.address}
              </a>
              <div className="flex items-center gap-2">
                <Bike className="h-4 w-4" />Livraison en {RESTAURANT_INFO.deliveryTime} min
              </div>
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4" />-10% sur votre commande
              </div>
            </div>
          </div>

          {/* Grille de plats */}
          <div className="grid gap-6 sm:grid-cols-2">
            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🥗 Entrées</h3>
            {SEC_ENTREES.map(item => (
              <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove}
                photo={ENTREE_PHOTOS[item.id]} photoPos={ENTREE_PHOTO_POS[item.id]} />
            ))}

            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🔥 Plat Chaud</h3>
            {SEC_CHAUD.map(item => (
              <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove}
                photo={CHAUD_PHOTOS[item.id]} photoPos={CHAUD_PHOTO_POS[item.id]} />
            ))}

            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">❄️ Plat Froid</h3>
            {SEC_FROID.map(item => (
              <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove} />
            ))}

            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🎁 Formules</h3>
            {SEC_FORMULES.map(item => (
              <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove} isFormula />
            ))}

            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🍰 Desserts</h3>
            {SEC_DESSERT.map(item => (
              <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove} />
            ))}

            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🧉 Boissons</h3>
            {SEC_BOISSON.map(item => (
              <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove} />
            ))}
          </div>

          <div className="mt-8 text-center text-sm text-white/50 italic">
            Tous nos plats sont accompagnés de riz et de salade
          </div>
        </section>
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
function MenuItem({ item, cart, add, remove, isFormula = false, photo = null, photoPos = "center" }) {
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
          <div className="w-full h-48 overflow-hidden">
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
      
      {/* Modal variantes tartare */}
      {showVariants && item.hasVariants && (
        <VariantModal 
          item={item} 
          onSelect={handleAdd} 
          onClose={() => setShowVariants(false)} 
        />
      )}
      
      {/* Modal jus exotiques */}
      {showJus && item.hasJusVariants && (
        <JusModal 
          item={item} 
          onSelect={handleAdd} 
          onClose={() => setShowJus(false)} 
        />
      )}
      
      {/* Modal formules */}
      {showFormuleModal && item.hasFormule && (
        <FormuleModal 
          item={item} 
          onConfirm={handleFormuleConfirm} 
          onClose={() => setShowFormuleModal(false)} 
        />
      )}
      
      {/* NOUVEAU: Modal protéines (Chao Men / Kai Fan) */}
      {showProteinModal && item.hasProteinVariants && (
        <ProteinModal 
          item={item} 
          onSelect={handleAdd} 
          onClose={() => setShowProteinModal(false)} 
        />
      )}
      
      {/* NOUVEAU: Modal coulis (Cheesecake) */}
      {showCoulisModal && item.hasCoulisVariants && (
        <CoulisModal 
          item={item} 
          onSelect={handleAdd} 
          onClose={() => setShowCoulisModal(false)} 
        />
      )}
      
      {/* NOUVEAU: Modal eau (Eau plate/gazeuse) */}
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

// Modal de sélection de variante tartare
function VariantModal({ item, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-black border border-white/20 rounded-3xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Choisir une variante</h3>
          <button onClick={onClose} className="rounded-xl border border-white/20 p-2 hover:bg-white/10 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-white/60 mb-4">{item.name}</p>
        <div className="space-y-3">
          {item.variants.map(variant => (
            <button
              key={variant.id}
              onClick={() => onSelect(variant)}
              className="w-full text-left rounded-2xl border border-white/10 p-4 hover:border-white/30 hover:bg-white/5 transition-all"
            >
              <div className="font-medium">{variant.name}</div>
              <div className="text-sm text-white/60 mt-1">{variant.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Modal de sélection de jus
function JusModal({ item, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-black border border-white/20 rounded-3xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Choisir votre jus exotique</h3>
          <button onClick={onClose} className="rounded-xl border border-white/20 p-2 hover:bg-white/10 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-white/60 mb-4">Jus exotiques maison</p>
        <div className="space-y-3">
          {item.jusVariants.map(jus => (
            <button
              key={jus.id}
              onClick={() => onSelect(jus)}
              className="w-full text-left rounded-2xl border border-white/10 p-4 hover:border-white/30 hover:bg-white/5 transition-all"
            >
              <div className="font-medium">{jus.name}</div>
              <div className="text-sm text-white/60 mt-1">{jus.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// NOUVEAU: Modal de sélection de protéine (Porc/Poulet)
function ProteinModal({ item, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-black border border-white/20 rounded-3xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Choisir votre viande</h3>
          <button onClick={onClose} className="rounded-xl border border-white/20 p-2 hover:bg-white/10 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-white/60 mb-4">{item.name}</p>
        <div className="space-y-3">
          {item.proteinVariants.map(protein => (
            <button
              key={protein.id}
              onClick={() => onSelect(protein)}
              className="w-full text-left rounded-2xl border border-white/10 p-4 hover:border-white/30 hover:bg-white/5 transition-all"
            >
              <div className="font-medium">{protein.id === 'veggie' ? '🥦' : ''} {protein.name}</div>
              <div className="text-sm text-white/60 mt-1">{protein.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// NOUVEAU: Modal de sélection de coulis (Cheesecake)
function CoulisModal({ item, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-black border border-white/20 rounded-3xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Choisir votre coulis</h3>
          <button onClick={onClose} className="rounded-xl border border-white/20 p-2 hover:bg-white/10 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-white/60 mb-4">{item.name}</p>
        <div className="space-y-3">
          {item.coulisVariants.map(coulis => (
            <button
              key={coulis.id}
              onClick={() => onSelect(coulis)}
              className="w-full text-left rounded-2xl border border-white/10 p-4 hover:border-white/30 hover:bg-white/5 transition-all"
            >
              <div className="font-medium">{coulis.id === 'mangue' ? '🥭' : '🍓'} {coulis.name}</div>
              <div className="text-sm text-white/60 mt-1">{coulis.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// NOUVEAU: Modal de sélection d'eau (Plate/Gazeuse)
function EauModal({ item, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-black border border-white/20 rounded-3xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Choisir votre eau</h3>
          <button onClick={onClose} className="rounded-xl border border-white/20 p-2 hover:bg-white/10 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-white/60 mb-4">{item.name}</p>
        <div className="space-y-3">
          {item.eauVariants.map(eau => (
            <button
              key={eau.id}
              onClick={() => onSelect(eau)}
              className="w-full text-left rounded-2xl border border-white/10 p-4 hover:border-white/30 hover:bg-white/5 transition-all"
            >
              <div className="font-medium">{eau.name}</div>
              <div className="text-sm text-white/60 mt-1">{eau.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Modal de sélection formules COMPLET
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
  
  // NOUVEAU: States pour gérer les variantes de protéine dans les formules
  const [showProteinSelector, setShowProteinSelector] = useState(false);
  const [proteinForPlat, setProteinForPlat] = useState(null); // Quel plat nécessite une protéine
  const [selectedProteins, setSelectedProteins] = useState({}); // {platName: proteinName}
  const [isMultiPlat, setIsMultiPlat] = useState(false); // Pour distinguer Découverte vs Voyage
  
  // NOUVEAU: States pour gérer le choix d'eau dans les formules
  const [showEauSelector, setShowEauSelector] = useState(false);
  const [selectedEauDecouverte, setSelectedEauDecouverte] = useState(null);
  const [selectedEauVoyage, setSelectedEauVoyage] = useState([]);
  const [eauIndex, setEauIndex] = useState(0);
  
  // NOUVEAU: States pour gérer le choix de coulis de dessert dans les formules
  const [showCoulisSelector, setShowCoulisSelector] = useState(false);
  const [selectedCoulisDessert, setSelectedCoulisDessert] = useState(null);
  
  // Bloquer le scroll de la page quand le modal est ouvert
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  
  // Bloquer aussi le scroll du modal parent quand les sous-modals sont ouverts
  useEffect(() => {
    const modalElement = document.querySelector('.formule-modal-content');
    if (showJusSelector || showProteinSelector || showEauSelector || showCoulisSelector) {
      document.body.style.overflow = 'hidden';
      if (modalElement) {
        modalElement.style.overflow = 'hidden';
      }
    } else {
      if (modalElement) {
        modalElement.style.overflow = 'auto';
      }
    }
  }, [showJusSelector, showProteinSelector, showEauSelector, showCoulisSelector]);
  
  const jusOptions = [
    { id: 'pomme-kiwi', name: '🍏 Pomme/Kiwi' },
    { id: 'fraise-framboise', name: '🍓 Fraise/Framboise' },
    { id: 'ananas-citron', name: '🍍 Ananas/Citron/Gingembre' },
    { id: 'ace', name: '🍊 Cocktail ACE' }
  ];
  
  const proteinOptions = [
    { id: 'porc', name: 'Porc', icon: '🥩' },
    { id: 'poulet', name: 'Poulet', icon: '🥩' },
    { id: 'porc-poulet', name: 'Porc + Poulet', icon: '🥩' },
    { id: 'veggie', name: 'Veggie', icon: '🥬' }
  ];
  
  // NOUVEAU: Fonction pour obtenir les options de protéine selon le plat
  const getProteinOptionsForPlat = (platName) => {
    if (platName === 'Omelette Fu Young') {
      return [
        { id: 'veggie', name: 'Veggie' },
        { id: 'poulet', name: 'Poulet' }
      ];
    }
    // Pour Chao Men et Kai Fan
    return [
      { id: 'porc', name: 'Porc' },
      { id: 'poulet', name: 'Poulet' },
      { id: 'porc-poulet', name: 'Porc + Poulet' },
      { id: 'veggie', name: 'Veggie' }
    ];
  };
  
  const eauOptions = [
    { id: 'plate', name: '💧 Eau Plate' },
    { id: 'gazeuse', name: '🫧 Eau Gazeuse' }
  ];
  
  const needsProteinChoice = (platName) => {
    return platName === 'Chao Men' || platName === 'Kai Fan' || platName === 'Omelette Fu Young';
  };
  
  const handleProteinSelection = (proteinName) => {
    setSelectedProteins(prev => ({ ...prev, [proteinForPlat]: proteinName }));
    setShowProteinSelector(false);
    setProteinForPlat(null);
  };
  
  const handleEauSelection = (eauName) => {
    if (item.formuleType === "decouverte") {
      setSelectedEauDecouverte(eauName);
    } else {
      const newEau = [...selectedEauVoyage];
      newEau[eauIndex] = eauName;
      setSelectedEauVoyage(newEau);
    }
    setShowEauSelector(false);
  };
  
  const needsCoulisChoice = (dessertName) => {
    return dessertName === 'Crème Tropicale' || dessertName === 'Cheesecake';
  };
  
  const handleCoulisSelection = (coulisName) => {
    setSelectedCoulisDessert(coulisName);
    setShowCoulisSelector(false);
  };
  
  const handlePlatCheckbox = (plat) => {
    if (selectedPlats.includes(plat)) {
      // Si on décoche, retirer aussi la protéine associée
      setSelectedPlats(selectedPlats.filter(p => p !== plat));
      setSelectedProteins(prev => {
        const newProteins = { ...prev };
        delete newProteins[plat];
        return newProteins;
      });
    } else {
      if (selectedPlats.length < 2) {
        // Si le plat nécessite un choix de protéine, ouvrir le modal
        if (needsProteinChoice(plat)) {
          setProteinForPlat(plat);
          setIsMultiPlat(true);
          setShowProteinSelector(true);
        }
        setSelectedPlats([...selectedPlats, plat]);
      }
    }
  };
  
  const handleBoissonCheckbox = (boisson) => {
    const currentJusCount = selectedBoissons.filter(b => b === 'Jus exotique').length;
    const currentEauCount = selectedBoissons.filter(b => b === 'Eau').length;
    
    // Gérer Jus exotique
    if (boisson === 'Jus exotique') {
      if (currentJusCount === 0 && selectedBoissons.length < 2) {
        // Ajouter le premier jus
        setSelectedBoissons([...selectedBoissons, boisson]);
        setJusIndex(0);
        setShowJusSelector(true);
      } else if (currentJusCount === 1 && selectedBoissons.length < 2) {
        // Ajouter le deuxième jus
        setSelectedBoissons([...selectedBoissons, boisson]);
        setJusIndex(1);
        setShowJusSelector(true);
      } else if (currentJusCount === 1) {
        // Retirer le seul jus (pas de limite de 2 boissons atteinte)
        const newBoissons = selectedBoissons.filter(b => b !== 'Jus exotique');
        setSelectedBoissons(newBoissons);
        setSelectedJusVoyage([]);
      } else if (currentJusCount === 2) {
        // Retirer un jus (on en a 2)
        const newBoissons = [...selectedBoissons];
        const index = newBoissons.lastIndexOf('Jus exotique');
        newBoissons.splice(index, 1);
        setSelectedBoissons(newBoissons);
        const newJus = [...selectedJusVoyage];
        newJus.pop();
        setSelectedJusVoyage(newJus);
      }
    } 
    // Gérer Eau
    else if (boisson === 'Eau') {
      if (currentEauCount === 0 && selectedBoissons.length < 2) {
        // Ajouter la première eau
        setSelectedBoissons([...selectedBoissons, boisson]);
        setEauIndex(0);
        setShowEauSelector(true);
      } else if (currentEauCount === 1 && selectedBoissons.length < 2) {
        // Ajouter la deuxième eau
        setSelectedBoissons([...selectedBoissons, boisson]);
        setEauIndex(1);
        setShowEauSelector(true);
      } else if (currentEauCount === 1) {
        // Retirer la seule eau
        const newBoissons = selectedBoissons.filter(b => b !== 'Eau');
        setSelectedBoissons(newBoissons);
        setSelectedEauVoyage([]);
      } else if (currentEauCount === 2) {
        // Retirer une eau (on en a 2)
        const newBoissons = [...selectedBoissons];
        const index = newBoissons.lastIndexOf('Eau');
        newBoissons.splice(index, 1);
        setSelectedBoissons(newBoissons);
        const newEau = [...selectedEauVoyage];
        newEau.pop();
        setSelectedEauVoyage(newEau);
      }
    } 
    // Gérer les autres boissons (si jamais il y en a)
    else {
      if (selectedBoissons.includes(boisson)) {
        setSelectedBoissons(selectedBoissons.filter(b => b !== boisson));
      } else if (selectedBoissons.length < 2) {
        setSelectedBoissons([...selectedBoissons, boisson]);
      }
    }
  };
  
  const handleJusSelection = (jus) => {
    if (item.formuleType === "decouverte") {
      setSelectedJusDecouverte(jus);
    } else {
      const newJus = [...selectedJusVoyage];
      newJus[jusIndex] = jus;
      setSelectedJusVoyage(newJus);
    }
    setShowJusSelector(false);
  };
  
  const handleConfirm = () => {
    if (item.formuleType === "decouverte") {
      if (!selectedPlat || !selectedBoisson) {
        alert('Veuillez sélectionner un plat et une boisson');
        return;
      }
      if (needsProteinChoice(selectedPlat) && !selectedProteins[selectedPlat]) {
        alert('Veuillez choisir votre viande/option pour ' + selectedPlat);
        return;
      }
      if (selectedBoisson === 'Jus exotique' && !selectedJusDecouverte) {
        alert('Veuillez choisir votre jus exotique');
        return;
      }
      if (selectedBoisson === 'Eau' && !selectedEauDecouverte) {
        alert('Veuillez choisir votre type d\'eau');
        return;
      }
    } else if (item.formuleType === "voyage") {
      if (selectedPlats.length !== 2) {
        alert('Veuillez sélectionner exactement 2 plats');
        return;
      }
      // Vérifier que tous les plats qui nécessitent une protéine en ont une
      for (const plat of selectedPlats) {
        if (needsProteinChoice(plat) && !selectedProteins[plat]) {
          alert('Veuillez choisir votre viande/option pour ' + plat);
          return;
        }
      }
      if (selectedBoissons.length === 0 || selectedBoissons.length > 2) {
        alert('Veuillez sélectionner 1 ou 2 boissons');
        return;
      }
      if (!selectedDessert) {
        alert('Veuillez sélectionner un dessert');
        return;
      }
      // Vérifier que le dessert qui nécessite un coulis en a un
      if (needsCoulisChoice(selectedDessert) && !selectedCoulisDessert) {
        alert('Veuillez choisir votre coulis pour ' + selectedDessert);
        return;
      }
      const nbJus = selectedBoissons.filter(b => b === 'Jus exotique').length;
      if (selectedJusVoyage.length < nbJus) {
        alert('Veuillez choisir vos jus exotiques');
        return;
      }
      const nbEau = selectedBoissons.filter(b => b === 'Eau').length;
      if (selectedEauVoyage.length < nbEau) {
        alert('Veuillez choisir vos types d\'eau');
        return;
      }
    }
    
    // Créer un objet avec tous les détails de la formule
    const formuleDetails = {
      type: item.formuleType,
      plat: selectedPlat,
      plats: selectedPlats,
      proteins: selectedProteins,
      boisson: selectedBoisson,
      boissons: selectedBoissons,
      jus: item.formuleType === "decouverte" ? selectedJusDecouverte : selectedJusVoyage,
      eau: item.formuleType === "decouverte" ? selectedEauDecouverte : selectedEauVoyage,
      dessert: selectedDessert,
      coulisDessert: selectedCoulisDessert
    };
    
    onConfirm(formuleDetails);
  };
  
  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="min-h-screen flex items-center justify-center py-8">
          <div className="formule-modal-content bg-black border border-white/20 rounded-3xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{item.name}</h3>
              <button onClick={onClose} className="rounded-xl border border-white/20 p-2 hover:bg-white/10 transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-white/60 mb-6">{item.desc}</p>
        
        {item.formuleType === "decouverte" && (
          <div className="space-y-6">
            {/* Choix du Plat */}
            <div>
              <h4 className="text-lg font-medium mb-3">1. Choisissez votre plat :</h4>
              <div className="space-y-2">
                {['Chao Men', 'Kai Fan', 'Omelette Fu Young', 'Tahitien', 'KaïKaï', 'Haka'].map(plat => (
                  <label key={plat} className="flex items-center gap-3 rounded-2xl border border-white/10 p-3 hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer">
                    <input 
                      type="radio" 
                      name="formule-decouverte-plat" 
                      checked={selectedPlat === plat}
                      onClick={() => {
                        // Permettre la désélection en cliquant à nouveau
                        if (selectedPlat === plat) {
                          setSelectedPlat(null);
                          // Retirer aussi la protéine associée
                          setSelectedProteins(prev => {
                            const newProteins = { ...prev };
                            delete newProteins[plat];
                            return newProteins;
                          });
                        } else {
                          setSelectedPlat(plat);
                          // Si c'est Chao Men, Kai Fan ou Omelette Fu Young, ouvrir le sélecteur de protéine
                          if (needsProteinChoice(plat)) {
                            setProteinForPlat(plat);
                            setIsMultiPlat(false);
                            setShowProteinSelector(true);
                          }
                        }
                      }}
                      onChange={() => {}} // Nécessaire pour éviter les warnings React
                      className="w-4 h-4" 
                    />
                    <div className="flex-1">
                      <div className="font-medium">{plat}</div>
                      <div className="text-sm text-white/60">
                        {plat === 'Chao Men' && (selectedProteins[plat] ? `Nouilles sautées - ${selectedProteins[plat]}` : 'Nouilles sautées')}
                        {plat === 'Kai Fan' && (selectedProteins[plat] ? `Riz sauté - ${selectedProteins[plat]}` : 'Riz sauté')}
                        {plat === 'Omelette Fu Young' && (selectedProteins[plat] ? `Omelette aux légumes - ${selectedProteins[plat]}` : 'Omelette aux légumes')}
                        {plat === 'Tahitien' && 'Thon rouge, sauce coco'}
                        {plat === 'KaïKaï' && 'Thon rouge, sauce sésame'}
                        {plat === 'Haka' && 'Thon rouge, sauce piment'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Choix de la Boisson */}
            <div>
              <h4 className="text-lg font-medium mb-3">2. Choisissez votre boisson :</h4>
              <div className="space-y-2">
                {['Jus exotique', 'Eau'].map(boisson => (
                  <label key={boisson} className="flex items-center gap-3 rounded-2xl border border-white/10 p-3 hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer">
                    <input 
                      type="radio" 
                      name="formule-decouverte-boisson" 
                      checked={selectedBoisson === boisson}
                      onClick={() => {
                        // Permettre la désélection en cliquant à nouveau
                        if (selectedBoisson === boisson) {
                          setSelectedBoisson(null);
                          if (boisson === 'Jus exotique') {
                            setSelectedJusDecouverte(null);
                          } else if (boisson === 'Eau') {
                            setSelectedEauDecouverte(null);
                          }
                        } else {
                          setSelectedBoisson(boisson);
                          if (boisson === 'Jus exotique') {
                            setShowJusSelector(true);
                          } else if (boisson === 'Eau') {
                            setShowEauSelector(true);
                          }
                        }
                      }}
                      onChange={() => {}} // Nécessaire pour éviter les warnings React
                      className="w-4 h-4" 
                    />
                    <div className="flex-1">
                      <div className="font-medium">{boisson}</div>
                      <div className="text-sm text-white/60">
                        {boisson === 'Jus exotique' ? (selectedJusDecouverte || 'Au choix') : (selectedEauDecouverte || 'Plate ou gazeuse')}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {item.formuleType === "voyage" && (
          <div className="space-y-6">
            {/* Choix des 2 Plats */}
            <div>
              <h4 className="text-lg font-medium mb-3">1. Choisissez vos 2 plats :</h4>
              <div className="space-y-2">
                {['Chao Men', 'Kai Fan', 'Omelette Fu Young', 'Wok de Bœuf', 'Tahitien', 'KaïKaï', 'Haka'].map(plat => (
                  <label key={plat} className="flex items-center gap-3 rounded-2xl border border-white/10 p-3 hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedPlats.includes(plat)}
                      onChange={() => handlePlatCheckbox(plat)}
                      className="w-4 h-4" 
                    />
                    <div className="flex-1">
                      <div className="font-medium">{plat}</div>
                      <div className="text-sm text-white/60">
                        {plat === 'Chao Men' && (selectedProteins[plat] ? `Nouilles sautées - ${selectedProteins[plat]}` : 'Nouilles sautées')}
                        {plat === 'Kai Fan' && (selectedProteins[plat] ? `Riz sauté - ${selectedProteins[plat]}` : 'Riz sauté')}
                        {plat === 'Omelette Fu Young' && (selectedProteins[plat] ? `Omelette aux légumes - ${selectedProteins[plat]}` : 'Omelette aux légumes')}
                        {plat === 'Wok de Bœuf' && 'Wok de bœuf, sauce sésame'}
                        {plat === 'Tahitien' && 'Thon rouge, sauce coco'}
                        {plat === 'KaïKaï' && 'Thon rouge, sauce sésame'}
                        {plat === 'Haka' && 'Thon rouge, sauce piment'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-white/50 mt-2">Sélectionnez exactement 2 plats</p>
            </div>

            {/* Choix des 2 Boissons */}
            <div>
              <h4 className="text-lg font-medium mb-3">2. Choisissez vos 2 boissons :</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 p-3 hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedBoissons.filter(b => b === 'Jus exotique').length > 0}
                    onChange={() => handleBoissonCheckbox('Jus exotique')}
                    className="w-4 h-4" 
                  />
                  <div className="flex-1">
                    <div className="font-medium">Jus exotique {selectedBoissons.filter(b => b === 'Jus exotique').length > 0 && `(${selectedBoissons.filter(b => b === 'Jus exotique').length})`}</div>
                    <div className="text-sm text-white/60">
                      {selectedJusVoyage.length > 0 ? selectedJusVoyage.join(', ') : 'Au choix - Cliquez plusieurs fois pour 2 jus'}
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 p-3 hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedBoissons.filter(b => b === 'Eau').length > 0}
                    onChange={() => handleBoissonCheckbox('Eau')}
                    className="w-4 h-4" 
                  />
                  <div className="flex-1">
                    <div className="font-medium">Eau {selectedBoissons.filter(b => b === 'Eau').length > 0 && `(${selectedBoissons.filter(b => b === 'Eau').length})`}</div>
                    <div className="text-sm text-white/60">
                      {selectedEauVoyage.length > 0 ? selectedEauVoyage.join(', ') : 'Plate ou gazeuse - Cliquez plusieurs fois pour 2 eaux'}
                    </div>
                  </div>
                </label>
              </div>
              <p className="text-xs text-white/50 mt-2">Sélectionnez jusqu'à 2 boissons (cliquez 2x sur jus pour 2 jus ou 2x sur eau pour 2 eaux)</p>
            </div>

            {/* Choix du Dessert */}
            <div>
              <h4 className="text-lg font-medium mb-3">3. Choisissez votre dessert :</h4>
              <div className="space-y-2">
                {['Coulant au chocolat', 'Crème Tropicale', 'Po\'e Banane', 'Cheesecake'].map(dessert => (
                  <label key={dessert} className="flex items-center gap-3 rounded-2xl border border-white/10 p-3 hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer">
                    <input 
                      type="radio" 
                      checked={selectedDessert === dessert}
                      onClick={() => {
                        // Permettre la désélection en cliquant à nouveau
                        if (selectedDessert === dessert) {
                          setSelectedDessert(null);
                          setSelectedCoulisDessert(null);
                        } else {
                          setSelectedDessert(dessert);
                          // Si c'est Crème Tropicale ou Cheesecake, ouvrir le sélecteur de coulis
                          if (needsCoulisChoice(dessert)) {
                            setShowCoulisSelector(true);
                          }
                        }
                      }}
                      onChange={() => {}} // Nécessaire pour éviter les warnings React
                      className="w-4 h-4" 
                    />
                    <div className="flex-1">
                      <div className="font-medium">{dessert}</div>
                      <div className="text-sm text-white/60">
                        {dessert === 'Coulant au chocolat' && 'Gâteau fondant'}
                        {dessert === 'Crème Tropicale' && (selectedCoulisDessert && selectedDessert === 'Crème Tropicale' ? selectedCoulisDessert : 'Coulis au choix')}
                        {dessert === 'Cheesecake' && (selectedCoulisDessert && selectedDessert === 'Cheesecake' ? selectedCoulisDessert : 'Coulis au choix')}
                        {dessert === 'Po\'e Banane' && 'Dessert tahitien à la banane'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleConfirm}
          className="mt-6 w-full rounded-2xl bg-white text-black px-4 py-3 font-medium hover:bg-white/90 transition-all"
        >
          Ajouter au panier - {format(item.price)}
        </button>
      </div>
    </div>
    </div>
    
    {/* Sous-modals rendus en dehors du conteneur principal */}
    {showJusSelector && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowJusSelector(false)} style={{ position: 'fixed' }}>
        <div className="bg-black border border-white/20 rounded-3xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Choisir votre jus</h3>
            <button onClick={() => setShowJusSelector(false)} className="rounded-xl border border-white/20 p-2 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {jusOptions.map(jus => (
              <button
                key={jus.id}
                onClick={() => handleJusSelection(jus.name)}
                className="w-full text-left rounded-2xl border border-white/10 p-4 hover:border-white/30 hover:bg-white/5 transition-all"
              >
                <div className="font-medium">{jus.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )}
    
    {showProteinSelector && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowProteinSelector(false)} style={{ position: 'fixed' }}>
        <div className="bg-black border border-white/20 rounded-3xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Choisir votre option</h3>
            <button onClick={() => setShowProteinSelector(false)} className="rounded-xl border border-white/20 p-2 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-white/60 mb-4">{proteinForPlat}</p>
          <div className="space-y-3">
            {getProteinOptionsForPlat(proteinForPlat).map(protein => (
              <button
                key={protein.id}
                onClick={() => handleProteinSelection(protein.name)}
                className="w-full text-left rounded-2xl border border-white/10 p-4 hover:border-white/30 hover:bg-white/5 transition-all"
              >
                <div className="font-medium">{protein.id === 'veggie' ? '🥦' : ''} {protein.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )}
    
    {showEauSelector && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowEauSelector(false)} style={{ position: 'fixed' }}>
        <div className="bg-black border border-white/20 rounded-3xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Choisir votre eau</h3>
            <button onClick={() => setShowEauSelector(false)} className="rounded-xl border border-white/20 p-2 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {eauOptions.map(eau => (
              <button
                key={eau.id}
                onClick={() => handleEauSelection(eau.name)}
                className="w-full text-left rounded-2xl border border-white/10 p-4 hover:border-white/30 hover:bg-white/5 transition-all"
              >
                <div className="font-medium">{eau.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )}
    
    {showCoulisSelector && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowCoulisSelector(false)} style={{ position: 'fixed' }}>
        <div className="bg-black border border-white/20 rounded-3xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Choisir votre coulis</h3>
            <button onClick={() => setShowCoulisSelector(false)} className="rounded-xl border border-white/20 p-2 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-white/60 mb-4">{selectedDessert}</p>
          <div className="space-y-3">
            {[
              { id: 'mangue', name: 'Coulis Mangue', desc: 'Doux et tropical', emoji: '🥭' },
              { id: 'fruits-rouges', name: 'Coulis Fruits Rouges', desc: 'Frais et acidulé', emoji: '🍓' }
            ].map(coulis => (
              <button
                key={coulis.id}
                onClick={() => handleCoulisSelection(coulis.name)}
                className="w-full text-left rounded-2xl border border-white/10 p-4 hover:border-white/30 hover:bg-white/5 transition-all"
              >
                <div className="font-medium">{coulis.emoji} {coulis.name}</div>
                <div className="text-sm text-white/60 mt-1">{coulis.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
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

function Checkout({ items, cartVariants, subtotal, discount, deliveryFee, total, mode, setMode, onClose, onClear, onSuccess }) {
  const [form, setForm] = useState({ 
    firstName: "", 
    lastName: "", 
    phone: "", 
    address: "", 
    postalCode: "",
    instructions: ""
  });
  const [deliveryError, setDeliveryError] = useState("");
  
  const MINIMUM_DELIVERY = 19.90;
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
  
  // Forcer le mode pickup si le montant minimum de livraison n'est pas atteint
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
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{it.name}</div>
                    
                    {/* Affichage des formules - une par une si plusieurs */}
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
                    
                    {/* Affichage simple des variantes non-formule */}
                    {variantsToDisplay.length > 0 && !variantsToDisplay[0]?.type && (
                      <div className="mt-1 space-y-0.5">
                        {variantsToDisplay.map((v, idx) => (
                          <div key={idx} className="text-xs text-white/60">• {v.name}</div>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-sm text-white/60 mt-1">{it.qty} × {format(it.price)}</div>
                  </div>
                  <div className="text-right">{format(it.price * it.qty)}</div>
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
              onClick={() => {
                if (canDelivery) {
                  setMode("delivery");
                }
              }}
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
