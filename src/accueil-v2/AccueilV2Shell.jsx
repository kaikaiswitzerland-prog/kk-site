// src/accueil-v2/AccueilV2Shell.jsx
//
// Enveloppe de l'accueil v2 (route /v2) : barre de menu blanche, photo
// monstera, accroche avec statut réel d'ouverture, carte, composeur de woks,
// infos, pied de page, mini-panier et tiroir de commande.
//
// C'est le SEUL point d'entrée que KaiKaiApp monte quand skin="v2", en lazy,
// sur le modèle de src/refonte/RefonteShell.jsx.
//
// ⚠ Rien dans src/accueil-v2/ n'importe App.jsx : c'est App.jsx qui importe
// ce shell et lui passe tout — panier, handlers, ruptures, statut d'ouverture,
// composeur déjà instancié, catalogue (photos, prix unitaire, minimum de
// livraison), ouverture des modales partagées (allergènes, zones, à propos).
// Sans cette règle on aurait un cycle d'imports, et la couche présentation se
// remettrait à connaître la logique de commande.
//
// Le paiement reste celui du Checkout partagé : le tiroir ne fait que
// l'ouvrir.

import { useRef, useState } from 'react';
import V2Header from './V2Header.jsx';
import V2Menu from './V2Menu.jsx';
import V2Footer from './V2Footer.jsx';
import { V2Mini, V2Drawer } from './V2Drawer.jsx';
import { useScrollSpy, scrollToId } from './useScrollSpy.js';
import { CHIPS } from './v2Helpers.js';
import './accueil-v2.css';

const CHIP_IDS = CHIPS.map((c) => c.id);

export default function AccueilV2Shell({
  // Présentation
  showContent = true,
  // Rendu À LA PLACE de la carte quand `showContent` est faux (confirmation
  // de commande). Rendu DEDANS, pas en frère : `.v2-root` fait 100vh de haut.
  children,
  sections,
  wokComposer,
  catalog,
  // Panier (tout vient de KaiKaiApp)
  cart,
  cartVariants,
  items = [],
  cartCount = 0,
  subtotal = 0,
  discount = 0,
  deliveryFee = 0,
  total = 0,
  onAdd,
  onRemove,
  onRemoveAt,
  onRemoveMany,
  onAddExact,
  onClear,
  isUnavailable,
  onOpenCheckout,
  // Mode du Checkout partagé, et NPA déjà connu (saisi au Checkout) — lecture seule
  mode,
  setMode,
  deliveryNpa,
  // Ouverture / horaires
  restaurantOpen,
  manualClosure,
  openStatusLabel,
  // Mini-panier : montage retenu le temps du vol de la pastille, escamotage
  // quand la barre récap du composeur le recouvre (mesuré par KaiKaiApp).
  miniVisible = false,
  miniHidden = false,
  // Modales partagées de KaiKaiApp (les mêmes que sur /classique)
  onShowAllergens,
  onShowZones,
  onShowAbout,
  // Divers
  restaurant,
}) {
  const headerRef = useRef(null);
  const chipsRef = useRef(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { scrolled, activeChip, activeTop } = useScrollSpy(CHIP_IDS, { headerRef, chipsRef });

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  const statusTone = restaurantOpen ? '' : ' closed';
  const statusText = !restaurantOpen && manualClosure ? 'Fermé temporairement' : openStatusLabel;

  // Le mini-panier flottant ne doit rien masquer : quand il est visible, le
  // pied de page réserve sa hauteur (voir .v2-root--mini dans accueil-v2.css).
  const miniShown = showContent && miniVisible && !drawerOpen;

  return (
    <div className={`v2-root${miniShown ? ' v2-root--mini' : ''}`}>
      <a className="skip" href="#menu" onClick={(e) => { e.preventDefault(); scrollToId('menu'); }}>Aller au menu</a>

      <V2Header
        headerRef={headerRef}
        scrolled={scrolled}
        activeTop={activeTop}
        cartCount={cartCount}
        phone={restaurant?.phone}
        onOpenDrawer={openDrawer}
      />

      {showContent ? (
        <>
          <div className="hero">
            <h1 className="sr">KaïKaï — restaurant tahitien en livraison et à emporter à Genève</h1>
            <img
              src="/hero-monstera.jpg"
              width="1452"
              height="576"
              alt="Feuilles de monstera, vertes et brillantes"
              fetchPriority="high"
              decoding="async"
            />
          </div>

          <section className="intro">
            <h2>Votre restaurant tahitien en livraison sur Genève</h2>
            {/* Pastille juste sous le titre, branchée sur useRestaurantOpen
                (KaiKaiApp) : vrai statut, pas un texte fixe. Les horaires
                affichés vivent dans le footer. */}
            <div className={`status${statusTone}`} role="status">
              <i aria-hidden="true" />
              {statusText}
            </div>
            {/* Un seul bouton : « Commander en ligne » et « Voir le menu »
                menaient au même endroit. Style Nature, centré. */}
            <div className="actions">
              <a className="btn primary" href="#menu" onClick={(e) => { e.preventDefault(); scrollToId('menu'); }}>Voir le menu</a>
            </div>
          </section>

          <V2Menu
            sections={sections}
            wokComposer={wokComposer}
            cart={cart}
            isUnavailable={isUnavailable}
            catalog={catalog}
            onAdd={onAdd}
            onRemove={onRemove}
            onShowAllergens={onShowAllergens}
            onShowZones={onShowZones}
            onShowAbout={onShowAbout}
            restaurant={restaurant}
            chipsRef={chipsRef}
            activeChip={activeChip}
          />
        </>
      ) : (
        children
      )}

      <V2Footer restaurant={restaurant} onShowAbout={onShowAbout} onShowZones={onShowZones} />

      {showContent && (
        <V2Mini
          visible={miniVisible && !drawerOpen}
          hidden={miniHidden}
          cartCount={cartCount}
          items={items}
          total={total}
          mode={mode}
          restaurant={restaurant}
          restaurantOpen={restaurantOpen}
          manualClosure={manualClosure}
          openStatusLabel={openStatusLabel}
          onOpen={openDrawer}
        />
      )}

      <V2Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        items={items}
        cartVariants={cartVariants}
        catalog={catalog}
        subtotal={subtotal}
        discount={discount}
        deliveryFee={deliveryFee}
        total={total}
        mode={mode}
        setMode={setMode}
        deliveryNpa={deliveryNpa}
        restaurant={restaurant}
        restaurantOpen={restaurantOpen}
        manualClosure={manualClosure}
        openStatusLabel={openStatusLabel}
        onRemoveAt={onRemoveAt}
        onRemoveMany={onRemoveMany}
        onAddExact={onAddExact}
        onClear={onClear}
        onOpenCheckout={onOpenCheckout}
      />
    </div>
  );
}
