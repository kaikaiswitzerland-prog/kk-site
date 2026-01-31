// src/App.jsx - VERSION AMÉLIORÉE
import React, { useMemo, useState, useEffect } from "react";
import { ShoppingCart, Minus, Plus, X, MapPin, Bike, Percent, Check, Phone, Instagram, Facebook, Clock, Info, AlertCircle } from "lucide-react";

// chemin de ton logo placé dans /public
const LOGO_SRC = "/logo.png";

// Informations du restaurant
const RESTAURANT_INFO = {
  name: "Kai Kai",
  address: "Bd de la Tour 1, 1205 Genève",
  phone: "+41765197670",
  phoneDisplay: "+41 76 519 76 70",
  instagram: "https://www.instagram.com/kaikaiswitzerland",
  facebook: "#", // Ajouter le lien Facebook si disponible
  email: "contact@kaikai.ch",
  
  // Horaires (format 24h)
  hours: {
    lunch: { start: "11:30", end: "14:00" },
    dinner: { start: "18:00", end: "22:00" }
  },
  
  // Zones de livraison (codes postaux Genève)
  deliveryZones: ["1200", "1201", "1202", "1203", "1204", "1205", "1206", "1207", "1208", "1209"],
  deliveryTime: "30-45", // minutes
  
  // Coordonnées GPS pour Google Maps
  coordinates: {
    lat: 46.1983,
    lng: 6.1472
  }
};

// --- Menu réel (CHF) - Mis à jour selon le menu officiel
const MENU = [
  // ——— ENTRÉES ———
  { id: "1",  name: "Velouté koko", desc: "Légumes de saison et crème coco", price: 4.90, category: "entrees" },
  { id: "2",  name: "Salade d'avocat", desc: "Salade, tomate, patate, concombre, guacamole maison, cacahuètes", price: 7.90, category: "entrees" },
  { id: "3",  name: "Salade de poulet", desc: "Salade, tomate, patate, concombre, poulet", price: 9.90, category: "entrees" },
  { 
    id: "4",  
    name: "Tartare de thon rouge", 
    desc: "Mariné au citron vert et gingembre avec 4 variantes possible : Tahitien, Haka, Mokaï, Kaikai", 
    price: 12.90, 
    category: "entrees",
    hasVariants: true,
    variants: [
      { id: "tahitien", name: "Tahitien", desc: "Sauce coco" },
      { id: "haka", name: "Haka", desc: "Sauce piment maison" },
      { id: "mokai", name: "Mokaï", desc: "Sauce arachide et guacamole" },
      { id: "kaikai", name: "Kaikai", desc: "Sauce sésame, mangue et ananas" }
    ]
  },

  // ——— PLATS CHAUDS ———
  { id: "5",  name: "Chao Men", desc: "Nouilles sautées, légumes de saison, wok de porc et/ou poulet, sauce crevette et champignons", price: 17.90, category: "chaud" },
  { id: "6",  name: "Kai Fan", desc: "Riz sauté, wok de porc et/ou poulet, sauce crevette et champignons, servi avec sa salade exotique", price: 17.90, category: "chaud" },
  { id: "7",  name: "Omelette Fu Young", desc: "Omelette aux légumes sautés de saison", price: 16.90, category: "chaud" },
  { id: "8",  name: "Wok de Bœuf", desc: "Wok de bœuf, légumes de saison, sauce sésame, servi avec du riz et de salade", price: 26.90, category: "chaud" },

  // ——— PLATS FROIDS ———
  { id: "9",  name: "Tahitien", desc: "Thon rouge mariné au citron vert et gingembre, tomate, concombre, sauce coco", price: 21.90, category: "froid" },
  { id: "10", name: "Kaikai", desc: "Thon rouge mariné au citron vert et gingembre, tomate, concombre, sauce sésame, mangue et ananas", price: 22.90, category: "froid" },
  { id: "11", name: "Haka", desc: "Thon rouge mariné au citron vert et gingembre, tomate, concombre, sauce piment maison", price: 22.90, category: "froid" },
  { id: "12", name: "Mokaï", desc: "Thon rouge mariné au citron vert et gingembre, tomate, concombre, sauce arachide et guacamole maison", price: 24.90, category: "froid" },

  // ——— FORMULES ———
  { id: "13", name: "Formule Découverte", desc: "Velouté + Plat + Boisson", price: 19.90, category: "formules" },
  { id: "14", name: "Formule Voyage", desc: "2x Plats + 2x Boissons + 1x Dessert", price: 49.90, category: "formules" },

  // ——— DESSERTS ———
  { id: "15", name: "Coulant au chocolat", desc: "Gâteau au chocolat à la texture fondante", price: 9.90, category: "desserts" },
  { id: "16", name: "Crème Tropicale", desc: "Coulis mangue / fruit rouges maison", price: 9.90, category: "desserts" },
  { id: "17", name: "Cheesecake", desc: "Coulis fruit rouges maison", price: 12.90, category: "desserts" },

  // ——— BOISSONS ———
  { id: "18", name: "Jus exotiques", desc: "Pomme/kiwi, fraise/framboise, ananas/citron/gingembre, coktail ACE", price: 3.50, category: "boissons" },
  { id: "19", name: "Eau plate/gazeuse", desc: "Eau minérale ou gazeuse", price: 3.00, category: "boissons" },
];

// ---- Ordre + sections ----
const IDS_ENTREES  = [1, 2, 3, 4];
const IDS_CHAUD    = [5, 6, 7, 8];
const IDS_FROID    = [9, 10, 11, 12];
const IDS_FORMULES = [13, 14];
const IDS_DESSERT  = [15, 16, 17];
const IDS_BOISSON  = [18, 19];

const byIds = (ids) => ids.map(id => MENU.find(m => m.id === String(id))).filter(Boolean);
const SEC_ENTREES  = byIds(IDS_ENTREES);
const SEC_CHAUD    = byIds(IDS_CHAUD);
const SEC_FROID    = byIds(IDS_FROID);
const SEC_FORMULES = byIds(IDS_FORMULES);
const SEC_DESSERT  = byIds(IDS_DESSERT);
const SEC_BOISSON  = byIds(IDS_BOISSON);

const ORDERED_IDS = [...IDS_ENTREES, ...IDS_CHAUD, ...IDS_FROID, ...IDS_FORMULES, ...IDS_DESSERT, ...IDS_BOISSON];
const MENU_SORTED = byIds(ORDERED_IDS);

function format(price) {
  return new Intl.NumberFormat("fr-CH", { style: "currency", currency: "CHF" }).format(price);
}

// Vérifier si le restaurant est ouvert
function isRestaurantOpen() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  const lunchStart = 11 * 60 + 30; // 11:30
  const lunchEnd = 14 * 60; // 14:00
  const dinnerStart = 18 * 60; // 18:00
  const dinnerEnd = 22 * 60; // 22:00
  
  return (currentTime >= lunchStart && currentTime < lunchEnd) || 
         (currentTime >= dinnerStart && currentTime < dinnerEnd);
}

// Obtenir le prochain horaire d'ouverture
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

// Slider d'images du hero
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

// Composant Badge (Halal, Healthy Food)
function Badge({ type }) {
  const badges = {
    halal: { icon: "🥩", text: "HALAL", color: "from-green-500/20 to-emerald-500/20 border-green-500/30" },
    healthy: { icon: "🥗", text: "HEALTHY FOOD", color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30" }
  };
  
  const badge = badges[type];
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-gradient-to-r ${badge.color} text-xs font-semibold`}>
      <span>{badge.icon}</span>
      <span>{badge.text}</span>
    </div>
  );
}

// Composant indicateur d'ouverture
function OpenStatus() {
  const [isOpen, setIsOpen] = useState(isRestaurantOpen());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOpen(isRestaurantOpen());
    }, 60000); // Vérifier toutes les minutes
    
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
  const [cartVariants, setCartVariants] = useState({}); // Pour stocker les variantes choisies
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
      setCartVariants(cv => ({ ...cv, [id]: variant }));
    }
  };
  
  const remove = (id) => setCart(c => { const q = (c[id] || 0) - 1; const n = { ...c }; if (q <= 0) { delete n[id]; setCartVariants(cv => { const nv = {...cv}; delete nv[id]; return nv; }); } else n[id] = q; return n; });
  const clear = () => { setCart({}); setCartVariants({}); };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {logoVisible && <img src={LOGO_SRC} alt="Kai Kai" className="h-8 rounded" onError={() => setLogoVisible(false)} />}
            <div>
              <h1 className="text-xl font-semibold">Kai Kai</h1>
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

      {/* Modal À propos */}
      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}

      {/* Menu principal */}
      {step === "menu" && (
        <section className="mx-auto max-w-5xl px-4 py-10">
          {/* Hero + Slider */}
          <div className="mb-10 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
            <div className="mb-6 text-center">
              <div className="flex flex-wrap items-center justify-center gap-3 mb-3">
                <Badge type="halal" />
                <Badge type="healthy" />
              </div>
              <h2 className="mb-2 text-3xl font-bold">Bienvenue chez Kai Kai</h2>
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
                <Percent className="h-4 w-4" />-10% sur votre première commande
              </div>
            </div>
          </div>

          {/* Grille de plats */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Entrées */}
            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🥗 Entrées</h3>
            {SEC_ENTREES.map(item => (
              <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove} />
            ))}

            {/* Plats Chauds */}
            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🔥 Plat Chaud</h3>
            {SEC_CHAUD.map(item => (
              <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove} />
            ))}

            {/* Plats Froids */}
            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">❄️ Plat Froid</h3>
            {SEC_FROID.map(item => (
              <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove} />
            ))}

            {/* Formules */}
            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🎁 Formules</h3>
            {SEC_FORMULES.map(item => (
              <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove} isFormula />
            ))}

            {/* Desserts */}
            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🍰 Desserts & Boisson</h3>
            {SEC_DESSERT.map(item => (
              <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove} />
            ))}

            {/* Boissons */}
            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🧉 Boissons</h3>
            {SEC_BOISSON.map(item => (
              <MenuItem key={item.id} item={item} cart={cart} add={add} remove={remove} />
            ))}
          </div>

          {/* Note */}
          <div className="mt-8 text-center text-sm text-white/50 italic">
            Tout nos plats sont accompagnés de riz et de salade
          </div>
        </section>
      )}

      {/* Checkout */}
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

      {/* Success */}
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
          <div>Kai Kai — restaurant tahitien · {RESTAURANT_INFO.address}</div>
          <div className="mt-1">📞 {RESTAURANT_INFO.phoneDisplay} · 🕐 {RESTAURANT_INFO.hours.lunch.start}-{RESTAURANT_INFO.hours.lunch.end} | {RESTAURANT_INFO.hours.dinner.start}-{RESTAURANT_INFO.hours.dinner.end}</div>
          <div className="mt-2">© {new Date().getFullYear()} Kai Kai — Tous droits réservés.</div>
        </div>
      </footer>
    </div>
  );
}

// Composant item de menu avec animations
function MenuItem({ item, cart, add, remove, isFormula = false }) {
  const [showVariants, setShowVariants] = useState(false);
  
  const handleAdd = (variant = null) => {
    add(item.id, variant);
    if (item.hasVariants) {
      setShowVariants(false);
    }
  };
  
  return (
    <>
      <div className={`rounded-3xl border border-white/10 p-5 transition-all hover:border-white/20 hover:shadow-lg hover:shadow-white/5 ${isFormula ? 'bg-gradient-to-br from-white/5 to-transparent' : ''}`}>
        <div className="flex items-start justify-between gap-4">
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
              onClick={() => item.hasVariants ? setShowVariants(true) : handleAdd()} 
              className="rounded-2xl border border-white/20 p-2 hover:bg-white/10 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal de sélection de variante */}
      {showVariants && item.hasVariants && (
        <VariantModal 
          item={item} 
          onSelect={handleAdd} 
          onClose={() => setShowVariants(false)} 
        />
      )}
    </>
  );
}

// Modal de sélection de variante
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

// Modal À propos
function AboutModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-black border border-white/20 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">À propos de Kai Kai</h2>
          <button onClick={onClose} className="rounded-xl border border-white/20 p-2 hover:bg-white/10 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="space-y-6 text-white/80">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-white">🌴 Notre Histoire</h3>
            <p className="text-sm leading-relaxed">
              Kai Kai est né de la passion pour la cuisine tahitienne authentique. Notre mission est de vous faire voyager 
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
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2759.7!2d${RESTAURANT_INFO.coordinates.lng}!3d${RESTAURANT_INFO.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDbCsDExJzUzLjkiTiA2wrAwOCc0OS45IkU!5e0!3m2!1sfr!2sch!4v1234567890`}
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
    email: "",
    instructions: "" // Instructions spéciales
  });
  const [agree, setAgree] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");
  
  const hasItems = items.some(i => i.qty > 0);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Vérifier la zone de livraison
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
                    (mode === "pickup" || (form.address && form.postalCode && !deliveryError)) && 
                    agree;

  return (
    <section className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm">
      <div className="h-full w-full max-w-xl overflow-auto border-l border-white/10 bg-black p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Commande</h2>
          <button onClick={onClose} className="rounded-xl border border-white/20 p-2 hover:bg-white/10 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Temps de livraison estimé */}
        {mode === "delivery" && (
          <div className="mb-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3 flex items-center gap-2 text-sm">
            <Bike className="h-4 w-4 text-blue-400" />
            <span className="text-blue-400">Livraison estimée : {RESTAURANT_INFO.deliveryTime} min</span>
          </div>
        )}

        {/* Panier */}
        <div className="space-y-3">
          {items.filter(i => i.qty > 0).map(it => (
            <div key={it.id} className="flex items-center justify-between rounded-2xl border border-white/10 p-3">
              <div className="flex-1">
                <div className="font-medium">{it.name}</div>
                {cartVariants[it.id] && (
                  <div className="text-xs text-white/50 mt-0.5">Variante: {cartVariants[it.id].name}</div>
                )}
                <div className="text-sm text-white/60">{it.qty} × {format(it.price)}</div>
              </div>
              <div className="text-right">{format(it.price * it.qty)}</div>
            </div>
          ))}
          {!hasItems && <div className="rounded-2xl border border-white/10 p-4 text-white/60">Votre panier est vide.</div>}
        </div>

        {/* Mode */}
        <div className="mt-6 flex gap-2">
          <button 
            onClick={() => setMode("delivery")} 
            className={`flex-1 rounded-2xl px-3 py-2 text-sm transition-all ${mode === "delivery" ? "bg-white text-black" : "border border-white/20 hover:bg-white/10"}`}
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

        {/* Formulaire */}
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
          
          <input 
            name="email" 
            placeholder="E-mail (pour confirmation)" 
            className="rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white/40 transition-colors" 
            value={form.email} 
            onChange={handleChange} 
          />
          
          <textarea
            name="instructions"
            placeholder="Instructions spéciales (allergies, préférences, etc.)"
            className="rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white/40 transition-colors resize-none"
            rows="3"
            value={form.instructions}
            onChange={handleChange}
          />
          
          <label className="mt-1 flex items-center gap-2 text-sm text-white/70">
            <input 
              type="checkbox" 
              checked={agree} 
              onChange={(e) => setAgree(e.target.checked)}
              className="rounded"
            />
            J'accepte les conditions et la politique de confidentialité.
          </label>
        </div>

        {/* Récap */}
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
