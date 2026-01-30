 // src/App.jsx
import React, { useMemo, useState } from "react";
import { ShoppingCart, Minus, Plus, X, MapPin, Bike, Percent, Check } from "lucide-react";

// chemin de ton logo placé dans /public
const LOGO_SRC = "/logo.png";

// --- Menu réel (CHF) - Mis à jour selon le menu officiel
const MENU = [
  // ——— ENTRÉES ———
  { id: "1",  name: "Velouté koko", desc: "Légumes de saison et crème coco", price: 4.90 },
  { id: "2",  name: "Salade d'avocat", desc: "Salade, tomate, patate, concombre, guacamole maison, cacahuètes", price: 7.90 },
  { id: "3",  name: "Salade de poulet", desc: "Salade, tomate, patate, concombre, poulet", price: 9.90 },
  { id: "4",  name: "Tartare de thon rouge", desc: "Mariné au citron vert et gingembre avec 4 variantes possible : Tahitien, Haka, Mokaï, Kaikai", price: 12.90 },

  // ——— PLATS CHAUDS ———
  { id: "5",  name: "Chao Men", desc: "Nouilles sautées, légumes de saison, wok de porc et/ou poulet, sauce crevette et champignons", price: 17.90 },
  { id: "6",  name: "Kai Fan", desc: "Riz sauté, wok de porc et/ou poulet, sauce crevette et champignons, servi avec sa salade exotique", price: 17.90 },
  { id: "7",  name: "Omelette Fu Young", desc: "Omelette aux légumes sautés de saison", price: 16.90 },
  { id: "8",  name: "Wok de Bœuf", desc: "Wok de bœuf, légumes de saison, sauce sésame, servi avec du riz et de salade", price: 26.90 },

  // ——— PLATS FROIDS ———
  { id: "9",  name: "Tahitien", desc: "Thon rouge mariné au citron vert et gingembre, tomate, concombre, sauce coco", price: 21.90 },
  { id: "10", name: "Kaikai", desc: "Thon rouge mariné au citron vert et gingembre, tomate, concombre, sauce sésame, mangue et ananas", price: 22.90 },
  { id: "11", name: "Haka", desc: "Thon rouge mariné au citron vert et gingembre, tomate, concombre, sauce piment maison", price: 22.90 },
  { id: "12", name: "Mokaï", desc: "Thon rouge mariné au citron vert et gingembre, tomate, concombre, sauce arachide et guacamole maison", price: 24.90 },

  // ——— FORMULES ———
  { id: "13", name: "Formule Découverte", desc: "Velouté + Plat + Boisson", price: 19.90 },
  { id: "14", name: "Formule Voyage", desc: "2x Plats + 2x Boissons + 1x Dessert", price: 49.90 },

  // ——— DESSERTS ———
  { id: "15", name: "Coulant au chocolat", desc: "Gâteau au chocolat à la texture fondante", price: 9.90 },
  { id: "16", name: "Crème Tropicale", desc: "Coulis mangue / fruit rouges maison", price: 9.90 },
  { id: "17", name: "Cheesecake", desc: "Coulis fruit rouges maison", price: 12.90 },

  // ——— BOISSONS ———
  { id: "18", name: "Jus exotiques", desc: "Pomme/kiwi, fraise/framboise, ananas/citron/gingembre, coktail ACE", price: 3.50 },
  { id: "19", name: "Eau plate/gazeuse", desc: "Eau minérale ou gazeuse", price: 3.00 },
];


// ---- Ordre + sections (sans casser le design) ----
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
// --------------------------------------------------

function format(price) {
  return new Intl.NumberFormat("fr-CH", { style: "currency", currency: "CHF" }).format(price);
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
          className="pointer-events-auto rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm"
        >
          ◀
        </button>
        <button
          onClick={() => setIdx(i => (i + 1) % IMAGES.length)}
          className="pointer-events-auto rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm"
        >
          ▶
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-2 w-2 rounded-full ${i === idx ? "bg-white" : "bg-white/30"}`}
            aria-label={`Aller à l'image ${i+1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function KaiKaiApp() {
  const [cart, setCart] = useState({});
  const [mode, setMode] = useState("delivery");
  const [couponApplied] = useState(true);
  const [step, setStep] = useState("menu");
  const [logoVisible, setLogoVisible] = useState(true);

  const items = useMemo(() => MENU_SORTED.map(m => ({ ...m, qty: cart[m.id] || 0 })), [cart]);
  const subtotal = useMemo(() => items.reduce((s, it) => s + it.price * it.qty, 0), [items]);
  const discount = useMemo(() => (couponApplied ? subtotal * 0.10 : 0), [couponApplied, subtotal]);
  const deliveryFee = useMemo(() => (mode === "delivery" && subtotal > 0 ? 4.9 : 0), [mode, subtotal]);
  const total = useMemo(() => Math.max(0, subtotal - discount) + deliveryFee, [subtotal, discount, deliveryFee]);

  const add = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const remove = (id) => setCart(c => { const q = (c[id] || 0) - 1; const n = { ...c }; if (q <= 0) delete n[id]; else n[id] = q; return n; });
  const clear = () => setCart({});

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {logoVisible && <img src={LOGO_SRC} alt="Kai Kai" className="h-8 rounded" onError={() => setLogoVisible(false)} />}
            <h1 className="text-xl font-semibold">Kai Kai</h1>
          </div>
          <button onClick={() => setStep("checkout")} className="relative rounded-2xl border border-white/20 p-2.5">
            <ShoppingCart className="h-5 w-5" />
            {Object.values(cart).reduce((s, q) => s + q, 0) > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-black">
                {Object.values(cart).reduce((s, q) => s + q, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Menu principal */}
      {step === "menu" && (
        <section className="mx-auto max-w-5xl px-4 py-10">
          {/* Hero + Slider */}
          <div className="mb-10 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-3xl font-bold">Bienvenue chez Kai Kai</h2>
              <p className="text-white/70">Cuisine tahitienne authentique — Genève & Lausanne</p>
            </div>
            <HeroSlider />
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-white/60">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />Rue du Marché 6, 1204 Genève</div>
              <div className="flex items-center gap-2"><Bike className="h-4 w-4" />Livraison rapide</div>
              <div className="flex items-center gap-2"><Percent className="h-4 w-4" />-10% sur votre première commande</div>
            </div>
          </div>

          {/* Grille de plats */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Entrées */}
            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🥗 Entrées</h3>
            {SEC_ENTREES.map(item => (
              <div key={item.id} className="rounded-3xl border border-white/10 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-medium">{item.name}</div>
                    <div className="mt-1 text-sm text-white/60">{item.desc}</div>
                    <div className="mt-2 text-white/90">{format(item.price)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => remove(item.id)} className="rounded-2xl border border-white/20 p-2"><Minus className="h-4 w-4" /></button>
                    <span className="w-6 text-center">{cart[item.id] || 0}</span>
                    <button onClick={() => add(item.id)} className="rounded-2xl border border-white/20 p-2"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}

            {/* Plats Chauds */}
            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🔥 Plat Chaud</h3>
            {SEC_CHAUD.map(item => (
              <div key={item.id} className="rounded-3xl border border-white/10 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-medium">{item.name}</div>
                    <div className="mt-1 text-sm text-white/60">{item.desc}</div>
                    <div className="mt-2 text-white/90">{format(item.price)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => remove(item.id)} className="rounded-2xl border border-white/20 p-2"><Minus className="h-4 w-4" /></button>
                    <span className="w-6 text-center">{cart[item.id] || 0}</span>
                    <button onClick={() => add(item.id)} className="rounded-2xl border border-white/20 p-2"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}

            {/* Plats Froids */}
            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">❄️ Plat Froid</h3>
            {SEC_FROID.map(item => (
              <div key={item.id} className="rounded-3xl border border-white/10 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-medium">{item.name}</div>
                    <div className="mt-1 text-sm text-white/60">{item.desc}</div>
                    <div className="mt-2 text-white/90">{format(item.price)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => remove(item.id)} className="rounded-2xl border border-white/20 p-2"><Minus className="h-4 w-4" /></button>
                    <span className="w-6 text-center">{cart[item.id] || 0}</span>
                    <button onClick={() => add(item.id)} className="rounded-2xl border border-white/20 p-2"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}

            {/* Formules */}
            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🎁 Formules</h3>
            {SEC_FORMULES.map(item => (
              <div key={item.id} className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-medium">{item.name}</div>
                    <div className="mt-1 text-sm text-white/60">{item.desc}</div>
                    <div className="mt-2 text-white/90">{format(item.price)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => remove(item.id)} className="rounded-2xl border border-white/20 p-2"><Minus className="h-4 w-4" /></button>
                    <span className="w-6 text-center">{cart[item.id] || 0}</span>
                    <button onClick={() => add(item.id)} className="rounded-2xl border border-white/20 p-2"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}

            {/* Desserts */}
            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🍰 Desserts & Boisson</h3>
            {SEC_DESSERT.map(item => (
              <div key={item.id} className="rounded-3xl border border-white/10 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-medium">{item.name}</div>
                    <div className="mt-1 text-sm text-white/60">{item.desc}</div>
                    <div className="mt-2 text-white/90">{format(item.price)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => remove(item.id)} className="rounded-2xl border border-white/20 p-2"><Minus className="h-4 w-4" /></button>
                    <span className="w-6 text-center">{cart[item.id] || 0}</span>
                    <button onClick={() => add(item.id)} className="rounded-2xl border border-white/20 p-2"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}

            {/* Boissons */}
            <h3 className="col-span-full mt-8 text-2xl font-semibold tracking-wide text-white/60">🧉 Boissons</h3>
            {SEC_BOISSON.map(item => (
              <div key={item.id} className="rounded-3xl border border-white/10 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-medium">{item.name}</div>
                    <div className="mt-1 text-sm text-white/60">{item.desc}</div>
                    <div className="mt-2 text-white/90">{format(item.price)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => remove(item.id)} className="rounded-2xl border border-white/20 p-2"><Minus className="h-4 w-4" /></button>
                    <span className="w-6 text-center">{cart[item.id] || 0}</span>
                    <button onClick={() => add(item.id)} className="rounded-2xl border border-white/20 p-2"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div> {/* <- ferme le grid */}

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
          <button onClick={() => setStep("menu")} className="mt-6 rounded-2xl bg-white px-4 py-2 text-black">Revenir au menu</button>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 py-10 text-center text-sm text-white/60">
        <div className="mx-auto max-w-5xl px-4">
          <div>Kai Kai — restaurant tahitien · Genève & Lausanne · <a href="#" className="underline">Instagram</a></div>
          <div className="mt-2">© {new Date().getFullYear()} Kai Kai — Tous droits réservés.</div>
        </div>
      </footer>
    </div>
  );
}

function Checkout({ items, subtotal, discount, deliveryFee, total, mode, setMode, onClose, onClear, onSuccess }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", address: "", email: "" });
  const [agree, setAgree] = useState(false);
  const hasItems = items.some(i => i.qty > 0);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const canSubmit = hasItems && form.firstName && form.lastName && form.phone && (mode === "pickup" || form.address) && agree;

  return (
    <section className="fixed inset-0 z-50 flex items-start justify-end bg-black/60">
      <div className="h-full w-full max-w-xl overflow-auto border-l border-white/10 bg-black p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Commande</h2>
          <button onClick={onClose} className="rounded-xl border border-white/20 p-2"><X className="h-4 w-4" /></button>
        </div>

        {/* Panier */}
        <div className="space-y-3">
          {items.filter(i => i.qty > 0).map(it => (
            <div key={it.id} className="flex items-center justify-between rounded-2xl border border-white/10 p-3">
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-sm text-white/60">{it.qty} × {format(it.price)}</div>
              </div>
              <div className="text-right">{format(it.price * it.qty)}</div>
            </div>
          ))}
          {!hasItems && <div className="rounded-2xl border border-white/10 p-4 text-white/60">Votre panier est vide.</div>}
        </div>

        {/* Mode */}
        <div className="mt-6 flex gap-2">
          <button onClick={() => setMode("delivery")} className={`flex-1 rounded-2xl px-3 py-2 text-sm ${mode === "delivery" ? "bg-white text-black" : "border border-white/20"}`}>Livraison</button>
          <button onClick={() => setMode("pickup")} className={`flex-1 rounded-2xl px-3 py-2 text-sm ${mode === "pickup" ? "bg-white text-black" : "border border-white/20"}`}>À emporter</button>
        </div>

        {/* Formulaire sans compte */}
        <div className="mt-6 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input name="firstName" placeholder="Prénom" className="rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none" value={form.firstName} onChange={handleChange} />
            <input name="lastName" placeholder="Nom" className="rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none" value={form.lastName} onChange={handleChange} />
          </div>
          <input name="phone" placeholder="Téléphone" className="rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none" value={form.phone} onChange={handleChange} />
          {mode === "delivery" && (
            <input name="address" placeholder="Adresse de livraison" className="rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none" value={form.address} onChange={handleChange} />
          )}
          <input name="email" placeholder="E-mail (pour confirmation)" className="rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none" value={form.email} onChange={handleChange} />
          <label className="mt-1 flex items-center gap-2 text-sm text-white/70">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
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
          <button onClick={onClear} className="rounded-2xl border border-white/20 px-4 py-2 text-sm">Vider le panier</button>
          <button disabled={!canSubmit} onClick={() => onSuccess()} className={`rounded-2xl px-4 py-2 ${canSubmit ? "bg-white text-black" : "border border-white/20 text-white/50"}`}>Payer maintenant</button>
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
