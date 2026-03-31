// src/components/HeroSliderV2.jsx
import React from 'react';

const SLIDES = [
  { name: "Tahiti",           category: "POISSON", price: "22.90 CHF", description: "Thon rouge, citron vert, gingembre, sauce coco",  bgGradient: "radial-gradient(ellipse at 50% 50%, #1a4a2e 0%, #0e2a1a 55%, #061208 100%)", accentColor: "#2a6644", image: "/froid-tahitien.jpg"  },
  { name: "Hawaï",            category: "POISSON", price: "22.90 CHF", description: "Thon rouge, mangue, ananas, sauce sésame",        bgGradient: "radial-gradient(ellipse at 50% 50%, #4a2e00 0%, #2a1800 55%, #100800 100%)", accentColor: "#c47a2a", image: "/froid-kaikai.jpg"   },
  { name: "Manoa",            category: "POISSON", price: "24.90 CHF", description: "Thon rouge, sauce arachide, guacamole maison",    bgGradient: "radial-gradient(ellipse at 50% 50%, #302000 0%, #1a1200 55%, #0a0800 100%)", accentColor: "#a0832a", image: "/froid-mokai.jpg"    },
  { name: "Chao Men",         category: "CHAUD",   price: "18.90 CHF", description: "Nouilles sautées, wok de porc, sauce crevettes",  bgGradient: "radial-gradient(ellipse at 50% 50%, #3a1010 0%, #200a0a 55%, #0e0404 100%)", accentColor: "#8b2a1a", image: "/chaud-chaomen.jpg"  },
  { name: "Kai Fan",          category: "CHAUD",   price: "18.90 CHF", description: "Riz sauté, wok de porc, sauce champignons",       bgGradient: "radial-gradient(ellipse at 50% 50%, #142a14 0%, #0a1a0a 55%, #040a04 100%)", accentColor: "#2a5a1a", image: "/chaud-kaifan.jpg"   },
  { name: "Coulant Chocolat", category: "DESSERT", price: "9.90 CHF",  description: "Coulant fondant, servi chaud",                    bgGradient: "radial-gradient(ellipse at 50% 50%, #241200 0%, #100a00 55%, #080400 100%)", accentColor: "#5a2a00", image: "/dessert-coulant.jpg" },
];

const SHAPE_DECORS = [
  [(c) => <svg width="28" height="28" fill="none" viewBox="0 0 28 28"><circle cx="14" cy="14" r="12" stroke={c} strokeWidth="1.5" opacity="0.9"/></svg>, (c) => <svg width="34" height="8" fill="none" viewBox="0 0 34 8"><circle cx="4" cy="4" r="3" fill={c} opacity="0.8"/><circle cx="17" cy="4" r="3" fill={c} opacity="0.8"/><circle cx="30" cy="4" r="3" fill={c} opacity="0.8"/></svg>, (c) => <svg width="38" height="38" fill="none" viewBox="0 0 38 38"><line x1="1" y1="37" x2="37" y2="1" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/></svg>],
  [(c) => <svg width="26" height="26" fill="none" viewBox="0 0 26 26"><rect x="13" y="2" width="15" height="15" rx="1" transform="rotate(45 13 13)" stroke={c} strokeWidth="1.5" opacity="0.9"/></svg>, (c) => <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill={c} opacity="0.75"/></svg>, (c) => <svg width="22" height="22" fill="none" viewBox="0 0 22 22"><line x1="11" y1="1" x2="11" y2="21" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/><line x1="1" y1="11" x2="21" y2="11" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/></svg>],
  [(c) => <svg width="38" height="38" fill="none" viewBox="0 0 38 38"><line x1="1" y1="1" x2="37" y2="37" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/></svg>, (c) => <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" stroke={c} strokeWidth="1" opacity="0.65"/></svg>, (c) => <svg width="10" height="10" fill="none" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill={c} opacity="0.8"/></svg>],
  [(c) => <svg width="22" height="22" fill="none" viewBox="0 0 22 22"><line x1="11" y1="1" x2="11" y2="21" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/><line x1="1" y1="11" x2="21" y2="11" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/></svg>, (c) => <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke={c} strokeWidth="1.5" opacity="0.85"/></svg>, (c) => <svg width="8" height="34" fill="none" viewBox="0 0 8 34"><circle cx="4" cy="4" r="3" fill={c} opacity="0.8"/><circle cx="4" cy="17" r="3" fill={c} opacity="0.8"/><circle cx="4" cy="30" r="3" fill={c} opacity="0.8"/></svg>],
  [(c) => <svg width="38" height="38" fill="none" viewBox="0 0 38 38"><line x1="1" y1="37" x2="37" y2="1" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/></svg>, (c) => <svg width="26" height="26" fill="none" viewBox="0 0 26 26"><rect x="13" y="2" width="15" height="15" rx="1" transform="rotate(45 13 13)" stroke={c} strokeWidth="1.5" opacity="0.85"/></svg>, (c) => <svg width="12" height="12" fill="none" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill={c} opacity="0.75"/></svg>],
  [(c) => <svg width="30" height="30" fill="none" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" stroke={c} strokeWidth="1.5" opacity="0.85"/></svg>, (c) => <svg width="34" height="8" fill="none" viewBox="0 0 34 8"><circle cx="4" cy="4" r="3" fill={c} opacity="0.75"/><circle cx="17" cy="4" r="3" fill={c} opacity="0.75"/><circle cx="30" cy="4" r="3" fill={c} opacity="0.75"/></svg>, (c) => <svg width="22" height="22" fill="none" viewBox="0 0 22 22"><line x1="11" y1="1" x2="11" y2="21" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/><line x1="1" y1="11" x2="21" y2="11" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/></svg>],
];

const DECOR_POS = [
  { top: '-15%', left: '-18%' },
  { top: '-20%', right: '-15%' },
  { bottom: '-10%', right: '-20%' },
];
const FLOAT_DUR = [3.1, 3.8, 4.4];
const FLOAT_DEL = [0, 0.6, 1.2];
const N = SLIDES.length;
const SP = 'cubic-bezier(0.4,0.0,0.2,1)';

export default function HeroSliderV2() {
  // ── state
  const [cur, setCur] = React.useState(0);
  const [animating, setAnimating] = React.useState(false);
  const [exitSlideIdx, setExitSlideIdx] = React.useState(null);
  const [exitDir, setExitDir] = React.useState(null);
  const [progress, setProgress] = React.useState(0);
  const [hoverPaused, setHoverPaused] = React.useState(false);
  const [afterDragPaused, setAfterDragPaused] = React.useState(false);
  const [dragX, setDragX] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isSpringBack, setIsSpringBack] = React.useState(false);
  const [showHint, setShowHint] = React.useState(false);
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });
  const [tiltTrans, setTiltTrans] = React.useState('transform 0.1s ease-out');

  // ── refs
  const heroRef = React.useRef(null);
  const animTimerRef = React.useRef(null);
  const pauseTimerRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const progressStart = React.useRef(null);
  const hintShown = React.useRef(false);
  const dragStartX = React.useRef(0);
  const dragXRef = React.useRef(0);
  const isDraggingRef = React.useRef(false);
  const curRef = React.useRef(0);
  const animatingRef = React.useRef(false);
  curRef.current = cur;
  animatingRef.current = animating;
  isDraggingRef.current = isDragging;

  const autoplayPaused = hoverPaused || isDragging || afterDragPaused;

  // ── navigate : capture exitSlideIdx AVANT tout setState
  const navigate = React.useCallback((nextIdx, direction) => {
    if (animatingRef.current) return;
    const fromIdx = curRef.current;
    // Capture synchrone de la slide sortante et direction
    setExitSlideIdx(fromIdx);
    setExitDir(direction);
    setAnimating(true);
    animatingRef.current = true;
    setCur(nextIdx);
    animTimerRef.current = setTimeout(() => {
      setExitSlideIdx(null);
      setExitDir(null);
      setAnimating(false);
      animatingRef.current = false;
    }, 750);
  }, []);

  const goNext = React.useCallback(() => navigate((curRef.current + 1) % N, 'next'), [navigate]);
  const goPrev = React.useCallback(() => navigate((curRef.current - 1 + N) % N, 'prev'), [navigate]);
  const goNextRef = React.useRef(goNext);
  goNextRef.current = goNext;

  // ── autoplay
  React.useEffect(() => {
    if (autoplayPaused) return;
    const id = setInterval(() => goNextRef.current(), 5000);
    return () => clearInterval(id);
  }, [autoplayPaused]);

  // ── progress bar
  React.useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (autoplayPaused) { setProgress(0); return; }
    progressStart.current = Date.now();
    setProgress(0);
    const tick = () => {
      const p = Math.min((Date.now() - progressStart.current) / 5000, 1);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cur, autoplayPaused]);

  // ── hint
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (hintShown.current || animatingRef.current || isDraggingRef.current) return;
      hintShown.current = true;
      setShowHint(true);
      setTimeout(() => setShowHint(false), 700);
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  // ── cleanup
  React.useEffect(() => () => {
    clearTimeout(animTimerRef.current);
    clearTimeout(pauseTimerRef.current);
    cancelAnimationFrame(rafRef.current);
  }, []);

  // ── drag
  const getClientX = (e) => e.touches ? e.touches[0].clientX : e.clientX;

  const onDragStart = (e) => {
    if (animatingRef.current) return;
    if (e.type === 'mousedown') e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true); setIsSpringBack(false); setShowHint(false);
    dragStartX.current = getClientX(e); dragXRef.current = 0; setDragX(0);
  };

  const onDragMove = (e) => {
    if (!isDraggingRef.current) return;
    const delta = (getClientX(e) - dragStartX.current) * 0.65;
    dragXRef.current = delta; setDragX(delta);
  };

  const onDragEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false; setIsDragging(false);
    const dx = dragXRef.current; dragXRef.current = 0; setDragX(0);
    const threshold = window.innerWidth <= 768 ? 60 : 80;
    if (Math.abs(dx) >= threshold) {
      setAfterDragPaused(true);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = setTimeout(() => { setAfterDragPaused(false); pauseTimerRef.current = null; }, 8000);
      if (dx < 0) goNext(); else goPrev();
    } else {
      setIsSpringBack(true);
      setTimeout(() => setIsSpringBack(false), 500);
    }
  };

  // ── tilt
  const onTiltMove = (e) => {
    if (window.innerWidth < 768) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setTilt({ x: ((e.clientY - rect.top) / rect.height - 0.5) * -5, y: ((e.clientX - rect.left) / rect.width - 0.5) * 7 });
    setTiltTrans('transform 0.08s ease-out');
  };

  const handleMouseMove = (e) => { onDragMove(e); onTiltMove(e); };
  const handleMouseLeave = () => { onDragEnd(); setTilt({ x: 0, y: 0 }); setTiltTrans('transform 0.6s ease'); setHoverPaused(false); };

  // ── derived — cur est déjà la nouvelle slide, exitSlideIdx est l'ancienne
  const currentSlide = SLIDES[cur];
  const exitSlide = exitSlideIdx !== null ? SLIDES[exitSlideIdx] : null;

  const bowlExitAnim = exitDir === 'next'
    ? `rollOutToLeft 0.75s ${SP} forwards`
    : `rollOutToRight 0.75s ${SP} forwards`;
  const bowlEnterAnim = exitDir === 'next'
    ? `rollInFromRight 0.75s ${SP} 60ms forwards`
    : `rollInFromLeft 0.75s ${SP} 60ms forwards`;

  let containerStyle;
  let bowlInnerStyle;
  if (animating) {
    containerStyle = { animation: bowlEnterAnim, willChange: 'transform, opacity' };
    bowlInnerStyle = {};
  } else if (isDragging) {
    containerStyle = { transform: `translateX(${dragX}px)`, transition: 'none', cursor: 'grabbing', willChange: 'transform' };
    bowlInnerStyle = { transform: `rotate(${dragX * 0.25}deg)`, transition: 'none' };
  } else if (isSpringBack) {
    containerStyle = { transform: 'translateX(0)', transition: `transform 0.5s ${SP}`, cursor: 'grab' };
    bowlInnerStyle = { transform: 'rotate(0deg)', transition: `transform 0.5s ${SP}` };
  } else if (showHint) {
    containerStyle = { animation: 'bowlHint 0.6s ease-in-out forwards', cursor: 'grab' };
    bowlInnerStyle = {};
  } else {
    containerStyle = { cursor: 'grab' };
    bowlInnerStyle = {};
  }

  return (
    <div
      ref={heroRef}
      style={{
        position: 'relative', width: '100%', height: '100vh', overflow: 'hidden',
        background: currentSlide.bgGradient,
        transition: 'background 0.6s ease-in-out',
        userSelect: 'none', touchAction: 'pan-y',
      }}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onMouseUp={onDragEnd}
    >
      {/* 3D tilt container */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: `perspective(1400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: tiltTrans, transformStyle: 'preserve-3d',
      }}>
        {/* Couche bol + interactions */}
        <div
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, transform: 'translateZ(55px)', touchAction: 'pan-y' }}
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
        >
          {/* Bol SORTANT — utilise exitSlide capturé avant setCur */}
          {animating && exitSlide && (
            <div style={{
              position: 'absolute',
              animation: bowlExitAnim,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}>
              <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '540px', height: '540px', pointerEvents: 'none', zIndex: 0, overflow: 'visible', mixBlendMode: 'overlay' }} viewBox="0 0 540 540">
                <defs><path id="cp-exit" d="M 270,270 m -220,0 a 220,220 0 1,1 440,0 a 220,220 0 1,1 -440,0" /></defs>
                <text fontFamily="'Bebas Neue', sans-serif" fontSize="36" fill="rgba(255,255,255,0.55)" letterSpacing="22">
                  <textPath href="#cp-exit" startOffset="50%" textAnchor="middle">{exitSlide.category} · KAÏ KAÏ · {exitSlide.category} · KAÏ KAÏ ·</textPath>
                </text>
              </svg>
              <div className="hero-bowl" style={{ position: 'relative', zIndex: 1 }}>
                <img src={exitSlide.image} alt={exitSlide.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
              </div>
            </div>
          )}

          {/* Bol ENTRANT / idle — utilise currentSlide (cur déjà mis à jour) */}
          <div style={{
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            ...containerStyle,
          }}>
            {/* Halo */}
            <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${currentSlide.accentColor}33 0%, transparent 70%)`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 0, transition: 'background 0.6s ease' }} />
            {/* TextPath circulaire */}
            <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '540px', height: '540px', pointerEvents: 'none', zIndex: 0, overflow: 'visible', mixBlendMode: 'overlay' }} viewBox="0 0 540 540">
              <defs><path id="cp-current" d="M 270,270 m -220,0 a 220,220 0 1,1 440,0 a 220,220 0 1,1 -440,0" /></defs>
              <text fontFamily="'Bebas Neue', sans-serif" fontSize="36" fill="rgba(255,255,255,0.55)" letterSpacing="22">
                <textPath href="#cp-current" startOffset="50%" textAnchor="middle">{currentSlide.category} · KAÏ KAÏ · {currentSlide.category} · KAÏ KAÏ ·</textPath>
              </text>
            </svg>
            {/* Mot géant */}
            <div className="hero-word" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
              {currentSlide.category}
            </div>
            {/* Décorations SVG */}
            {SHAPE_DECORS[cur].map((renderShape, i) => (
              <div key={`${cur}-s${i}`} style={{ position: 'absolute', ...DECOR_POS[i], transform: 'scale(1.3)', transformOrigin: 'center' }}>
                <div style={{ animation: `floatDecor${i} ${FLOAT_DUR[i]}s ease-in-out ${FLOAT_DEL[i]}s infinite, decorAppear 0.52s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 180}ms both`, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))' }}>
                  {renderShape(currentSlide.accentColor)}
                </div>
              </div>
            ))}
            {/* Bol image */}
            <div
              className={`hero-bowl${!isDragging && !animating && !isSpringBack ? ' is-floating' : ''}`}
              style={{ position: 'relative', zIndex: 1, ...bowlInnerStyle }}
            >
              <img src={currentSlide.image} alt={currentSlide.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Texte info bas gauche */}
      <div
        key={`info-${cur}`}
        style={{ position: 'absolute', bottom: '12%', left: '5%', maxWidth: '55%', pointerEvents: 'none', zIndex: 5 }}
      >
        <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', margin: '0 0 0.4rem', animation: 'textUpCat 0.35s ease-out 0.28s both' }}>{currentSlide.category}</p>
        <h2 style={{ fontSize: 'clamp(42px, 6vw, 80px)', fontFamily: "'Bebas Neue', Impact, 'Arial Black', sans-serif", fontWeight: 900, color: '#fff', lineHeight: 1, margin: '0 0 0.3rem', animation: 'textUpName 0.4s ease-out 0.32s both', letterSpacing: '0.02em' }}>{currentSlide.name}</h2>
        <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.3rem)', fontWeight: 500, color: 'rgba(255,255,255,0.9)', margin: '0 0 0.4rem', animation: 'textUpMeta 0.38s ease-out 0.38s both' }}>{currentSlide.price}</p>
        <p style={{ fontSize: 'clamp(0.75rem, 1.3vw, 0.88rem)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0, animation: 'textUpMeta 0.38s ease-out 0.42s both' }}>{currentSlide.description}</p>
      </div>

      {/* Barre de progression segmentée */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, display: 'flex', zIndex: 6, pointerEvents: 'none' }}>
        {SLIDES.map((_, i) => (
          <div key={i} style={{ flex: 1, height: '100%', background: 'rgba(255,255,255,0.18)', overflow: 'hidden', opacity: i === cur ? 1 : 0.7, marginRight: i < N - 1 ? 2 : 0 }}>
            <div style={{ height: '100%', background: 'rgba(255,255,255,0.85)', width: i === cur ? `${progress * 100}%` : i < cur ? '100%' : '0%', transition: i === cur ? 'width 0.1s linear' : 'width 0.3s ease' }} />
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => { const el = document.getElementById('section-entrees'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
        style={{ position: 'absolute', bottom: '12%', right: '5%', zIndex: 6, padding: '10px 24px', borderRadius: 999, border: '1.5px solid #C9A96E', background: 'transparent', color: '#C9A96E', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s ease, color 0.2s ease' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#C9A96E'; e.currentTarget.style.color = '#000'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C9A96E'; }}
      >
        Commander
      </button>

      {/* Dégradé bas */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 140, background: 'linear-gradient(to bottom, transparent, #000)', zIndex: 5, pointerEvents: 'none' }} />
    </div>
  );
}
