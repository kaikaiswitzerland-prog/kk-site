// src/refonte/RefonteHeader.jsx
//
// Header sticky de la refonte. Même contenu fonctionnel que celui du site
// actuel — marque, statut ouvert/fermé, téléphone, panier avec compteur —
// mais au thème noir/lime. Aucune logique ici : le statut et le compteur
// arrivent en props depuis KaiKaiApp, qui reste la seule source.

import { Phone, ShoppingCart, ShieldAlert, Info } from 'lucide-react';

// Trois états, exactement ceux d'OpenStatus sur le site actuel :
//   ouvert · fermeture manuelle (stop commandes admin) · fermeture horaire.
function statusTone(isOpen, manualClosure) {
  if (isOpen) return 'open';
  return manualClosure ? 'manual' : 'auto';
}

export default function RefonteHeader({
  restaurantOpen,
  manualClosure,
  openStatusLabel,
  cartCount = 0,
  onOpenCheckout,
  onShowAllergens,
  onShowAbout,
  phone,
}) {
  return (
    <header className="rf-header">
      <div className="rf-header__inner">
        <div className="rf-header__brand">
          <span className="rf-header__name">KaïKaï</span>
          <span className={`rf-status rf-status--${statusTone(restaurantOpen, manualClosure)}`}>
            <span className="rf-status__dot" aria-hidden="true" />
            {openStatusLabel}
          </span>
        </div>

        <div className="rf-header__actions">
          {onShowAbout && (
            <button
              type="button"
              className="rf-iconbtn"
              onClick={onShowAbout}
              aria-label="À propos"
              title="À propos"
            >
              <Info size={18} />
            </button>
          )}
          <button
            type="button"
            className="rf-iconbtn"
            onClick={onShowAllergens}
            aria-label="Allergènes"
            title="Allergènes"
          >
            <ShieldAlert size={18} />
          </button>
          {phone && (
            <a href={`tel:${phone}`} className="rf-iconbtn" aria-label="Appeler">
              <Phone size={18} />
            </a>
          )}
          <button
            type="button"
            className="rf-iconbtn rf-iconbtn--cart"
            onClick={onOpenCheckout}
            aria-label={cartCount > 0 ? `Panier, ${cartCount} article(s)` : 'Panier'}
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && <span className="rf-iconbtn__count">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
