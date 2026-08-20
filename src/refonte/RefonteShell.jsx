// src/refonte/RefonteShell.jsx
//
// Enveloppe de la refonte : header sticky + contenu de page + modale
// allergènes. C'est le SEUL point d'entrée que KaiKaiApp monte quand
// skin="refonte".
//
// ⚠ Rien dans src/refonte/ n'importe App.jsx : c'est App.jsx qui importe ce
// shell (en lazy) et lui passe tout — panier, handlers, ruptures, statut
// d'ouverture, composeur de wok déjà instancié. Sans cette règle on aurait un
// cycle d'imports, et surtout la couche présentation se remettrait à
// connaître la logique de commande, ce qu'on veut éviter : elle vit dans
// KaiKaiApp, une seule fois, pour le site actuel comme pour la refonte.

import { useState } from 'react';
import RefonteHeader from './RefonteHeader.jsx';
import RefontePage from './RefontePage.jsx';
import AllergensMatrix from './AllergensMatrix.jsx';
import './refonte.css';

export default function RefonteShell({
  // Présentation
  showContent = true,
  sections,
  wokComposer,
  // Panier (tout vient de KaiKaiApp)
  cart,
  cartCount = 0,
  onAdd,
  onRemove,
  isUnavailable,
  onOpenCheckout,
  // Ouverture / horaires
  restaurantOpen,
  manualClosure,
  openStatusLabel,
  // Divers
  onShowZones,
  onShowAbout,
  restaurant,
}) {
  const [showAllergens, setShowAllergens] = useState(false);
  const openAllergens = () => setShowAllergens(true);

  return (
    <div className="rf-root">
      <RefonteHeader
        restaurantOpen={restaurantOpen}
        manualClosure={manualClosure}
        openStatusLabel={openStatusLabel}
        cartCount={cartCount}
        onOpenCheckout={onOpenCheckout}
        onShowAllergens={openAllergens}
        onShowAbout={onShowAbout}
        phone={restaurant?.phone}
      />

      {showContent && (
        <RefontePage
          sections={sections}
          wokComposer={wokComposer}
          cart={cart}
          onAdd={onAdd}
          onRemove={onRemove}
          isUnavailable={isUnavailable}
          onShowZones={onShowZones}
          onShowAllergens={openAllergens}
          restaurant={restaurant}
        />
      )}

      {showAllergens && (
        <AllergensMatrix
          onClose={() => setShowAllergens(false)}
          phone={restaurant?.phone}
          phoneDisplay={restaurant?.phoneDisplay}
        />
      )}
    </div>
  );
}
