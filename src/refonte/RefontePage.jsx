// src/refonte/RefontePage.jsx
//
// STRUCTURE DE PAGE de la refonte :
//
//   1. Hero            → <HeroSlot /> — hero vidéo scrubbé au scroll
//   2. Carte en grille → <MenuSection /> × 6, grille produits 2 colonnes
//   3. Composeur wok   → passé en prop, instancié par KaiKaiApp
//   4. Footer          → <Footer />
//
// Composant PRÉSENTATIONNEL strict : aucun état panier, aucun appel réseau,
// aucun import d'App.jsx. Le + d'une carte appelle onAdd(item), qui remonte
// jusqu'au même dispatch de modaux d'options que le site actuel.

import HeroSlot from './HeroSlot.jsx';
import MenuSection from './MenuSection.jsx';
import Footer from './Footer.jsx';

// Libellés de section. L'ordre et le contenu des listes viennent de
// `sections`, dérivé de MENU dans App.jsx — jamais recopié ici.
const SECTION_META = [
  { key: 'entrees',  id: 'rf-entrees',  kicker: 'Pour commencer', title: 'Entrées' },
  { key: 'chaud',    id: 'rf-chaud',    kicker: 'Au wok',         title: 'Plats chauds' },
  { key: 'froid',    id: 'rf-froid',    kicker: 'Poisson cru',    title: 'Plats froids' },
  { key: 'formules', id: 'rf-formules', kicker: 'À partager',     title: 'Formules' },
  { key: 'desserts', id: 'rf-desserts', kicker: 'Pour finir',     title: 'Desserts' },
  { key: 'boissons', id: 'rf-boissons', kicker: 'À côté',         title: 'Boissons' },
];

export default function RefontePage({
  sections = {},
  wokComposer = null,
  cart = {},
  onAdd,
  onRemove,
  isUnavailable = () => false,
  onShowZones,
  onShowAllergens,
  restaurant,
  hero = null,
}) {
  return (
    <>
      {/* 1 — Hero vidéo scrubbé (voir HeroScrub.jsx). */}
      <HeroSlot>{hero}</HeroSlot>

      {/* 2 — La carte en grille. */}
      <main>
        {SECTION_META.map((s) => (
          <MenuSection
            key={s.key}
            id={s.id}
            kicker={s.kicker}
            title={s.title}
            items={sections[s.key] || []}
            cart={cart}
            onAdd={onAdd}
            onRemove={onRemove}
            isOut={isUnavailable}
          />
        ))}

        {/* 3 — Le composeur de wok EXISTANT, instancié par KaiKaiApp et passé
            tel quel. Le wrapper `rf-grid` lui fournit le contexte grid dont
            dépend son `col-span-full`. */}
        {wokComposer && (
          <MenuSection
            id="rf-wok"
            kicker="Sur mesure"
            title="Compose ton wok"
            note="Votre base, vos légumes, votre garniture — le prix s'ajuste à votre composition."
          >
            <div className="rf-grid rf-wok-slot">{wokComposer}</div>
          </MenuSection>
        )}
      </main>

      {/* 4 — Footer. */}
      <Footer
        onShowZones={onShowZones}
        onShowAllergens={onShowAllergens}
        restaurant={restaurant}
      />
    </>
  );
}
