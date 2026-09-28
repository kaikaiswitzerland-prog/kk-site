// src/accueil-v2/V2Header.jsx
//
// Barre de menu blanche de l'accueil v2 : logo K (public/logo_kaikai_k.png,
// extrait du HTML fourni), navigation, bouton téléphone, bouton « Votre panier ».
// Hauteur 80 px, 68 px sur téléphone (jetons --nav / --logo dans accueil-v2.css).
//
// Aucune logique de commande : le compteur, le numéro et l'ouverture du tiroir
// viennent du shell en props.

import { Phone } from 'lucide-react';
import { scrollToId } from './useScrollSpy.js';

export default function V2Header({ headerRef, scrolled, activeTop, cartCount = 0, phone = null, onOpenDrawer }) {
  const go = (id) => (e) => { e.preventDefault(); scrollToId(id); };

  return (
    <header ref={headerRef} id="top" className={scrolled ? 'scrolled' : undefined}>
      <a
        className="logo"
        href="#top"
        aria-label="KaïKaï, accueil"
        onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      >
        <img src="/logo_kaikai_k.png" alt="" width="300" height="280" />
        <span><small>TAHITIAN FOOD</small></span>
      </a>
      <nav aria-label="Navigation principale">
        <a href="#menu" onClick={go('menu')} aria-current={activeTop === 'menu' ? 'true' : undefined}>Menu</a>
        <a href="#livraison" className="hide-m" onClick={go('livraison')} aria-current={activeTop === 'livraison' ? 'true' : undefined}>Livraison</a>
        <a href="#contact" className="hide-m" onClick={go('contact')} aria-current={activeTop === 'contact' ? 'true' : undefined}>Contact</a>
        {/* Appel direct depuis l'en-tête, comme le bouton téléphone de /classique. */}
        {phone && (
          <a className="tel" href={`tel:${phone}`} aria-label="Appeler">
            <Phone size={18} strokeWidth={2.2} aria-hidden="true" />
          </a>
        )}
        {/* Ouvre toujours le tiroir, même vide (il propose alors « Voir le menu »).
            La pastille porte le nombre d'articles. */}
        <a
          href="#panier"
          className="order"
          aria-label={cartCount > 0 ? `Votre panier, ${cartCount} article${cartCount > 1 ? 's' : ''}` : 'Votre panier, vide'}
          onClick={(e) => { e.preventDefault(); onOpenDrawer(); }}
        >
          Votre panier
          {cartCount > 0 && <span className="n" aria-hidden="true">{cartCount}</span>}
        </a>
      </nav>
    </header>
  );
}
