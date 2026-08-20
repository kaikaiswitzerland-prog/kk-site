// src/refonte/RefontePreview.jsx
//
// Page d'APERÇU montée sur /refonte, et rien d'autre. Elle existe uniquement
// pour que la grille et la structure soient regardables en local ; elle ne
// commande rien, n'écrit rien en base et ne touche pas au panier du site.
//
// Le panier ici est un simple compteur local : sur le vrai site, `onAdd` doit
// être branché sur handlePlusClick de KaiKaiApp, qui ouvre les modaux
// d'options (variantes, protéines, coulis, formules) avant d'appeler add().
// C'est le seul point de raccordement à faire au moment de l'intégration.

import { useState } from 'react';
import { useOutOfStock } from '../hooks/useOutOfStock.js';
import RefontePage from './RefontePage.jsx';

export default function RefontePreview() {
  const [cart, setCart] = useState({});
  const { items: outOfStockItems } = useOutOfStock();

  const add = (item) =>
    setCart((c) => ({ ...c, [item.id]: (c[item.id] || 0) + 1 }));

  const remove = (item) =>
    setCart((c) => {
      const next = Math.max(0, (c[item.id] || 0) - 1);
      const copy = { ...c };
      if (next === 0) delete copy[item.id];
      else copy[item.id] = next;
      return copy;
    });

  return (
    <RefontePage
      cart={cart}
      onAdd={add}
      onRemove={remove}
      outOfStockItems={outOfStockItems}
    />
  );
}
