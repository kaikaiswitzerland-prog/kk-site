// src/components/PalmLeaves.jsx — Feuilles botaniques fidèles au flyer KaïKaï
//
// 6 groupes de feuilles en position: fixed sur les bords, z-index: 1, pointer-events: none
// Types : banana, broad, monstera, oval, palm, curved-palm

import React, { useEffect, useRef, useState } from 'react';
import { useIslandMode } from '../context/IslandModeContext';

// ── SVG : Feuilles de bananier allongées ────────────────────────────────────
function BananaSVG({ id, colors: [c0, c1, c2] }) {
  return (
    <svg viewBox="0 0 200 320" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`b1-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={c0} />
          <stop offset="45%"  stopColor={c1} />
          <stop offset="100%" stopColor={c0} stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={`b2-${id}`} x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%"   stopColor={c0} />
          <stop offset="45%"  stopColor={c2} />
          <stop offset="100%" stopColor={c1} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {/* Feuille 1 — grande, vers la gauche-haut */}
      <path
        d="M 100,295 C 80,250 35,190 10,110 C 3,70 12,28 42,12 C 72,0 105,28 115,90 C 120,140 112,215 100,295 Z"
        fill={`url(#b1-${id})`} opacity="0.92"
      />
      <path d="M 100,295 C 72,235 38,155 28,68"
        fill="none" stroke={c2} strokeWidth="1.3" opacity="0.5" />
      {/* veines secondaires gauche */}
      {[200,160,120,85].map((y, i) => (
        <line key={i} x1={105 - i*2} y1={y} x2={105 - i*2 - 30} y2={y - 10}
          stroke={c2} strokeWidth="0.7" opacity="0.28" />
      ))}

      {/* Feuille 2 — vers la droite-haut */}
      <path
        d="M 100,295 C 120,250 165,190 190,110 C 197,70 188,28 158,12 C 128,0 95,28 85,90 C 80,140 88,215 100,295 Z"
        fill={`url(#b2-${id})`} opacity="0.85"
      />
      <path d="M 100,295 C 128,235 162,155 172,68"
        fill="none" stroke={c2} strokeWidth="1.3" opacity="0.5" />
      {[200,160,120,85].map((y, i) => (
        <line key={i} x1={95 + i*2} y1={y} x2={95 + i*2 + 30} y2={y - 10}
          stroke={c2} strokeWidth="0.7" opacity="0.28" />
      ))}

      {/* Feuille 3 — centre, plus courte */}
      <path
        d="M 100,295 C 88,255 62,195 48,125 C 40,80 52,38 78,22 C 100,10 125,28 132,78 C 138,128 122,218 100,295 Z"
        fill={`url(#b1-${id})`} opacity="0.7"
      />
      <path d="M 100,295 C 85,240 65,165 60,85"
        fill="none" stroke={c2} strokeWidth="1" opacity="0.38" />
    </svg>
  );
}

// ── SVG : Feuilles larges pointues (tropical broad-leaf) ─────────────────────
function BroadSVG({ id, colors: [c0, c1, c2] }) {
  return (
    <svg viewBox="0 0 240 290" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`br1-${id}`} x1="0%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%"   stopColor={c0} />
          <stop offset="60%"  stopColor={c1} />
          <stop offset="100%" stopColor={c2} stopOpacity="0.65" />
        </linearGradient>
        <linearGradient id={`br2-${id}`} x1="100%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%"   stopColor={c0} />
          <stop offset="55%"  stopColor={c2} />
          <stop offset="100%" stopColor={c1} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {/* Feuille principale — large, nervures visibles */}
      <path
        d="M 120,270 C 70,248 12,198 5,135 C -2,75 28,22 72,8 C 108,-3 155,20 168,72 C 178,118 162,188 120,270 Z"
        fill={`url(#br1-${id})`} opacity="0.92"
      />
      {/* Nervure centrale */}
      <line x1="120" y1="270" x2="88" y2="8" stroke={c2} strokeWidth="1.6" opacity="0.52" />
      {/* Nervures secondaires gauche */}
      {[[108,215,48,185],[100,170,38,140],[93,125,38,95],[87,82,42,52]].map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c2} strokeWidth="0.85" opacity="0.32" />
      ))}
      {/* Nervures secondaires droite */}
      {[[130,215,185,188],[138,170,188,145],[144,125,185,98],[148,80,180,55]].map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c2} strokeWidth="0.85" opacity="0.32" />
      ))}

      {/* Feuille secondaire derrière */}
      <path
        d="M 120,270 C 158,245 210,192 225,130 C 238,72 215,20 175,6 C 145,-5 110,22 100,75 C 90,125 98,195 120,270 Z"
        fill={`url(#br2-${id})`} opacity="0.68"
      />
      <line x1="120" y1="270" x2="155" y2="8" stroke={c2} strokeWidth="1.2" opacity="0.38" />
      {[[132,215,188,190],[140,168,192,145],[148,122,188,96]].map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c2} strokeWidth="0.7" opacity="0.25" />
      ))}
    </svg>
  );
}

// ── SVG : Monstera (grande feuille avec découpes caractéristiques) ───────────
function MonsteraSVG({ id, colors: [c0, c1, c2] }) {
  return (
    <svg viewBox="0 0 220 255" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`m1-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={c0} />
          <stop offset="55%"  stopColor={c1} />
          <stop offset="100%" stopColor={c2} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {/*
        Contour monstera avec 4 découpes profondes (lobes caractéristiques).
        On trace le contour complet en incluant les encoches depuis le bord.
      */}
      <path
        d={`
          M 110,238
          C 55,220 8,178 4,122
          C 0,78 18,42 48,22
          C 68,10 90,8 108,10
          L 108,10
          C 98,24 92,40 96,56
          C 84,50 68,53 60,66
          C 54,78 60,94 72,94
          C 78,94 82,90 84,86
          L 84,86
          C 80,102 80,118 86,132
          C 72,124 52,128 48,144
          C 44,160 56,174 70,170
          C 76,168 80,164 82,160
          L 82,160
          C 88,180 98,205 110,238
          Z
        `}
        fill={`url(#m1-${id})`} opacity="0.92"
      />
      <path
        d={`
          M 110,238
          C 165,220 212,178 216,122
          C 220,78 202,42 172,22
          C 152,10 130,8 112,10
          L 112,10
          C 122,24 128,40 124,56
          C 136,50 152,53 160,66
          C 166,78 160,94 148,94
          C 142,94 138,90 136,86
          L 136,86
          C 140,102 140,118 134,132
          C 148,124 168,128 172,144
          C 176,160 164,174 150,170
          C 144,168 140,164 138,160
          L 138,160
          C 132,180 122,205 110,238
          Z
        `}
        fill={`url(#m1-${id})`} opacity="0.88"
      />
      {/* Trou oval caractéristique — gauche */}
      <ellipse cx="78" cy="108" rx="10" ry="14"
        fill={c0} opacity="0.85" />
      {/* Trou oval — droite */}
      <ellipse cx="142" cy="108" rx="10" ry="14"
        fill={c0} opacity="0.85" />
      {/* Trou haut gauche */}
      <ellipse cx="82" cy="68" rx="7" ry="10"
        fill={c0} opacity="0.8" />
      {/* Trou haut droite */}
      <ellipse cx="138" cy="68" rx="7" ry="10"
        fill={c0} opacity="0.8" />
      {/* Nervure centrale */}
      <line x1="110" y1="238" x2="110" y2="10" stroke={c2} strokeWidth="1.5" opacity="0.48" />
      {/* Nervures secondaires */}
      {[[110,195,65,155],[110,155,68,115],[110,115,72,75],[110,75,80,40]].map(([x1,y1,x2,y2],i) => (
        <g key={i}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c2} strokeWidth="0.85" opacity="0.3" />
          <line x1={x1} y1={y1} x2={220-x2} y2={y2} stroke={c2} strokeWidth="0.85" opacity="0.3" />
        </g>
      ))}
    </svg>
  );
}

// ── SVG : Feuilles ovales ficus (nervures en éventail) ───────────────────────
function OvalSVG({ id, colors: [c0, c1, c2] }) {
  const veins = [55,75,95,115,135,155,175,195];
  return (
    <svg viewBox="0 0 260 240" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`o1-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={c0} />
          <stop offset="50%"  stopColor={c1} />
          <stop offset="100%" stopColor={c0} stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={`o2-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={c1} />
          <stop offset="60%"  stopColor={c2} stopOpacity="0.65" />
        </linearGradient>
      </defs>
      {/* Feuille ovale principale */}
      <path
        d="M 130,215 C 60,200 5,160 3,105 C 1,50 58,5 130,5 C 202,5 257,50 257,105 C 257,160 200,200 130,215 Z"
        fill={`url(#o1-${id})`} opacity="0.92"
      />
      {/* Tige */}
      <line x1="130" y1="215" x2="130" y2="238" stroke={c1} strokeWidth="2.2" opacity="0.7" />
      {/* Nervure centrale */}
      <line x1="130" y1="215" x2="130" y2="5" stroke={c2} strokeWidth="1.5" opacity="0.5" />
      {/* Nervures en éventail */}
      {veins.map((y, i) => {
        const spread = (105 - Math.abs(y - 110)) * 0.58;
        return (
          <g key={i}>
            <line x1="130" y1={y + 4} x2={130 - spread} y2={y}
              stroke={c2} strokeWidth="0.75" opacity="0.3" />
            <line x1="130" y1={y + 4} x2={130 + spread} y2={y}
              stroke={c2} strokeWidth="0.75" opacity="0.3" />
          </g>
        );
      })}
      {/* Seconde feuille en retrait */}
      <path
        d="M 88,215 C 22,198 -18,155 -14,105 C -10,55 35,15 88,12 C 140,9 175,45 170,95 C 165,148 138,190 88,215 Z"
        fill={`url(#o2-${id})`} opacity="0.48"
      />
      <line x1="88" y1="215" x2="72" y2="12" stroke={c2} strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

// ── SVG : Palmier effilé (folioles sur tige arquée, jaune-vert) ──────────────
function PalmSVG({ id, colors: [c0, c1, c2] }) {
  const sx0=40, sy0=290, sx1=70, sy1=170, sx2=160, sy2=70, sx3=270, sy3=10;
  const bezier = t => {
    const mt = 1-t;
    return {
      x: mt**3*sx0 + 3*mt**2*t*sx1 + 3*mt*t**2*sx2 + t**3*sx3,
      y: mt**3*sy0 + 3*mt**2*t*sy1 + 3*mt*t**2*sy2 + t**3*sy3,
    };
  };
  const tangent = t => {
    const mt = 1-t;
    const dx = -3*mt**2*sx0 + 3*(mt**2-2*mt*t)*sx1 + 3*(2*mt*t-t**2)*sx2 + 3*t**2*sx3;
    const dy = -3*mt**2*sy0 + 3*(mt**2-2*mt*t)*sy1 + 3*(2*mt*t-t**2)*sy2 + 3*t**2*sy3;
    const l = Math.sqrt(dx*dx+dy*dy)||1;
    return { x: dx/l, y: dy/l };
  };
  const folioles = [
    { t:0.12, la:-82, ra:32, len:58 },
    { t:0.22, la:-76, ra:28, len:72 },
    { t:0.32, la:-70, ra:25, len:82 },
    { t:0.42, la:-65, ra:22, len:85 },
    { t:0.52, la:-60, ra:20, len:78 },
    { t:0.62, la:-56, ra:18, len:65 },
    { t:0.72, la:-52, ra:16, len:50 },
    { t:0.84, la:-48, ra:14, len:32 },
  ];
  return (
    <svg viewBox="0 0 310 300" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`p1-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={c1} />
          <stop offset="100%" stopColor={c2} stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id={`p2-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={c0} />
          <stop offset="100%" stopColor={c1} stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`ps-${id}`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={c0} />
          <stop offset="100%" stopColor={c1} />
        </linearGradient>
      </defs>
      {folioles.map(({ t, la, ra, len }, i) => {
        const pt  = bezier(t);
        const tan = tangent(t);
        const ang = Math.atan2(tan.y, tan.x) * 180 / Math.PI;
        const lRad = (ang + la) * Math.PI / 180;
        const rRad = (ang + ra) * Math.PI / 180;
        const sp = 10;
        return (
          <g key={i} opacity={0.78 + i * 0.025}>
            <path
              d={`M ${pt.x},${pt.y} Q ${pt.x + len*0.5*Math.cos(lRad) - sp*Math.sin(lRad)},${pt.y + len*0.5*Math.sin(lRad) + sp*Math.cos(lRad)} ${pt.x + len*Math.cos(lRad)},${pt.y + len*Math.sin(lRad)}`}
              fill="none" stroke={`url(#p1-${id})`} strokeWidth="2.8" strokeLinecap="round"
            />
            <path
              d={`M ${pt.x},${pt.y} Q ${pt.x + len*0.45*Math.cos(rRad) + sp*Math.sin(rRad)},${pt.y + len*0.45*Math.sin(rRad) - sp*Math.cos(rRad)} ${pt.x + len*0.7*Math.cos(rRad)},${pt.y + len*0.7*Math.sin(rRad)}`}
              fill="none" stroke={`url(#p2-${id})`} strokeWidth="2.2" strokeLinecap="round"
            />
          </g>
        );
      })}
      <path d={`M ${sx0},${sy0} C ${sx1},${sy1} ${sx2},${sy2} ${sx3},${sy3}`}
        fill="none" stroke={`url(#ps-${id})`} strokeWidth="3.2" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

// ── SVG : Palmier courbé vers le bas ─────────────────────────────────────────
function CurvedPalmSVG({ id, colors: [c0, c1, c2] }) {
  const sx0=30, sy0=15, sx1=90, sy1=60, sx2=210, sy2=170, sx3=275, sy3=285;
  const bezier = t => {
    const mt = 1-t;
    return {
      x: mt**3*sx0 + 3*mt**2*t*sx1 + 3*mt*t**2*sx2 + t**3*sx3,
      y: mt**3*sy0 + 3*mt**2*t*sy1 + 3*mt*t**2*sy2 + t**3*sy3,
    };
  };
  const tangent = t => {
    const mt = 1-t;
    const dx = -3*mt**2*sx0 + 3*(mt**2-2*mt*t)*sx1 + 3*(2*mt*t-t**2)*sx2 + 3*t**2*sx3;
    const dy = -3*mt**2*sy0 + 3*(mt**2-2*mt*t)*sy1 + 3*(2*mt*t-t**2)*sy2 + 3*t**2*sy3;
    const l = Math.sqrt(dx*dx+dy*dy)||1;
    return { x: dx/l, y: dy/l };
  };
  const folioles = [
    { t:0.10, la:-78, ra:30, len:62 },
    { t:0.22, la:-72, ra:26, len:78 },
    { t:0.34, la:-66, ra:22, len:88 },
    { t:0.46, la:-60, ra:18, len:84 },
    { t:0.58, la:-55, ra:16, len:72 },
    { t:0.70, la:-50, ra:14, len:56 },
    { t:0.82, la:-46, ra:12, len:36 },
  ];
  return (
    <svg viewBox="0 0 305 300" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`cp1-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={c1} />
          <stop offset="100%" stopColor={c2} stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id={`cp2-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={c0} />
          <stop offset="100%" stopColor={c1} stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={`cps-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={c0} />
          <stop offset="100%" stopColor={c1} />
        </linearGradient>
      </defs>
      {folioles.map(({ t, la, ra, len }, i) => {
        const pt  = bezier(t);
        const tan = tangent(t);
        const ang = Math.atan2(tan.y, tan.x) * 180 / Math.PI;
        const lRad = (ang + la) * Math.PI / 180;
        const rRad = (ang + ra) * Math.PI / 180;
        const sp = 11;
        return (
          <g key={i} opacity={0.78 + i * 0.03}>
            <path
              d={`M ${pt.x},${pt.y} Q ${pt.x + len*0.52*Math.cos(lRad) - sp*Math.sin(lRad)},${pt.y + len*0.52*Math.sin(lRad) + sp*Math.cos(lRad)} ${pt.x + len*Math.cos(lRad)},${pt.y + len*Math.sin(lRad)}`}
              fill="none" stroke={`url(#cp1-${id})`} strokeWidth="2.8" strokeLinecap="round"
            />
            <path
              d={`M ${pt.x},${pt.y} Q ${pt.x + len*0.42*Math.cos(rRad) + sp*Math.sin(rRad)},${pt.y + len*0.42*Math.sin(rRad) - sp*Math.cos(rRad)} ${pt.x + len*0.72*Math.cos(rRad)},${pt.y + len*0.72*Math.sin(rRad)}`}
              fill="none" stroke={`url(#cp2-${id})`} strokeWidth="2.2" strokeLinecap="round"
            />
          </g>
        );
      })}
      <path d={`M ${sx0},${sy0} C ${sx1},${sy1} ${sx2},${sy2} ${sx3},${sy3}`}
        fill="none" stroke={`url(#cps-${id})`} strokeWidth="3.2" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
function LeafSVG({ type, id, colors }) {
  switch (type) {
    case 'banana':      return <BananaSVG      id={id} colors={colors} />;
    case 'broad':       return <BroadSVG       id={id} colors={colors} />;
    case 'monstera':    return <MonsteraSVG    id={id} colors={colors} />;
    case 'oval':        return <OvalSVG        id={id} colors={colors} />;
    case 'palm':        return <PalmSVG        id={id} colors={colors} />;
    case 'curved-palm': return <CurvedPalmSVG  id={id} colors={colors} />;
    default:            return null;
  }
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function PalmLeaves() {
  const { islandMode } = useIslandMode();
  const [mounted,        setMounted]        = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const unmountTimerRef = useRef(null);

  useEffect(() => {
    clearTimeout(unmountTimerRef.current);
    if (islandMode) {
      setMounted(true);
    } else {
      unmountTimerRef.current = setTimeout(() => setMounted(false), 900);
    }
    return () => clearTimeout(unmountTimerRef.current);
  }, [islandMode]);

  useEffect(() => {
    if (!mounted) return;
    const handleScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      setScrollProgress(Math.min(window.scrollY / max, 1));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  if (!mounted) return null;

  const leaves = [
    {
      id: 'top-left',
      style: { top: '-20px', left: '-30px', width: '280px' },
      rotation: 15,
      colors: ['#0d1f0d', '#1a3a1a', '#2a5a20'],
      type: 'banana',
      side: 'left',
    },
    {
      id: 'mid-left',
      style: { top: '35%', left: '-40px', width: '240px' },
      rotation: 5,
      colors: ['#1a3a1a', '#2a5a20', '#3a6a25'],
      type: 'broad',
      side: 'left',
    },
    {
      id: 'bot-left',
      style: { bottom: '5%', left: '-20px', width: '220px' },
      rotation: -5,
      colors: ['#2a5a20', '#3a6a25', '#4a7a30'],
      type: 'monstera',
      side: 'left',
    },
    {
      id: 'top-right',
      style: { top: '-10px', right: '-20px', width: '260px' },
      rotation: -20,
      colors: ['#0d1f0d', '#1e3d1e', '#2a5a20'],
      type: 'oval',
      side: 'right',
    },
    {
      id: 'mid-right',
      style: { top: '30%', right: '-30px', width: '300px' },
      rotation: -10,
      colors: ['#3a5a10', '#6a8a20', '#8aaa30'],
      type: 'palm',
      side: 'right',
    },
    {
      id: 'bot-right',
      style: { bottom: '8%', right: '-25px', width: '280px' },
      rotation: 10,
      colors: ['#2a4a10', '#4a6a15', '#6a8a20'],
      type: 'curved-palm',
      side: 'right',
    },
  ];

  const rotateAmt  = scrollProgress * 8;
  const translateY = scrollProgress * 20;

  return (
    <>
      {leaves.map(leaf => {
        const isLeft = leaf.side === 'left';
        const scrollT = isLeft
          ? `rotate(${rotateAmt}deg) translateY(${-translateY}px)`
          : `rotate(${-rotateAmt}deg) translateY(${-translateY}px)`;
        const exitTX = isLeft ? '-120px' : '120px';

        return (
          <div
            key={leaf.id}
            style={{
              position: 'fixed',
              zIndex: 1,
              pointerEvents: 'none',
              height: 'auto',
              ...leaf.style,
              opacity:    islandMode ? 1 : 0,
              transform:  islandMode
                ? `translateX(0px) rotate(${leaf.rotation}deg) ${scrollT}`
                : `translateX(${exitTX}) rotate(${leaf.rotation}deg)`,
              transition: 'opacity 0.8s ease, transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            <LeafSVG type={leaf.type} id={leaf.id} colors={leaf.colors} />
          </div>
        );
      })}
    </>
  );
}
