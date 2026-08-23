// src/refonte/HeroSlot.jsx
//
// Emplacement du hero. Il porte désormais le hero vidéo scrubbé
// (<HeroScrub />) ; `children` reste l'échappatoire pour lui substituer autre
// chose sans toucher à RefontePage. Rien d'autre dans la page ne dépend de ce
// bloc : la carte, le composeur et le footer suivent, quel que soit le hero.

import HeroScrub from './HeroScrub.jsx';

export default function HeroSlot({ children }) {
  return (
    <section id="rf-hero" className="rf-hero" aria-label="Hero">
      {children || <HeroScrub />}
    </section>
  );
}
