// src/components/PalmLeaves.jsx — Feuilles de palmier botaniques (Mode Île)
//
// Rendu : 4 feuilles SVG en position fixed, z-index -1, derrière tout le contenu.
//   - Deux feuilles à gauche, deux à droite (côtés opposés de l'écran)
//   - Style botanique sombre : nervures apparentes, dégradés verts profonds
//   - Animées au scroll (rotation ±8deg, translateY ±30px)
//
// Apparition (Mode Île ON)  : opacity 0→1 + translateX ±120px→0 en 0.8s ease
// Disparition (Mode Île OFF): inverse, puis démontage après 900ms

import React, { useEffect, useRef, useState } from 'react';
import { useIslandMode } from '../context/IslandModeContext';

// ── Une fronde de palmier SVG détaillée ─────────────────────────────────────
// leafId : string unique pour les defs (évite les conflits dans le DOM)
// flip   : booléen — miroir horizontal pour le côté droit
function PalmFrond({ leafId, flip }) {
  // Points de la tige le long de laquelle les folioles sont placées
  // Format: [t, x, y] où t = paramètre 0→1 le long de la courbe
  const folioles = [
    { t: 0.15, leftAngle: -70, rightAngle: 40,  len: 55, spread: 18 },
    { t: 0.25, leftAngle: -68, rightAngle: 38,  len: 72, spread: 22 },
    { t: 0.35, leftAngle: -65, rightAngle: 35,  len: 85, spread: 26 },
    { t: 0.45, leftAngle: -62, rightAngle: 33,  len: 92, spread: 28 },
    { t: 0.55, leftAngle: -60, rightAngle: 30,  len: 88, spread: 26 },
    { t: 0.65, leftAngle: -58, rightAngle: 28,  len: 78, spread: 22 },
    { t: 0.75, leftAngle: -55, rightAngle: 26,  len: 62, spread: 18 },
    { t: 0.85, leftAngle: -52, rightAngle: 24,  len: 42, spread: 12 },
    { t: 0.93, leftAngle: -48, rightAngle: 22,  len: 24, spread: 8  },
  ];

  // Courbe de Bézier cubique de la tige (de bas en haut)
  // P0 = (60, 380), P1 = (58, 260), P2 = (45, 140), P3 = (30, 10)
  const stem = { x0: 60, y0: 380, x1: 58, y1: 260, x2: 45, y2: 140, x3: 30, y3: 10 };

  // Calcule un point sur la courbe de Bézier cubique
  const bezier = (t) => {
    const mt = 1 - t;
    return {
      x: mt**3 * stem.x0 + 3*mt**2*t * stem.x1 + 3*mt*t**2 * stem.x2 + t**3 * stem.x3,
      y: mt**3 * stem.y0 + 3*mt**2*t * stem.y1 + 3*mt*t**2 * stem.y2 + t**3 * stem.y3,
    };
  };

  // Tangente normalisée à la courbe au paramètre t
  const tangent = (t) => {
    const mt = 1 - t;
    const dx = -3*mt**2 * stem.x0 + 3*(mt**2 - 2*mt*t) * stem.x1 + 3*(2*mt*t - t**2) * stem.x2 + 3*t**2 * stem.x3;
    const dy = -3*mt**2 * stem.y0 + 3*(mt**2 - 2*mt*t) * stem.y1 + 3*(2*mt*t - t**2) * stem.y2 + 3*t**2 * stem.y3;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    return { x: dx / len, y: dy / len };
  };

  return (
    <svg
      viewBox="0 0 160 400"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible',
        transform: flip ? 'scaleX(-1)' : undefined,
        transformOrigin: 'center center',
      }}
    >
      <defs>
        {/* Dégradé de la tige */}
        <linearGradient id={`stemG-${leafId}`} x1="0%" y1="100%" x2="60%" y2="0%">
          <stop offset="0%"   stopColor="#0d1f0d" />
          <stop offset="50%"  stopColor="#2a5a2a" />
          <stop offset="100%" stopColor="#3a7a3a" />
        </linearGradient>

        {/* Dégradé des folioles — face supérieure */}
        <linearGradient id={`leafTop-${leafId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#1e4a1e" />
          <stop offset="60%"  stopColor="#2a5a2a" />
          <stop offset="100%" stopColor="#3a7a3a" stopOpacity="0.4" />
        </linearGradient>

        {/* Dégradé des folioles — face inférieure (plus sombre) */}
        <linearGradient id={`leafBot-${leafId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#0d1f0d" />
          <stop offset="60%"  stopColor="#1a3a1a" />
          <stop offset="100%" stopColor="#2a5a2a" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* ── Folioles ── */}
      {folioles.map(({ t, leftAngle, rightAngle, len, spread }, i) => {
        const pt  = bezier(t);
        const tan = tangent(t);
        // Angle de la tangente en degrés
        const stemAngleDeg = Math.atan2(tan.y, tan.x) * 180 / Math.PI;

        // Foliole gauche
        const leftRad  = (stemAngleDeg + leftAngle)  * Math.PI / 180;
        const leftTipX = pt.x + len * Math.cos(leftRad);
        const leftTipY = pt.y + len * Math.sin(leftRad);
        const leftMidX = pt.x + (len * 0.55) * Math.cos(leftRad) - spread * Math.sin(leftRad);
        const leftMidY = pt.y + (len * 0.55) * Math.sin(leftRad) + spread * Math.cos(leftRad);

        // Foliole droite
        const rightRad  = (stemAngleDeg + rightAngle) * Math.PI / 180;
        const rightTipX = pt.x + len * Math.cos(rightRad);
        const rightTipY = pt.y + len * Math.sin(rightRad);
        const rightMidX = pt.x + (len * 0.55) * Math.cos(rightRad) + spread * Math.sin(rightRad);
        const rightMidY = pt.y + (len * 0.55) * Math.sin(rightRad) - spread * Math.cos(rightRad);

        return (
          <g key={i} opacity={0.75 + i * 0.015}>
            {/* Foliole gauche — forme pleine */}
            <path
              d={`M ${pt.x},${pt.y} Q ${leftMidX},${leftMidY} ${leftTipX},${leftTipY} Q ${pt.x + (len*0.3)*Math.cos(leftRad)},${pt.y + (len*0.3)*Math.sin(leftRad)} ${pt.x},${pt.y}`}
              fill={`url(#leafTop-${leafId})`}
            />
            {/* Nervure centrale gauche */}
            <line
              x1={pt.x} y1={pt.y}
              x2={leftTipX} y2={leftTipY}
              stroke="#1a3a1a"
              strokeWidth="0.8"
              opacity="0.6"
            />

            {/* Foliole droite — forme pleine */}
            <path
              d={`M ${pt.x},${pt.y} Q ${rightMidX},${rightMidY} ${rightTipX},${rightTipY} Q ${pt.x + (len*0.3)*Math.cos(rightRad)},${pt.y + (len*0.3)*Math.sin(rightRad)} ${pt.x},${pt.y}`}
              fill={`url(#leafBot-${leafId})`}
            />
            {/* Nervure centrale droite */}
            <line
              x1={pt.x} y1={pt.y}
              x2={rightTipX} y2={rightTipY}
              stroke="#1a3a1a"
              strokeWidth="0.8"
              opacity="0.6"
            />
          </g>
        );
      })}

      {/* ── Tige principale (par-dessus les folioles) ── */}
      <path
        d={`M ${stem.x0},${stem.y0} C ${stem.x1},${stem.y1} ${stem.x2},${stem.y2} ${stem.x3},${stem.y3}`}
        fill="none"
        stroke={`url(#stemG-${leafId})`}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────
export default function PalmLeaves() {
  const { islandMode } = useIslandMode();
  const [mounted,        setMounted]        = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const unmountTimerRef = useRef(null);

  // Gestion du montage/démontage avec délai pour la transition de sortie
  useEffect(() => {
    clearTimeout(unmountTimerRef.current);
    if (islandMode) {
      setMounted(true);
    } else {
      // Attendre la fin de la transition avant de démonter
      unmountTimerRef.current = setTimeout(() => setMounted(false), 900);
    }
    return () => clearTimeout(unmountTimerRef.current);
  }, [islandMode]);

  // Listener de scroll pour animer les feuilles
  useEffect(() => {
    if (!mounted) return;
    const handleScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      setScrollProgress(Math.min(window.scrollY / maxScroll, 1));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  if (!mounted) return null;

  // Amplitudes d'animation au scroll
  const rotAmp   = scrollProgress * 8;   // ±8deg
  const transAmp = scrollProgress * 30;  // ±30px (translateY vers le haut)

  // Transition CSS partagée
  const transition = 'opacity 0.8s ease, transform 0.8s ease';

  // Définition des 4 feuilles
  const leaves = [
    {
      // Gauche haut — grande fronde principale
      style: {
        top:    '-40px',
        left:   '-50px',
        width:  '220px',
        height: '400px',
        opacity:   islandMode ? 0.88 : 0,
        transform: islandMode
          ? `rotate(${-18 + rotAmp}deg) translateY(${-transAmp}px)`
          : 'rotate(-18deg) translateX(-120px)',
        transformOrigin: 'bottom left',
        transition,
      },
      leafId: 'a',
      flip:   false,
    },
    {
      // Gauche bas — fronde secondaire légèrement décalée
      style: {
        top:    '80px',
        left:   '-25px',
        width:  '170px',
        height: '320px',
        opacity:   islandMode ? 0.65 : 0,
        transform: islandMode
          ? `rotate(${-32 + rotAmp * 0.7}deg) translateY(${-transAmp * 0.8}px)`
          : 'rotate(-32deg) translateX(-120px)',
        transformOrigin: 'bottom left',
        transition: `opacity 0.8s ease 0.08s, transform 0.8s ease 0.08s`,
      },
      leafId: 'b',
      flip:   false,
    },
    {
      // Droite haut — miroir de gauche haut
      style: {
        top:    '-40px',
        right:  '-50px',
        width:  '220px',
        height: '400px',
        opacity:   islandMode ? 0.88 : 0,
        transform: islandMode
          ? `rotate(${18 - rotAmp}deg) translateY(${-transAmp}px)`
          : 'rotate(18deg) translateX(120px)',
        transformOrigin: 'bottom right',
        transition,
      },
      leafId: 'c',
      flip:   true,
    },
    {
      // Droite bas — miroir de gauche bas
      style: {
        top:    '80px',
        right:  '-25px',
        width:  '170px',
        height: '320px',
        opacity:   islandMode ? 0.65 : 0,
        transform: islandMode
          ? `rotate(${32 - rotAmp * 0.7}deg) translateY(${-transAmp * 0.8}px)`
          : 'rotate(32deg) translateX(120px)',
        transformOrigin: 'bottom right',
        transition: `opacity 0.8s ease 0.08s, transform 0.8s ease 0.08s`,
      },
      leafId: 'd',
      flip:   true,
    },
  ];

  return (
    <>
      {leaves.map(leaf => (
        <div
          key={leaf.leafId}
          style={{
            position: 'fixed',
            zIndex: -1,
            pointerEvents: 'none',
            ...leaf.style,
          }}
        >
          <PalmFrond leafId={leaf.leafId} flip={leaf.flip} />
        </div>
      ))}
    </>
  );
}
