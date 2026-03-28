// ─── HeroSlider v1.0 — version de référence, ne pas modifier ─────────────────
// Sauvegarde du composant avant refonte SVG / CTA / word renforcé
// Dépend des keyframes dans globalStyles de App.jsx

import React, { useState } from 'react';

export function HeroSlider() {
  const SLIDES = [
    { name: "Tahiti",           category: "POISSON", price: "22.90 CHF", description: "Thon rouge, citron vert, gingembre, sauce coco",    bgColor: "#0e2a1a", accentColor: "#2a6644", image: "/froid-tahitien.jpg",  decorElements: ["🐟", "🌿", "🍋"] },
    { name: "Hawaï",            category: "POISSON", price: "22.90 CHF", description: "Thon rouge, mangue, ananas, sauce sésame",          bgColor: "#2a1800", accentColor: "#c47a2a", image: "/froid-kaikai.jpg",   decorElements: ["🍍", "🥭", "🌺"] },
    { name: "Manoa",            category: "POISSON", price: "24.90 CHF", description: "Thon rouge, sauce arachide, guacamole maison",      bgColor: "#1a1200", accentColor: "#a0832a", image: "/froid-mokai.jpg",    decorElements: ["🥑", "🌾", "🍋"] },
    { name: "Chao Men",         category: "CHAUD",   price: "18.90 CHF", description: "Nouilles sautées, wok de porc, sauce crevettes",    bgColor: "#200a0a", accentColor: "#8b2a1a", image: "/chaud-chaomen.jpg",  decorElements: ["🍜", "🥢", "🌶️"] },
    { name: "Kai Fan",          category: "CHAUD",   price: "18.90 CHF", description: "Riz sauté, wok de porc, sauce champignons",         bgColor: "#0a1a0a", accentColor: "#2a5a1a", image: "/chaud-kaifan.jpg",   decorElements: ["🍚", "🥬", "🍄"] },
    { name: "Coulant Chocolat", category: "DESSERT", price: "9.90 CHF",  description: "Coulant fondant, servi chaud",                      bgColor: "#100a00", accentColor: "#5a2a00", image: "/dessert-coulant.jpg", decorElements: ["🍫", "🍮", "✨"] },
  ];
  const N = SLIDES.length;
  const SP = 'cubic-bezier(0.4,0.0,0.2,1)';
  const DECOR_POS = [
    { top: '30%',  left: '8%'  },
    { top: '20%',  right: '9%' },
    { top: '58%',  right: '7%' },
  ];
  const FLOAT_DUR = [3.1, 3.8, 4.4];
  const FLOAT_DEL = [0, 0.6, 1.2];

  const [cur,          setCur]          = React.useState(0);
  const [nxt,          setNxt]          = React.useState(null);
  const [dir,          setDir]          = React.useState(null);
  const [animating,    setAnimating]    = React.useState(false);
  const [hoverPaused,     setHoverPaused]     = React.useState(false);
  const [afterDragPaused, setAfterDragPaused] = React.useState(false);
  const [progress,        setProgress]        = React.useState(0);
  const [dragX,        setDragX]        = React.useState(0);
  const [isDragging,   setIsDragging]   = React.useState(false);
  const [isSpringBack, setIsSpringBack] = React.useState(false);
  const [showHint,     setShowHint]     = React.useState(false);
  const [tilt,         setTilt]         = React.useState({ x: 0, y: 0 });
  const [tiltTrans,    setTiltTrans]    = React.useState('transform 0.1s ease-out');

  const heroRef        = React.useRef(null);
  const animTimerRef   = React.useRef(null);
  const pauseTimerRef  = React.useRef(null);
  const rafRef         = React.useRef(null);
  const progressStart  = React.useRef(null);
  const hintShown      = React.useRef(false);
  const dragStartX     = React.useRef(0);
  const dragXRef       = React.useRef(0);
  const isDraggingRef  = React.useRef(false);
  const curRef         = React.useRef(0);
  const animatingRef   = React.useRef(false);
  curRef.current        = cur;
  animatingRef.current  = animating;
  isDraggingRef.current = isDragging;

  const autoplayPaused = hoverPaused || isDragging || afterDragPaused;

  const navigate = React.useCallback((nextIdx, direction) => {
    if (animatingRef.current) return;
    setAnimating(true); animatingRef.current = true;
    setNxt(nextIdx); setDir(direction);
    animTimerRef.current = setTimeout(() => {
      setCur(nextIdx); setNxt(null); setDir(null);
      setAnimating(false); animatingRef.current = false;
    }, 650);
  }, []);

  const goNext = () => navigate((curRef.current + 1) % N, 'next');
  const goPrev = () => navigate((curRef.current - 1 + N) % N, 'prev');
  const goNextRef = React.useRef(goNext);
  goNextRef.current = goNext;

  React.useEffect(() => {
    if (autoplayPaused) return;
    const id = setInterval(() => goNextRef.current(), 5000);
    return () => clearInterval(id);
  }, [autoplayPaused]);

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

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (hintShown.current || animatingRef.current || isDraggingRef.current) return;
      hintShown.current = true;
      setShowHint(true);
      setTimeout(() => setShowHint(false), 700);
    }, 2000);
    return () => clearTimeout(t);
  }, []);

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

  const onTiltMove = (e) => {
    if (window.innerWidth < 768) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setTilt({ x: ((e.clientY - rect.top) / rect.height - 0.5) * -5, y: ((e.clientX - rect.left) / rect.width - 0.5) * 7 });
    setTiltTrans('transform 0.08s ease-out');
  };

  const handleMouseMove  = (e) => { onDragMove(e); onTiltMove(e); };
  const handleMouseLeave = () => { onDragEnd(); setTilt({ x: 0, y: 0 }); setTiltTrans('transform 0.6s ease'); setHoverPaused(false); };

  React.useEffect(() => () => {
    clearTimeout(animTimerRef.current);
    clearTimeout(pauseTimerRef.current);
    cancelAnimationFrame(rafRef.current);
  }, []);

  const slide        = SLIDES[cur];
  const nextSlide    = nxt !== null ? SLIDES[nxt] : null;
  const displaySlide = animating && nextSlide ? nextSlide : slide;
  const bgColor      = animating && nextSlide ? nextSlide.bgColor : slide.bgColor;

  const EZ = 'cubic-bezier(0.16,1,0.3,1)';
  const bowlExitAnim  = dir === 'next' ? `rollOutToLeft 1.2s ${SP} forwards`        : `rollOutToRight 1.2s ${SP} forwards`;
  const bowlEnterAnim = dir === 'next' ? `rollInFromRight 1.2s ${SP} 60ms forwards` : `rollInFromLeft 1.2s ${SP} 60ms forwards`;
  const wordExitAnim  = dir === 'next' ? `wordExitLeft 0.75s ${EZ} forwards`        : `wordExitRight 0.75s ${EZ} forwards`;
  const wordEnterAnim = dir === 'next' ? `wordEnterFromRight 0.75s ${EZ} forwards`  : `wordEnterFromLeft 0.75s ${EZ} forwards`;

  let bowlStyle;
  if (animating)       { bowlStyle = { animation: bowlEnterAnim }; }
  else if (isDragging) { bowlStyle = { transform: `translateX(${dragX}px) rotate(${dragX * 0.25}deg)`, transition: 'none', cursor: 'grabbing' }; }
  else if (isSpringBack){ bowlStyle = { transform: 'translateX(0) rotate(0deg)', transition: `transform 0.5s ${SP}`, cursor: 'grab' }; }
  else if (showHint)   { bowlStyle = { animation: 'bowlHint 0.6s ease-in-out forwards', cursor: 'grab' }; }
  else                 { bowlStyle = { cursor: 'grab' }; }

  return (
    <div
      ref={heroRef}
      style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: bgColor, transition: 'background-color 0.6s ease-in-out', userSelect: 'none', touchAction: 'pan-y' }}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onMouseUp={onDragEnd}
    >
      <div style={{ position: 'absolute', inset: 0, transform: `perspective(1400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition: tiltTrans, transformStyle: 'preserve-3d' }}>
        {animating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 2, transform: 'translateZ(18px)', pointerEvents: 'none' }}>
            <span className="hero-word" style={{ animation: wordExitAnim }}>{slide.category}</span>
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 2, transform: 'translateZ(18px)', pointerEvents: 'none' }}>
          <span className="hero-word" style={animating ? { animation: wordEnterAnim } : {}}>{displaySlide.category}</span>
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, transform: 'translateZ(55px)', touchAction: 'pan-y' }}
          onMouseDown={onDragStart} onTouchStart={onDragStart} onTouchMove={onDragMove} onTouchEnd={onDragEnd}>
          {animating && (
            <div className="hero-bowl" style={{ animation: bowlExitAnim, position: 'absolute' }}>
              <img src={slide.image} alt={slide.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
            </div>
          )}
          <div className="hero-bowl" style={bowlStyle}>
            <img src={displaySlide.image} alt={displaySlide.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
          </div>
        </div>
        <div style={{ position: 'absolute', inset: 0, zIndex: 4, transform: 'translateZ(85px)', pointerEvents: 'none' }}>
          {displaySlide.decorElements.map((emoji, i) => (
            <div key={`${animating ? nxt : cur}-d${i}`} style={{ position: 'absolute', ...DECOR_POS[i], fontSize: 'clamp(1.4rem, 2.6vmin, 2rem)', animation: `floatDecor${i} ${FLOAT_DUR[i]}s ease-in-out ${FLOAT_DEL[i]}s infinite, decorAppear 0.52s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 180}ms both`, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.35))', userSelect: 'none' }}>{emoji}</div>
          ))}
        </div>
      </div>
      <div key={`info-${animating ? nxt : cur}`} style={{ position: 'absolute', bottom: '12%', left: '5%', maxWidth: '55%', pointerEvents: 'none', zIndex: 5, transform: 'translateZ(35px)' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', margin: '0 0 0.4rem', animation: 'textUpCat 0.35s ease-out 0.28s both' }}>{displaySlide.category}</p>
        <h2 style={{ fontSize: 'clamp(42px, 6vw, 80px)', fontFamily: "'Bebas Neue', Impact, 'Arial Black', sans-serif", fontWeight: 900, color: '#fff', lineHeight: 1, margin: '0 0 0.3rem', animation: 'textUpName 0.4s ease-out 0.32s both', letterSpacing: '0.02em' }}>{displaySlide.name}</h2>
        <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.3rem)', fontWeight: 500, color: 'rgba(255,255,255,0.9)', margin: '0 0 0.4rem', animation: 'textUpMeta 0.38s ease-out 0.38s both' }}>{displaySlide.price}</p>
        <p style={{ fontSize: 'clamp(0.75rem, 1.3vw, 0.88rem)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0, animation: 'textUpMeta 0.38s ease-out 0.42s both' }}>{displaySlide.description}</p>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, display: 'flex', zIndex: 6, pointerEvents: 'none' }}>
        {SLIDES.map((_, i) => (
          <div key={i} style={{ flex: 1, height: '100%', background: 'rgba(255,255,255,0.18)', overflow: 'hidden', transition: 'opacity 0.3s', opacity: i === cur ? 1 : 0.7, marginRight: i < N - 1 ? 2 : 0 }}>
            <div style={{ height: '100%', background: 'rgba(255,255,255,0.85)', width: i === cur ? `${progress * 100}%` : i < cur ? '100%' : '0%', transition: i === cur ? 'width 0.1s linear' : 'width 0.3s ease' }} />
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 140, background: 'linear-gradient(to bottom, transparent, #000)', zIndex: 5, pointerEvents: 'none' }} />
    </div>
  );
}
