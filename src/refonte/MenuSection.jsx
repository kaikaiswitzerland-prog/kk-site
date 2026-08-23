// src/refonte/MenuSection.jsx
//
// Un bloc de carte : en-tête de section (kicker or + titre serif) puis la
// grille produits 2 colonnes. `children` est rendu pleine largeur SOUS la
// grille — c'est par là qu'arrive le composeur de wok existant.

import ProductCard from './ProductCard.jsx';

export default function MenuSection({
  id,
  kicker,
  title,
  note,
  items = [],
  cart = {},
  onAdd,
  onRemove,
  isOut = () => false,
  priceFrom = () => false,
  children,
}) {
  return (
    <section id={id} className="rf-section rf-shell" aria-labelledby={`${id}-title`}>
      <header>
        {kicker && <span className="rf-section__kicker">{kicker}</span>}
        <h2 id={`${id}-title`} className="rf-section__title">{title}</h2>
        {note && <p className="rf-section__note">{note}</p>}
        <div className="rf-section__rule" />
      </header>

      {items.length > 0 && (
        <div className="rf-grid">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              qty={cart[item.id] || 0}
              onAdd={onAdd}
              onRemove={onRemove}
              outOfStock={isOut(item)}
              priceFrom={priceFrom(item)}
            />
          ))}
        </div>
      )}

      {children}
    </section>
  );
}
