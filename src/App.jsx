// src/App.jsx
import React, { useMemo, useState } from "react";
import { ShoppingCart, Minus, Plus, X, MapPin, Bike, Percent, Check } from "lucide-react";

// chemin de ton logo placé dans /public
const LOGO_SRC = "/logo.png";

// --- Menu réel (CHF)
const MENU = [
  // ——— PLATS CHAUDS ———
  { id: "1",  name: "Chao Men", desc: "Nouilles sautées, légumes de saison, wok de porc et poulet. Sauce crevettes et champignons.", price: 14.5 },
  { id: "2",  name: "Kai Fan", desc: "Riz sauté, wok de porc et poulet. Sauce crevettes et champignons. Servi avec salade exotique.", price: 14.5 },
  { id: "3",  name: "Porcelet Coco", desc: "Porcelet rôti au four. Sauce coco et citron vert. Accompagnement: patate douce/manioc ou lentilles corail/cacahuètes.", price: 17 },
  { id: "4",  name: "Fricassée de Thon", desc: "Thon braisé, légumes de saison. Sauce citron vert, gingembre. Servi avec du riz et de la salade.", price: 19 },
  { id: "5",  name: "Wok de Bœuf", desc: "Wok de bœuf, légumes de saison. Sauce sésame. Servi avec du riz et de la salade.", price: 28.5 },

  // ——— PLATS FROIDS ———
  { id: "6",  name: "Poisson Tahitien", desc: "Tartare de thon mariné au citron vert et gingembre. Tomate, concombre. Sauce coco. Servi avec du riz et de la salade.", price: 15.5 },
  { id: "7",  name: "Poisson KaiKai", desc: "Tartare de thon mariné au citron vert et gingembre. Tomate, concombre. Sauce sésame, mangue et ananas. Servi avec du riz et de la salade.", price: 15.5 },
  { id: "8",  name: "Poisson Haka", desc: "Tartare de thon mariné au citron vert et gingembre. Tomate, concombre. Sauce piment. Servi avec du riz et de la salade.", price: 16 },
  { id: "9",  name: "Poisson Mokai", desc: "Tartare de thon mariné au citron vert et gingembre. Tomate, concombre. Sauce cacahuètes et avocat. Servi avec du riz et de la salade.", price: 17 },
  { id: "10", name: "Trio de Poisson au Choix", desc: "3 tartares au choix. Servi avec du riz et de la salade.", price: 22 },

  // ——— ENTRÉES ———
  { id: "11", name: "Entrée Tahitienne", desc: "Entrée tartare de thon mariné au citron vert et gingembre. Tomate, concombre. Sauce coco.", price: 8.5 },
  { id: "12", name: "Entrée KaiKai", desc: "Entrée tartare de thon mariné au citron vert et gingembre. Tomate, concombre. Sauce sésame, mangue et ananas.", price: 8.5 },
  { id: "13", name: "Entrée Haka", desc: "Entrée tartare de thon mariné au citron vert et gingembre. Tomate, concombre. Sauce piment.", price: 8.5 },
  { id: "14", name: "Entrée Mokai", desc: "Entrée tartare de thon mariné au citron vert et gingembre. Tomate, concombre et avocat. Sauce arachide, gingembre sucré.", price: 8.5 },
  { id: "15", name: "Salade d'Avocat", desc: "Salade, tomates, patates, concombres, avocat, cacahuètes.", price: 8.5 },
  { id: "16", name: "Salade de Poulet", desc: "Salade, tomates, patates, concombres, poulet.", price: 8.5 },

  // ——— DESSERTS ———
  { id: "17", name: "Poe Banane", desc: "Compoté de banane à la perle du Japon, vanille et crème de coco.", price: 6.5 },
  { id: "18", name: "Crème à la Mangue", desc: "Crème maison avec coulis de mangue frais.", price: 6.5 },
  { id: "19", name: "Coulant au Chocolat", desc: "Coulant au chocolat.", price: 6.5 },
  { id: "20", name: "Glace Pina Colada ou Coco-Choco", desc: "Glace au choix: pina colada ou coco-choco.", price: 6.5 },

  // ——— BOISSONS ———
  { id: "21", name: "Soda", desc: "Coca-Cola, Orangina, Schweppes…", price: 3.5 },
  { id: "22", name: "Suprême", desc: "Hibiscus-Framboise / Gingembre-Ananas / Baobab.", price: 5.5 },
  { id: "23", name: "Jus de Fruits", desc: "Demandez nos parfums.", price: 3.5 },
  { id: "24", name: "Abatilles 50cl", desc: "Eau pétillante ou minérale.", price: 3 },
  { id: "25", name: "Abatilles 1L", desc: "Eau pétillante ou minérale.", price: 4.5 },
  { id: "26", name: "Perrier 33cl", desc: "Eau gazeuse Perrier.", price: 4 },
  { id: "27", name: "Supplément Sirop", desc: "Grenadine, Menthe, Fraise, Pêche… (ajout)", price: 0.5 },
];

// ---- Ajout: ordre + sections (sans casser le design) ----
const ORDERED_IDS = [
  // Entrées
  11,12,13,14,15,16,
  // Menus chauds
  1,2,3,4,5,
  // Menus froids
  6,7,8,9,10,
  // Desserts
  17,18,19,20,
  // Boissons
  21,22,23,24,25,26,27
];
const byIds = ids => ids.map(id => MENU.find(m => m.id === String(id))).filter(Boolean);
const MENU_SORTED = byIds(ORDERED_IDS);

const IDS_ENTREES = [11,12,13,14,15,16];
const IDS_CHAUD   = [1,2,3,4,5];
const IDS_FROID   = [6,7,8,9,10];
const IDS_DESSERT = [17,18,19,20];
const IDS_BOISSON = [21,22,23,24,25,26,27];

const SEC_ENTREES = byIds(IDS_ENTREES);
const SEC_CHAUD   = byIds(IDS_CHAUD);
const SEC_FROID   = byIds(IDS_FROID);
const SEC_DESSERT = byIds(IDS_DESSERT);
const SEC_BOISSON = byIds(IDS_BOISSON);
// ---------------------------------------------------------

function format(price) {
  return new Intl.NumberFormat("fr-CH", { style: "currency", currency: "CHF" }).format(price);
}

export default function KaiKaiApp() {
  const [cart, setCart] = useState({});
  const [mode, setMode] = useState("delivery");
  const [couponApplied] = useState(true);
  const [step, setStep] = useState("menu");
  const [logoVisible, setLogoVisible] = useState(true);

  // on calcule à partir de MENU_SORTED (ordre correct)
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
        <div className="relative mx-auto flex max-w-5xl items-center justify-center px-4 py-4">
          <div className="flex flex-col items-center">
            {logoVisible ? (
              <img src={LOGO_SRC} alt="Kai Kai" className="h-14 w-auto" onError={() => setLogoVisible(false)} />
            ) : (
              <span className="text-xl font-semibold tracking-wide">Kai Kai</span>
            )}
            <p className="mt-2 text-sm text-white/70 text-center">
              Votre restaurant tahitien en livraison sur Genève & Lausanne.
            </p>
          </div>
          <div className="absolute left-4 hidden items-center gap-2 sm:flex">
            <button
              onClick={() => setMode("delivery")}
              className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm ${mode === "delivery" ? "bg-white text-black" : "border border-white/20"}`}
            >
              <Bike className="h-4 w-4" /> Livraison
            </button>
            <button
              onClick={() => setMode("pickup")}
              className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm ${mode === "pickup" ? "bg-white text-black" : "border border-white/20"}`}
            >
              <MapPin className="h-4 w-4" /> À emporter
            </button>
          </div>
          <div className="absolute right-4 flex items-center gap-3">
            <span className="hidden text-sm text-white/70 sm:inline">{format(total)}</span>
            <button
              onClick={() => setStep("checkout")}
              className="flex items-center gap-2 rounded-2xl border border-white/20 px-3 py-2 text-sm"
            >
              <ShoppingCart className="h-4 w-4" /> Panier
            </button>
          </div>
        </div>
      </header>

      {/* Bannière -10% */}
      <div className="border-b border-white/10 bg-white text-black">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 py-2 text-sm font-medium">
          <Percent className="h-4 w-4" />
          <span>-10% sur toutes les commandes passées sur notre site — automatiquement appliqué.</span>
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep("menu")} className="rounded-2xl bg-white px-4 py-2 text-black">Voir le menu</button>
              <button onClick={() => setStep("checkout")} className="rounded-2xl border border-white/20 px-4 py-2">Commander</button>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 p-6">
            <div className="grid grid-cols-3 gap-3">
              {MENU_SORTED.slice(0, 9).map(m => (
                <div key={m.id} className="rounded-2xl border border-white/10 p-3">
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="mt-1 text-xs text-white/60">{format(m.price)}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <button onClick={() => remove(m.id)} className="rounded-xl border border-white/20 p-1"><Minus className="h-4 w-4" /></button>
                    <span>{cart[m.id] || 0}</span>
                    <button onClick={() => add(m.id)} className="rounded-xl border border-white/20 p-1"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section Menu */}
      {step === "menu" && (
        <section className="mx-auto max-w-5xl px-4 pb-24">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Menu</h2>
            <div className="text-sm text-white/70">Mode: {mode === "delivery" ? "Livraison" : "À emporter"}</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            {/* Entrées */}
            <h3 className="col-span-full mt-6 text-sm font-semibold tracking-wide text-white/60">🥗 Entrées</h3>
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

            {/* Plats chauds */}
            <h3 className="col-span-full mt-8 text-sm font-semibold tracking-wide text-white/60">🔥 Plats chauds</h3>
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

            {/* Plats froids */}
            <h3 className="col-span-full mt-8 text-sm font-semibold tracking-wide text-white/60">❄️ Plats froids</h3>
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

            {/* Desserts */}
            <h3 className="col-span-full mt-8 text-sm font-semibold tracking-wide text-white/60">🍰 Desserts</h3>
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
            <h3 className="col-span-full mt-8 text-sm font-semibold tracking-wide text-white/60">🥤 Boissons</h3>
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
            J’accepte les conditions et la politique de confidentialité.
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
