import React, { useEffect, useState } from 'react';
import { useIslandMode } from '../context/IslandModeContext';

export default function PalmLeaves() {
  const { islandMode } = useIslandMode();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (!islandMode) { setScrollProgress(0); return; }
    const handleScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      setScrollProgress(Math.min(window.scrollY / max, 1));
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [islandMode]);

  const base = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 1,
    opacity: islandMode ? 1 : 0,
    transition: 'opacity 1s ease',
  };

  const shift = scrollProgress * 30;

  return (
    <>
      {/* Feuille gauche haut */}
      <img src="/Flyer (officiel)-5.png" alt="" style={{
        ...base,
        top: -60 - shift,
        left: -120,
        width: '340px',
        transform: 'rotate(-15deg)',
        objectFit: 'cover',
        objectPosition: 'left top',
        maskImage: 'radial-gradient(ellipse at left top, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at left top, black 30%, transparent 75%)',
      }} />

      {/* Feuille droite haut */}
      <img src="/Flyer (officiel)-5.png" alt="" style={{
        ...base,
        top: -40 - shift,
        right: -120,
        width: '320px',
        transform: 'rotate(20deg) scaleX(-1)',
        objectFit: 'cover',
        objectPosition: 'right top',
        maskImage: 'radial-gradient(ellipse at right top, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at right top, black 30%, transparent 75%)',
      }} />

      {/* Feuille gauche bas */}
      <img src="/Flyer (officiel)-5.png" alt="" style={{
        ...base,
        bottom: -40 + shift * 0.5,
        left: -100,
        width: '280px',
        transform: 'rotate(10deg)',
        objectFit: 'cover',
        objectPosition: 'left bottom',
        maskImage: 'radial-gradient(ellipse at left bottom, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at left bottom, black 30%, transparent 75%)',
      }} />

      {/* Feuille droite bas */}
      <img src="/Flyer (officiel)-5.png" alt="" style={{
        ...base,
        bottom: -30 + shift * 0.5,
        right: -100,
        width: '260px',
        transform: 'rotate(-12deg) scaleX(-1)',
        objectFit: 'cover',
        objectPosition: 'right bottom',
        maskImage: 'radial-gradient(ellipse at right bottom, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at right bottom, black 30%, transparent 75%)',
      }} />
    </>
  );
}
