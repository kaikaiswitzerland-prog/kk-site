// src/refonte/ProductCard.jsx
//
// Carte produit de la grille refonte — photo carrée dominante, badge, nom,
// prix, avis. Composant PUREMENT présentationnel : il ne connaît ni le panier,
// ni les ruptures, ni les modaux d'options. Tout arrive en props, ce qui permet
// de le brancher tel quel sur la logique existante de KaiKaiApp (add/remove +
// isMenuItemUnavailable) le jour de l'intégration.

import { useEffect, useState } from 'react';
import { Plus, Minus, Star } from 'lucide-react';
import { BADGE_LABELS, getProductMeta } from './productMeta.js';

const chf = (price) =>
  new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(price);

// Cascade d'images : PNG détouré → JPG actuel → rien.
// Tant que les PNG ne sont pas livrés, la grille tourne sur les JPG existants.
function useImageFallback(meta) {
  const chain = [
    meta.png ? { src: meta.png, kind: 'png' } : null,
    meta.jpg ? { src: meta.jpg, kind: 'jpg' } : null,
  ].filter(Boolean);

  const [step, setStep] = useState(0);
  useEffect(() => { setStep(0); }, [meta.png, meta.jpg]);

  return {
    current: chain[step] || null,
    onError: () => setStep((s) => s + 1),
  };
}

export default function ProductCard({
  item,
  qty = 0,
  onAdd,
  onRemove,
  outOfStock = false,
  // `true` pour les plats dont le prix dépend d'une option (composeur de wok) :
  // affiche « dès CHF X » au lieu d'un prix ferme.
  priceFrom = false,
  meta: metaOverride,
}) {
  const meta = metaOverride || getProductMeta(item.id);
  const { current, onError } = useImageFallback(meta);
  const hasRating = meta.rating != null;

  return (
    <article className={`rf-card${outOfStock ? ' rf-card--out' : ''}`}>
      <div className={`rf-card__media${current ? '' : ' rf-card__media--empty'}`}>
        {/* Une seule pastille à la fois : à 178 px de large, badge + rupture
            côte à côte se touchent. En rupture, c'est la rupture qui prime. */}
        {outOfStock ? (
          <span className="rf-flag-out">Rupture</span>
        ) : (
          meta.badge && (
            <span className={`rf-badge rf-badge--${meta.badge}`}>
              {BADGE_LABELS[meta.badge] || meta.badge}
            </span>
          )
        )}
        {current && (
          <img
            key={current.src}
            src={current.src}
            alt={item.name}
            loading="lazy"
            decoding="async"
            onError={onError}
            className={`rf-card__img rf-card__img--${current.kind}`}
          />
        )}
      </div>

      <div className="rf-card__body">
        <h3 className="rf-card__name">{item.name}</h3>

        {hasRating && (
          <div
            className="rf-card__rating"
            aria-label={`Note ${meta.rating} sur 5${meta.reviews ? `, ${meta.reviews} avis` : ''}`}
          >
            <Star size={12} strokeWidth={0} fill="currentColor" aria-hidden="true" />
            <span className="rf-card__score">{meta.rating.toFixed(1)}</span>
            {meta.reviews != null && (
              <span className="rf-card__reviews">({meta.reviews})</span>
            )}
          </div>
        )}

        <div className="rf-card__foot">
          <div className="rf-card__price">
            {priceFrom && <span className="rf-card__price-from">dès</span>}
            {chf(item.price)}
          </div>

          {qty > 0 ? (
            <div className="rf-step">
              <button
                type="button"
                className="rf-step__btn"
                onClick={() => onRemove?.(item)}
                aria-label={`Retirer un ${item.name}`}
              >
                <Minus size={14} />
              </button>
              <span className="rf-step__qty" aria-live="polite">{qty}</span>
              <button
                type="button"
                className="rf-step__btn"
                onClick={() => onAdd?.(item)}
                disabled={outOfStock}
                aria-label={`Ajouter un ${item.name}`}
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="rf-add"
              onClick={() => onAdd?.(item)}
              disabled={outOfStock}
              title={outOfStock ? 'En rupture de stock' : `Ajouter ${item.name}`}
              aria-label={outOfStock ? `${item.name} en rupture` : `Ajouter ${item.name}`}
            >
              <Plus size={17} strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
