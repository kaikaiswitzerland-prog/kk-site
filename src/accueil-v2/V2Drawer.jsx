// src/accueil-v2/V2Drawer.jsx
//
// Mini-panier flottant + tiroir « Votre commande » de l'accueil v2.
//
// Le tiroir lit le VRAI panier de KaiKaiApp (cart, cartVariants, items) et ne
// calcule aucun prix lui-même : chaque ligne passe par catalog.unitPrice, le
// sous-total / la livraison / le total arrivent en props. Le mode
// (livraison / à emporter) et le NPA sont ceux du Checkout partagé, élevés
// dans KaiKaiApp — ce que le client règle ici, il le retrouve au paiement.
//
// Le bouton « Commander » ouvre le Checkout partagé (paiement carte SumUp,
// espèces au retrait), qui remplace les liens WhatsApp / kaikaifood.com du
// HTML fourni.

import { useEffect, useMemo } from 'react';
import { getZoneByNpa } from '../lib/deliveryZones.js';
import { CART_TARGET_ATTR } from '../lib/flyToCart.js';
import { chf, variantDetail } from './v2Helpers.js';

// Clé stable d'une variante : mêmes options → même clé, quel que soit l'ordre
// des champs. Deux exemplaires strictement identiques partagent une ligne.
const variantKey = (v) => JSON.stringify(v ?? null, (k, val) =>
  (val && typeof val === 'object' && !Array.isArray(val))
    ? Object.keys(val).sort().reduce((o, kk) => { o[kk] = val[kk]; return o; }, {})
    : val);

export function V2Mini({ visible, hidden, cartCount, items, subtotal, onOpen }) {
  const names = useMemo(() => {
    const seen = [];
    items.forEach((it) => { if (it.qty > 0 && !seen.includes(it.name)) seen.push(it.name); });
    return seen.slice(0, 3).join(', ') + (seen.length > 3 ? '…' : '');
  }, [items]);

  return (
    <button
      type="button"
      className={`mini${visible ? ' show' : ''}${hidden ? ' hidden' : ''}`}
      aria-label="Voir le panier"
      aria-hidden={hidden || undefined}
      onClick={onOpen}
      // Point d'arrivée de la pastille lancée à chaque ajout (src/lib/flyToCart.js).
      {...{ [CART_TARGET_ATTR]: '' }}
    >
      <span className="ic">{cartCount}</span>
      <span>
        <span className="mt">{names}</span>
        <span className="mp">{chf(subtotal)}</span>
      </span>
    </button>
  );
}

export function V2Drawer({
  open,
  onClose,
  items = [],
  cartVariants = {},
  catalog,
  subtotal = 0,
  deliveryFee = 0,
  total = 0,
  mode,
  setMode,
  deliveryNpa = '',
  setDeliveryNpa,
  restaurant,
  onRemoveAt,
  onRemoveMany,
  onAddExact,
  onClear,
  onOpenCheckout,
}) {
  // Une ligne par GROUPE d'exemplaires strictement identiques (même plat,
  // mêmes options), avec sa quantité : deux Chao Men porc font une ligne × 2,
  // un Chao Men porc et un Chao Men poulet font deux lignes.
  const lines = useMemo(() => {
    const groups = new Map();
    items.forEach((it) => {
      if (!it.qty) return;
      const variants = Array.isArray(cartVariants[it.id]) ? cartVariants[it.id] : [];
      for (let k = 0; k < it.qty; k++) {
        const v = variants[k] ?? null;
        const key = `${it.id}|${variantKey(v)}`;
        if (!groups.has(key)) groups.set(key, { key, item: it, variant: v, detail: variantDetail(v), unit: catalog.unitPrice(it, v), count: 0, indices: [] });
        const g = groups.get(key);
        g.count += 1;
        if (k < variants.length) g.indices.push(k);
      }
    });
    return [...groups.values()];
  }, [items, cartVariants, catalog]);

  // − : un exemplaire de moins (la ligne disparaît à zéro) · + : un exemplaire
  // identique de plus, sans repasser par les options · ✕ : toute la ligne.
  const minusOne = (g) => onRemoveAt(g.item.id, g.indices.length ? g.indices[g.indices.length - 1] : null);
  const plusOne = (g) => onAddExact(g.item.id, g.variant);
  const removeLine = (g) => onRemoveMany(g.item.id, g.count, g.indices);

  const minDelivery = catalog.minimumDelivery;
  const canDel = subtotal >= minDelivery;
  const zone = mode === 'delivery' ? getZoneByNpa(deliveryNpa) : null;

  // Même règle que le Checkout partagé : sous le minimum, on bascule à emporter.
  useEffect(() => {
    if (open && !canDel && mode === 'delivery') setMode('pickup');
  }, [open, canDel, mode, setMode]);

  // Le fond ne défile pas derrière le tiroir.
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="drawer-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="drawer" aria-label="Votre commande">
        <div className="dhead">
          <h2>Votre commande</h2>
          <button type="button" className="x" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        {lines.length === 0 && <p className="empty">Votre panier est vide.</p>}

        {lines.map((g) => (
          <div className="dline" key={g.key}>
            <div className="dmain">
              <div className="n">{g.item.name}</div>
              {g.detail && <div className="v">{g.detail}</div>}
              <div className="dqty" role="group" aria-label={`Quantité de ${g.item.name}`}>
                <button type="button" className="qb" onClick={() => minusOne(g)} aria-label="Un de moins">−</button>
                <span className="qn">{g.count}</span>
                <button type="button" className="qb" onClick={() => plusOne(g)} aria-label="Un de plus">+</button>
              </div>
            </div>
            <div className="r">
              <b>{chf(g.unit * g.count)}</b>
              {g.count > 1 && <small>{g.count} × {chf(g.unit)}</small>}
              <button type="button" className="qb x" onClick={() => removeLine(g)} aria-label="Supprimer la ligne">✕</button>
            </div>
          </div>
        ))}

        {lines.length > 0 && (
          <>
            <div className="modes">
              <button type="button" className={mode === 'delivery' ? 'on' : ''} disabled={!canDel} onClick={() => setMode('delivery')}>Livraison</button>
              <button type="button" className={mode === 'pickup' ? 'on' : ''} onClick={() => setMode('pickup')}>À emporter</button>
            </div>
            {!canDel && (
              <p className="hint ko">Livraison dès {chf(minDelivery)} de commande (actuellement {chf(subtotal)}).</p>
            )}
            {mode === 'delivery' ? (
              <>
                <div className="npa">
                  <input
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="Code postal (NPA)"
                    value={deliveryNpa}
                    onChange={(e) => setDeliveryNpa((e.target.value || '').replace(/\D/g, '').slice(0, 4))}
                    aria-label="Code postal"
                  />
                </div>
                {zone ? (
                  <p className="hint ok">{zone.label} · {zone.name} · livraison {chf(zone.fee)} · {restaurant.deliveryTime} min</p>
                ) : deliveryNpa.length === 4 ? (
                  <p className="hint ko">Hors zone de livraison — choisissez À emporter.</p>
                ) : (
                  <p className="hint">Genève uniquement, rayon ~8 km.</p>
                )}
              </>
            ) : (
              <p className="hint">Prêt en {restaurant.prepTime} min · {restaurant.address} · carte ou espèces.</p>
            )}

            <div className="tot">
              <div><span>Sous-total</span><span>{chf(subtotal)}</span></div>
              {mode === 'delivery' && <div><span>Livraison</span><span>{zone ? chf(deliveryFee) : '—'}</span></div>}
              <div className="big"><span>Total</span><span>{chf(total)}</span></div>
            </div>

            <button type="button" className="btn primary" onClick={() => { onClose(); onOpenCheckout(); }}>
              Commander · payer en ligne
            </button>
            <p className="note">Paiement par carte en ligne, ou en espèces au retrait pour l'emporter. Vos plats et votre code postal sont repris tels quels à l'étape suivante.</p>
            <button type="button" className="clear" onClick={onClear}>Vider le panier</button>
          </>
        )}
      </aside>
    </div>
  );
}
