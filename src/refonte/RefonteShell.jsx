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
  // Contenu rendu À LA PLACE de la carte quand `showContent` est faux —
  // l'écran de confirmation de commande, aujourd'hui.
  //
  // ⚠ Il est rendu DEDANS, et pas en frère du shell, parce que `.rf-root`
  // porte `min-height: 100vh` : un frère démarre donc un écran plein plus
  // bas, sous un bloc vide. C'est exactement le bug qu'avait la page de
  // confirmation — le client voyait un écran noir, le « Merci » attendait
  // 136 px sous la ligne de flottaison sans que rien n'invite à défiler.
  children,
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
        onShowAbout={onShowAbout}
        phone={restaurant?.phone}
      />

      {showContent ? (
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
      ) : (
        children
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
