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
  onClear,
  onOpenCheckout,
}) {
  // Une ligne par EXEMPLAIRE, comme dans le HTML : deux Chao Men avec deux
  // protéines différentes font deux lignes, chacune avec son détail.
  const lines = useMemo(() => {
    const out = [];
    items.forEach((it) => {
      if (!it.qty) return;
      const variants = Array.isArray(cartVariants[it.id]) ? cartVariants[it.id] : [];
      for (let k = 0; k < it.qty; k++) {
        const v = variants[k] ?? null;
        out.push({ key: `${it.id}-${k}`, item: it, index: k, variant: v, detail: variantDetail(v), price: catalog.unitPrice(it, v) });
      }
    });
    return out;
  }, [items, cartVariants, catalog]);

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

        {lines.map((l) => (
          <div className="dline" key={l.key}>
            <div>
              <div className="n">{l.item.name}</div>
              {l.detail && <div className="v">{l.detail}</div>}
            </div>
            <div className="r">
              <b>{chf(l.price)}</b>
              <button type="button" className="qb" onClick={() => onRemoveAt(l.item.id, l.index)} aria-label="Retirer">✕</button>
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
