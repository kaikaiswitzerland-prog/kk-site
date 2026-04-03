import React, { useEffect, useState } from 'react';
import { useIslandMode } from '../context/IslandModeContext';

export default function PalmLeaves() {
  const { islandMode } = useIslandMode();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (!islandMode) {
      setScrollProgress(0);
      return;
    }
    const handleScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      setScrollProgress(Math.min(window.scrollY / max, 1));
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [islandMode]);

  return (
    <img
      src="/Flyer (officiel)-5.png"
      alt=""
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: islandMode ? 0.45 : 0,
        transform: `scale(1.08) translateY(${-scrollProgress * 40}px)`,
        transition: 'opacity 0.8s ease',
      }}
    />
  );
}
