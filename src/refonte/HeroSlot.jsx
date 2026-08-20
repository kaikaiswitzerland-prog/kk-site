// src/refonte/HeroSlot.jsx
//
// Emplacement réservé du hero. Volontairement VIDE : le hero n'est pas dans le
// périmètre de cette passe. Il réserve la hauteur et la ligne de séparation
// pour que la suite de la page se juge dans ses vraies proportions.
//
// Le jour où le hero arrive : passer le nouveau composant en `children`, ou
// remplacer <HeroSlot /> par <HeroXxx /> dans RefontePage.jsx. Rien d'autre
// dans la page ne dépend de ce bloc.

export default function HeroSlot({ children }) {
  return (
    <section
      id="rf-hero"
      className={`rf-hero${children ? '' : ' rf-hero--empty'}`}
      aria-label="Hero"
    >
      {children || <span className="rf-hero__note">Hero — emplacement réservé</span>}
    </section>
  );
}
