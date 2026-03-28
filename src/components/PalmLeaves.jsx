import React, { useEffect, useState, useRef } from 'react';
import { useIslandMode } from '../context/IslandModeContext';

// ─── SVG LEAF DEFINITIONS ───────────────────────────────────────────────────
// Each leaf is a precise botanical SVG matching the KaïKaï flyer aesthetic:
// dark jungle greens, detailed nervures, realistic proportions.

// Feuille monstera (bas gauche) — grande feuille avec découpures caractéristiques
const MonsteraLeaf = () => (
  <svg viewBox="0 0 320 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
    <defs>
      <radialGradient id="mg1" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#3a6a25"/>
        <stop offset="50%" stopColor="#2a5018"/>
        <stop offset="100%" stopColor="#0d1f0d"/>
      </radialGradient>
      <radialGradient id="mg2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#4a7a30"/>
        <stop offset="100%" stopColor="#1a3a10"/>
      </radialGradient>
    </defs>
    {/* Corps principal de la feuille monstera */}
    <path d="M 60,280 C 40,250 20,200 30,150 C 40,100 70,60 110,40 C 150,20 200,25 240,50 C 280,75 300,120 290,165 C 280,210 250,240 210,255 C 185,265 160,260 140,248 C 160,235 175,215 170,195 C 165,175 145,168 125,175 C 105,182 95,200 100,220 C 90,230 75,255 60,280 Z" fill="url(#mg1)"/>
    {/* Découpure 1 — côté droit haut */}
    <path d="M 200,80 C 215,90 225,110 220,130 C 215,150 200,160 185,155 C 195,140 200,120 195,105 C 192,95 196,85 200,80 Z" fill="#0a1a08"/>
    {/* Découpure 2 — côté droit bas */}
    <path d="M 230,160 C 250,170 260,195 250,215 C 240,235 220,242 205,235 C 220,222 228,202 222,185 C 218,172 222,163 230,160 Z" fill="#0a1a08"/>
    {/* Découpure 3 — bas gauche */}
    <path d="M 110,220 C 95,215 85,200 90,185 C 95,170 110,165 122,172 C 112,180 108,195 114,208 C 118,218 116,222 110,220 Z" fill="#0a1a08"/>
    {/* Nervure centrale */}
    <path d="M 60,280 C 80,240 110,190 150,150 C 190,110 230,80 260,60" stroke="#1a3a10" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
    {/* Nervures secondaires */}
    <path d="M 100,230 C 120,210 145,200 170,195" stroke="#1a3a10" strokeWidth="1.5" opacity="0.4"/>
    <path d="M 130,190 C 155,175 180,170 205,175" stroke="#1a3a10" strokeWidth="1.5" opacity="0.4"/>
    <path d="M 160,155 C 185,145 210,140 235,145" stroke="#1a3a10" strokeWidth="1.5" opacity="0.4"/>
    <path d="M 185,120 C 205,112 225,110 245,115" stroke="#1a3a10" strokeWidth="1.5" opacity="0.4"/>
    {/* Reflet lumineux */}
    <path d="M 80,240 C 100,200 140,160 180,130" stroke="#5a8a40" strokeWidth="2" opacity="0.25" strokeLinecap="round"/>
  </svg>
);

// Feuilles palmier effilées (milieu droite) — folioles longues sur tige arquée
const PalmFrond = ({ flip = false }) => (
  <svg viewBox="0 0 380 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%', transform: flip ? 'scaleX(-1)' : 'none'}}>
    <defs>
      <linearGradient id="pf1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8aaa20"/>
        <stop offset="40%" stopColor="#5a7a15"/>
        <stop offset="100%" stopColor="#2a4a08"/>
      </linearGradient>
      <linearGradient id="pf2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6a8a18"/>
        <stop offset="100%" stopColor="#1a3008"/>
      </linearGradient>
    </defs>
    {/* Tige principale arquée */}
    <path d="M 20,20 C 80,40 160,80 260,200 C 300,248 340,270 370,275" stroke="#3a5010" strokeWidth="4" strokeLinecap="round" fill="none"/>
    {/* Folioles gauches — de la base vers le bout */}
    <path d="M 45,32 C 30,10 15,0 5,5 C 15,15 25,28 35,42 Z" fill="url(#pf1)"/>
    <path d="M 75,50 C 55,25 38,15 28,18 C 40,28 52,42 62,58 Z" fill="url(#pf1)"/>
    <path d="M 108,72 C 85,45 68,35 58,38 C 70,48 84,64 96,80 Z" fill="url(#pf1)"/>
    <path d="M 142,98 C 118,70 100,60 90,63 C 103,73 118,90 130,108 Z" fill="url(#pf2)"/>
    <path d="M 178,130 C 152,102 133,92 123,95 C 136,106 152,124 163,142 Z" fill="url(#pf2)"/>
    <path d="M 215,165 C 188,138 168,128 158,132 C 172,143 188,162 199,180 Z" fill="url(#pf2)"/>
    <path d="M 252,200 C 225,174 205,164 195,168 C 209,180 225,198 236,216 Z" fill="url(#pf2)"/>
    {/* Folioles droites */}
    <path d="M 55,40 C 62,15 72,5 80,8 C 72,20 65,34 60,50 Z" fill="url(#pf1)"/>
    <path d="M 88,60 C 96,33 108,22 116,25 C 107,38 100,53 94,70 Z" fill="url(#pf1)"/>
    <path d="M 122,84 C 132,56 144,45 152,48 C 143,62 136,78 130,95 Z" fill="url(#pf2)"/>
    <path d="M 158,112 C 168,83 182,72 190,75 C 180,89 173,106 167,123 Z" fill="url(#pf2)"/>
    <path d="M 195,145 C 206,116 220,105 228,108 C 218,122 210,140 204,157 Z" fill="url(#pf2)"/>
    <path d="M 233,180 C 244,152 258,141 266,144 C 256,158 248,176 242,193 Z" fill="url(#pf2)"/>
  </svg>
);

// Feuilles bananier allongées (haut gauche/droite)
const BananaLeaves = ({ flip = false }) => (
  <svg viewBox="0 0 300 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%', transform: flip ? 'scaleX(-1)' : 'none'}}>
    <defs>
      <linearGradient id="bl1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0d1f0d"/>
        <stop offset="30%" stopColor="#1a3a1a"/>
        <stop offset="70%" stopColor="#2a5a20"/>
        <stop offset="100%" stopColor="#1a3a1a"/>
      </linearGradient>
      <linearGradient id="bl2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0a1808"/>
        <stop offset="40%" stopColor="#1a3a15"/>
        <stop offset="100%" stopColor="#0d2008"/>
      </linearGradient>
      <linearGradient id="bl3" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#162a12"/>
        <stop offset="50%" stopColor="#3a6a28"/>
        <stop offset="100%" stopColor="#1a3a15"/>
      </linearGradient>
    </defs>
    {/* Feuille 1 — grande, légèrement inclinée */}
    <path d="M 10,40 C 30,35 80,30 130,32 C 180,34 240,38 290,45 C 240,52 180,56 130,54 C 80,52 30,48 10,40 Z" fill="url(#bl1)" transform="rotate(-8, 150, 40)"/>
    {/* Nervure centrale feuille 1 */}
    <path d="M 10,40 C 100,38 200,40 290,45" stroke="#4a7a35" strokeWidth="1.5" opacity="0.5" transform="rotate(-8, 150, 40)"/>

    {/* Feuille 2 — plus petite, dessus */}
    <path d="M 5,15 C 25,10 70,8 115,10 C 160,12 210,15 255,20 C 210,25 160,27 115,25 C 70,23 25,20 5,15 Z" fill="url(#bl2)" transform="rotate(-15, 130, 15)"/>
    <path d="M 5,15 C 85,13 175,15 255,20" stroke="#2a5020" strokeWidth="1" opacity="0.4" transform="rotate(-15, 130, 15)"/>

    {/* Feuille 3 — en dessous, plus large */}
    <path d="M 15,80 C 40,72 100,68 165,70 C 230,72 280,78 300,85 C 275,92 220,96 155,94 C 90,92 40,88 15,80 Z" fill="url(#bl3)" transform="rotate(-3, 155, 80)"/>
    <path d="M 15,80 C 105,76 205,78 300,85" stroke="#3a6028" strokeWidth="1.5" opacity="0.4" transform="rotate(-3, 155, 80)"/>

    {/* Feuille 4 — la plus basse */}
    <path d="M 20,115 C 50,108 110,105 175,107 C 240,109 285,114 295,120 C 268,126 215,129 150,127 C 85,125 42,120 20,115 Z" fill="url(#bl2)" transform="rotate(5, 155, 115)"/>
  </svg>
);

// Feuilles larges pointues (milieu gauche)
const BroadLeaves = ({ flip = false }) => (
  <svg viewBox="0 0 280 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%', transform: flip ? 'scaleX(-1)' : 'none'}}>
    <defs>
      <radialGradient id="brl1" cx="30%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#3a6a28"/>
        <stop offset="60%" stopColor="#2a5020"/>
        <stop offset="100%" stopColor="#0d1f0d"/>
      </radialGradient>
      <radialGradient id="brl2" cx="30%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#2a5820"/>
        <stop offset="100%" stopColor="#0a1808"/>
      </radialGradient>
    </defs>
    {/* Feuille principale large */}
    <path d="M 10,160 C 10,100 40,50 90,25 C 115,12 145,10 165,20 C 155,50 130,75 120,105 C 110,135 120,160 140,175 C 115,195 80,205 50,200 C 30,195 15,180 10,160 Z" fill="url(#brl1)"/>
    {/* Nervures */}
    <path d="M 10,160 C 50,130 90,100 130,80" stroke="#4a7a35" strokeWidth="2" opacity="0.5" strokeLinecap="round"/>
    <path d="M 25,175 C 60,155 95,140 125,130" stroke="#3a6028" strokeWidth="1.5" opacity="0.4" strokeLinecap="round"/>
    <path d="M 20,145 C 55,128 88,115 115,105" stroke="#3a6028" strokeWidth="1" opacity="0.35" strokeLinecap="round"/>

    {/* Feuille deuxième */}
    <path d="M 60,310 C 50,260 70,200 110,160 C 135,138 165,128 180,138 C 168,165 148,185 145,210 C 142,235 158,252 175,260 C 148,282 115,295 90,292 C 74,290 64,300 60,310 Z" fill="url(#brl2)"/>
    <path d="M 60,310 C 80,270 115,230 148,200" stroke="#2a5020" strokeWidth="2" opacity="0.45" strokeLinecap="round"/>

    {/* Feuille troisième — petite, en haut */}
    <path d="M 90,60 C 100,30 130,10 160,5 C 175,2 190,8 195,20 C 180,35 162,45 150,60 C 138,75 138,92 145,105 C 125,108 105,100 95,85 C 90,76 89,68 90,60 Z" fill="url(#brl1)" opacity="0.85"/>
    <path d="M 90,60 C 118,42 148,28 180,18" stroke="#4a7a35" strokeWidth="1.5" opacity="0.4" strokeLinecap="round"/>
  </svg>
);

// ─── COMPOSANT PRINCIPAL ────────────────────────────────────────────────────
export default function PalmLeaves() {
  const { islandMode } = useIslandMode();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef(null);

  // Gestion apparition/disparition
  useEffect(() => {
    if (islandMode) {
      setTimeout(() => setVisible(true), 50);
    } else {
      setVisible(false);
    }
  }, [islandMode]);

  // Animation scroll
  useEffect(() => {
    if (!islandMode) return;
    const handleScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const p = Math.min(window.scrollY / maxScroll, 1);
      setScrollProgress(p);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [islandMode]);

  if (!islandMode && !visible) return null;

  const scrollTransition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

  // Styles des 6 groupes de feuilles
  const groups = [
    // Haut gauche — bananier
    {
      key: 'top-left',
      leaf: <BananaLeaves />,
      baseStyle: {
        position: 'fixed', top: '-30px', left: '-20px',
        width: '320px', zIndex: 0, pointerEvents: 'none',
      },
      enterTranslate: '-80px, -40px',
      scrollTransform: `rotate(${scrollProgress * 6}deg) translateY(${scrollProgress * 15}px)`,
    },
    // Milieu gauche — feuilles larges
    {
      key: 'mid-left',
      leaf: <BroadLeaves />,
      baseStyle: {
        position: 'fixed', top: '30%', left: '-50px',
        width: '260px', zIndex: 0, pointerEvents: 'none',
      },
      enterTranslate: '-100px, 0px',
      scrollTransform: `rotate(${scrollProgress * 8}deg) translateY(${scrollProgress * -20}px)`,
    },
    // Bas gauche — monstera
    {
      key: 'bot-left',
      leaf: <MonsteraLeaf />,
      baseStyle: {
        position: 'fixed', bottom: '0px', left: '-30px',
        width: '280px', zIndex: 0, pointerEvents: 'none',
      },
      enterTranslate: '-80px, 60px',
      scrollTransform: `rotate(${scrollProgress * -5}deg) translateY(${scrollProgress * -25}px)`,
    },
    // Haut droite — bananier flippé
    {
      key: 'top-right',
      leaf: <BananaLeaves flip />,
      baseStyle: {
        position: 'fixed', top: '-20px', right: '-20px',
        width: '300px', zIndex: 0, pointerEvents: 'none',
      },
      enterTranslate: '80px, -40px',
      scrollTransform: `rotate(${scrollProgress * -6}deg) translateY(${scrollProgress * 15}px)`,
    },
    // Milieu droite — palmier effilé
    {
      key: 'mid-right',
      leaf: <PalmFrond flip />,
      baseStyle: {
        position: 'fixed', top: '25%', right: '-40px',
        width: '320px', zIndex: 0, pointerEvents: 'none',
      },
      enterTranslate: '100px, 0px',
      scrollTransform: `rotate(${scrollProgress * -8}deg) translateY(${scrollProgress * -20}px)`,
    },
    // Bas droite — palmier courbé
    {
      key: 'bot-right',
      leaf: <PalmFrond />,
      baseStyle: {
        position: 'fixed', bottom: '2%', right: '-30px',
        width: '300px', zIndex: 0, pointerEvents: 'none',
      },
      enterTranslate: '80px, 60px',
      scrollTransform: `rotate(${20 + scrollProgress * -5}deg) translateY(${scrollProgress * -25}px)`,
    },
  ];

  return (
    <>
      {groups.map((g, i) => (
        <div
          key={g.key}
          style={{
            ...g.baseStyle,
            opacity: visible ? 0.92 : 0,
            transform: visible
              ? g.scrollTransform
              : `translate(${g.enterTranslate})`,
            transition: visible
              ? `opacity 0.8s ease ${i * 80}ms, ${scrollTransition}`
              : `opacity 0.5s ease, transform 0.5s ease`,
            filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.6))',
          }}
        >
          {g.leaf}
        </div>
      ))}
    </>
  );
}
