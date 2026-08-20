// src/refonte/RefontePage.jsx
//
// STRUCTURE DE PAGE de la refonte :
//
//   1. Hero            → <HeroSlot /> — emplacement réservé, vide (hors périmètre)
//   2. Carte en grille → <MenuSection /> × 6, grille produits 2 colonnes
//   3. Composeur wok   → <WokComposer /> importé de App.jsx, à l'identique
//   4. Footer          → <Footer />
//
// Composant PRÉSENTATIONNEL : aucun état panier, aucun appel réseau. Tout
// arrive en props, ce qui permet de le monter aussi bien sur la page d'aperçu
// (/refonte) que, plus tard, à l'intérieur de KaiKaiApp avec ses vrais
// handlers add/remove et ses modaux d'options.

import { menuCatalog, WokComposer } from '../App.jsx';

import HeroSlot from './HeroSlot.jsx';
import MenuSection from './MenuSection.jsx';
import Footer from './Footer.jsx';
import './refonte.css';

// L'ordre d'affichage de la carte. Les bases du wok n'y figurent pas : elles
// ne se vendent que via le composeur, comme aujourd'hui.
const { sections, isUnavailable } = menuCatalog;

const SECTIONS = [
  { id: 'rf-entrees',  kicker: 'Pour commencer', title: 'Entrées',      items: sections.entrees },
  { id: 'rf-chaud',    kicker: 'Au wok',         title: 'Plats chauds', items: sections.chaud },
  { id: 'rf-froid',    kicker: 'Poisson cru',    title: 'Plats froids', items: sections.froid },
  { id: 'rf-formules', kicker: 'À partager',     title: 'Formules',     items: sections.formules },
  { id: 'rf-desserts', kicker: 'Pour finir',     title: 'Desserts',     items: sections.desserts },
  { id: 'rf-boissons', kicker: 'À côté',         title: 'Boissons',     items: sections.boissons },
];

export default function RefontePage({
  cart = {},
  onAdd,
  onRemove,
  outOfStockItems = [],
  onShowZones,
  hero = null,
}) {
  const isOut = (item) => isUnavailable(outOfStockItems, item);

  return (
    <div className="rf-root">
      {/* 1 — Hero : volontairement vide pour l'instant. */}
      <HeroSlot>{hero}</HeroSlot>

      {/* 2 — La carte en grille. */}
      <main>
        {SECTIONS.map((s) => (
          <MenuSection
            key={s.id}
            id={s.id}
            kicker={s.kicker}
            title={s.title}
            items={s.items}
            cart={cart}
            onAdd={onAdd}
            onRemove={onRemove}
            isOut={isOut}
          />
        ))}

        {/* 3 — Le composeur de wok EXISTANT, sans modification. Il est encore
            au vocabulaire visuel de l'ancien site (blanc translucide) : sa mise
            au thème noir/or n'est pas dans cette passe. Le wrapper `rf-grid`
            lui fournit le contexte grid dont dépend son `col-span-full`. */}
        <MenuSection
          id="rf-wok"
          kicker="Sur mesure"
          title="Compose ton wok"
          note="Votre base, vos légumes, votre garniture — le prix s'ajuste à votre composition."
        >
          <div className="rf-grid rf-wok-slot">
            <WokComposer
              bases={sections.wok}
              cart={cart}
              add={(id, variant) => onAdd?.({ id }, variant)}
              stockList={outOfStockItems}
              outOfStockFor={isOut}
            />
          </div>
        </MenuSection>
      </main>

      {/* 4 — Footer. */}
      <Footer onShowZones={onShowZones} />
    </div>
  );
}
