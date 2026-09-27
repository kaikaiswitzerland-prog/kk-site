// src/accueil-v2/useScrollSpy.js
//
// Portage du script de fin de page du HTML fourni : ombre du header au
// défilement, chip de catégorie courante, lien de navigation courant, et
// recentrage automatique de la chip active dans sa barre.
//
// Tout est lu dans le DOM au scroll (passif) — aucun état de panier ici.

import { useEffect, useState } from 'react';

const TOP_IDS = ['menu', 'livraison', 'contact'];

function topOf(el) {
  return el.getBoundingClientRect().top + window.scrollY;
}

export function useScrollSpy(chipIds, { headerRef, chipsRef }) {
  const [scrolled, setScrolled] = useState(false);
  const [activeChip, setActiveChip] = useState(null);
  const [activeTop, setActiveTop] = useState(null);

  useEffect(() => {
    let raf = 0;
    const mesure = () => {
      raf = 0;
      setScrolled(window.scrollY > 4);
      const header = headerRef.current;
      const chipsBar = chipsRef.current;
      const line = window.scrollY + (header?.offsetHeight || 0) + (chipsBar?.offsetHeight || 0) + 40;

      let cur = null;
      chipIds.forEach((id) => {
        const t = document.getElementById(id);
        if (t && topOf(t) <= line) cur = id;
      });
      const menu = document.getElementById('menu');
      const livraison = document.getElementById('livraison');
      const inMenu = !!menu && !!livraison && topOf(menu) <= line && topOf(livraison) > line;
      setActiveChip(inMenu ? cur : null);

      let topCur = null;
      TOP_IDS.forEach((id) => {
        const t = document.getElementById(id);
        if (t && topOf(t) <= line) topCur = id;
      });
      setActiveTop(topCur);

      if (inMenu && cur && chipsBar) {
        const a = chipsBar.querySelector(`a[href="#${cur}"]`);
        const w = chipsBar.querySelector('.wrap');
        if (a && w) {
          const L = a.offsetLeft - w.clientWidth / 2 + a.offsetWidth / 2;
          if (Math.abs(w.scrollLeft - L) > 40) w.scrollTo({ left: L, behavior: 'smooth' });
        }
      }
    };
    const planifier = () => {
      if (raf) return;
      raf = requestAnimationFrame(mesure);
    };
    window.addEventListener('scroll', planifier, { passive: true });
    window.addEventListener('resize', planifier);
    mesure();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', planifier);
      window.removeEventListener('resize', planifier);
    };
  }, [chipIds, headerRef, chipsRef]);

  return { scrolled, activeChip, activeTop };
}

// Défilement doux vers une ancre. `scroll-margin-top` (accueil-v2.css) tient
// compte de la barre de menu et des chips collantes.
export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
