// src/components/HeroSliderV2.jsx — Hero carousel Framer Motion style
import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, useSpring } from 'motion/react';

// ============================================================
// IMAGES
// ============================================================
const tahitiImage  = '/froid-tahitien.jpg';
const hawaiImage   = '/froid-kaikai.jpg';
const manoaImage   = '/froid-mokai.jpg';
const chaoMenImage = '/chaud-chaomen.jpg';
const kaiFanImage  = '/chaud-kaifan.jpg';
const dessertImage = '/dessert-coulant.jpg';

// ============================================================
// DATA
// ============================================================
const slides = [
  { name: 'Tahiti',           category: 'POISSON', price: '22.90 CHF', description: 'Thon rouge, citron vert, gingembre, sauce coco',   image: tahitiImage,  bg: '#0e2a1a', categoryWord: 'POISSON' },
  { name: 'Hawaï',            category: 'POISSON', price: '22.90 CHF', description: 'Thon rouge, mangue, ananas, sauce sésame',          image: hawaiImage,   bg: '#2a1800', categoryWord: 'POISSON' },
  { name: 'Manoa',            category: 'POISSON', price: '24.90 CHF', description: 'Thon rouge, sauce arachide, guacamole maison',      image: manoaImage,   bg: '#1a1200', categoryWord: 'POISSON' },
  { name: 'Chao Men',         category: 'CHAUD',   price: '18.90 CHF', description: 'Nouilles sautées, wok de porc, sauce crevettes',   image: chaoMenImage, bg: '#200a0a', categoryWord: 'CHAUD'   },
  { name: 'Kai Fan',          category: 'CHAUD',   price: '18.90 CHF', description: 'Riz sauté, wok de porc, sauce champignons',        image: kaiFanImage,  bg: '#0a1a0a', categoryWord: 'CHAUD'   },
  { name: 'Coulant Chocolat', category: 'DESSERT', price: '9.90 CHF',  description: 'Coulant fondant, servi chaud',                     image: dessertImage, bg: '#100a00', categoryWord: 'DESSERT' },
];

// ============================================================
// ANIMATION VARIANTS (hors composant — stables)
// ============================================================
const slideVariants = {
  enter: (d) => ({ x: d > 0 ? '120%' : '-120%', rotateZ: d > 0 ? 25 : -25, scale: 0.6, opacity: 0, filter: 'blur(10px)' }),
  center: { x: 0, rotateZ: 0, scale: 1, opacity: 1, filter: 'blur(0px)' },
  exit:  (d) => ({ x: d > 0 ? '-120%' : '120%', rotateZ: d > 0 ? -25 : 25, scale: 0.6, opacity: 0, filter: 'blur(10px)' }),
};

const categoryWordVariants = {
  enter: (d) => ({ x: d > 0 ? '100%' : '-100%', scale: 1.5, rotateZ: d > 0 ? 15 : -15, opacity: 0, filter: 'blur(20px)' }),
  center: { x: 0, scale: 1, rotateZ: 0, opacity: 0.08, filter: 'blur(0px)' },
  exit:  (d) => ({ x: d > 0 ? '-100%' : '100%', scale: 0.8, rotateZ: d > 0 ? -15 : 15, opacity: 0, filter: 'blur(20px)' }),
};

const infoVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit:  { opacity: 0 },
};

// ============================================================
// PARTICLES (pré-calculées, stables)
// ============================================================
const particles = Array.from({ length: 20 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 0.5,
  duration: 2 + Math.random() * 2,
}));

// ============================================================
// SOUS-COMPOSANT IMAGE (isole les données de chaque slide)
// FIX BUG 3 : chaque instance garde son propre `slide`
// pendant l'animation de sortie, indépendamment de currentIndex
// ============================================================
function SlideImage({ slide, direction, dragX, dragRotation, dragScale, onDragEnd }) {
  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        duration: 0.8,
        ease: [0.6, 0.01, 0.05, 0.95],
        scale:   { type: 'spring', stiffness: 80,  damping: 12 },
        rotateZ: { type: 'spring', stiffness: 60,  damping: 15 },
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      onDragEnd={onDragEnd}
      style={{ x: dragX, rotate: dragRotation, scale: dragScale, position: 'relative' }}
      className="cursor-grab active:cursor-grabbing"
    >
      {/* Glow doré */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%) scale(1.2)',
          width: '420px', height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,169,110,0.4) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1.2, 1.4, 1.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Image circulaire */}
      <motion.div
        style={{
          width: '420px', height: '420px',
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(201,169,110,0.2)',
        }}
        whileHover={{ scale: 1.05, boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 80px rgba(201,169,110,0.3)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <motion.div
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(201,169,110,0.3)', zIndex: 1 }}
          animate={{ borderColor: ['rgba(201,169,110,0.3)', 'rgba(201,169,110,0.6)', 'rgba(201,169,110,0.3)'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.img
          src={slide.image}
          alt={slide.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          draggable={false}
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: [0.6, 0.01, 0.05, 0.95] }}
        />
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// SOUS-COMPOSANT INFOS (isole aussi les données texte)
// ============================================================
function SlideInfo({ slide }) {
  return (
    <motion.div
      variants={infoVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.25 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6, type: 'spring', stiffness: 100, damping: 12 }}
        style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#C9A96E', textTransform: 'uppercase', marginBottom: '12px', textShadow: '0 0 10px rgba(201,169,110,0.5)' }}
      >
        {slide.category}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, x: -80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.22, duration: 0.7, type: 'spring', stiffness: 80, damping: 15 }}
        style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(40px, 10vw, 80px)', color: 'white', lineHeight: 0.9, marginBottom: '16px', letterSpacing: '0.05em', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
      >
        {slide.name.split('').map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 + i * 0.04, duration: 0.4, type: 'spring', stiffness: 200, damping: 10 }}
            style={{ display: 'inline-block' }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, duration: 0.5, type: 'spring', stiffness: 150, damping: 12 }}
        style={{ fontSize: 'clamp(16px, 3vw, 20px)', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}
      >
        {slide.price}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.5, ease: [0.6, 0.01, 0.05, 0.95] }}
        style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', color: 'rgba(255,255,255,0.5)', maxWidth: '400px' }}
      >
        {slide.description}
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function HeroSliderV2() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction,    setDirection]    = useState(1);
  const [isPaused,     setIsPaused]     = useState(false);
  const [progress,     setProgress]     = useState(0);

  const dragX        = useMotionValue(0);
  const dragRotation = useTransform(dragX, [-300, 300], [-15, 15]);
  const dragScale    = useTransform(dragX, [-300, 0, 300], [0.85, 1, 0.85]);

  const mouseX  = useSpring(0.5, { stiffness: 150, damping: 20 });
  const mouseY  = useSpring(0.5, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(mouseY, [0, 1], [2, -2]);
  const rotateY = useTransform(mouseX, [0, 1], [-3, 3]);

  const containerRef = useRef(null);
  const currentSlide = slides[currentIndex];

  // ── FIX BUG 1 : autoplay sans effet de bord dans le setter d'état
  // Variable locale `p` dans le closure — pas de goToNext() dans setProgress()
  useEffect(() => {
    if (isPaused) return;
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p = Math.min(p + 100 / 50, 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setDirection(1);
        setCurrentIndex(prev => (prev + 1) % slides.length);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [currentIndex, isPaused]);

  const goToPrev = () => {
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % slides.length);
    setProgress(0);
  };

  const goToSlide = (index) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setProgress(0);
  };

  const handleDragEnd = (_, info) => {
    const { offset, velocity } = info;
    if (Math.abs(offset.x) > 80 || Math.abs(velocity.x) > 500) {
      offset.x > 0 ? goToPrev() : goToNext();
    }
    dragX.set(0);
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
    setIsPaused(false);
  };

  return (
    <motion.div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: currentSlide.bg, perspective: '1800px', fontFamily: "'DM Sans', sans-serif" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsPaused(true)}
      animate={{ backgroundColor: currentSlide.bg }}
      transition={{ duration: 0.8, ease: [0.6, 0.01, 0.05, 0.95] }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative w-full h-full"
      >
        {/* Particules d'ambiance */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
          {particles.map((particle, i) => (
            <motion.div
              key={`p-${i}`}
              className="absolute w-1 h-1 rounded-full"
              style={{ left: `${particle.x}%`, top: `${particle.y}%`, backgroundColor: 'rgba(255,255,255,0.3)' }}
              animate={{ scale: [0, 1, 0], opacity: [0, 0.6, 0], y: [-20, -100] }}
              transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: 'easeOut' }}
            />
          ))}
        </div>

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.30) 50%, transparent 100%)', zIndex: 10 }}
        />

        {/* Mot catégorie géant en arrière-plan */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          {/* FIX BUG 2 : mode="sync" (pas de mode="wait") → entrée/sortie simultanées */}
          <AnimatePresence custom={direction}>
            <motion.div
              key={currentSlide.categoryWord + currentIndex}
              custom={direction}
              variants={categoryWordVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.8, ease: [0.6, 0.01, 0.05, 0.95] }}
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(200px, 20vw, 280px)',
                letterSpacing: '0.35em',
                color: 'white',
                opacity: 0.08,
                whiteSpace: 'nowrap',
                userSelect: 'none',
                position: 'absolute',
              }}
            >
              {currentSlide.categoryWord}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Image du plat — FIX BUG 2 + BUG 3 */}
        {/* mode="sync" : pas de file d'attente, entrée/sortie simultanées */}
        {/* SlideImage reçoit slide en prop : chaque instance garde sa propre image */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 20 }}>
          <AnimatePresence custom={direction}>
            {slides.map((slide, index) =>
              index === currentIndex ? (
                <SlideImage
                  key={index}
                  slide={slide}
                  direction={direction}
                  dragX={dragX}
                  dragRotation={dragRotation}
                  dragScale={dragScale}
                  onDragEnd={handleDragEnd}
                />
              ) : null
            )}
          </AnimatePresence>
        </div>

        {/* Infos du plat en bas à gauche */}
        <div className="absolute bottom-24 left-6 md:left-12 pointer-events-none max-w-[50%] md:max-w-none" style={{ zIndex: 30 }}>
          <AnimatePresence>
            {slides.map((slide, index) =>
              index === currentIndex ? (
                <SlideInfo key={index} slide={slide} />
              ) : null
            )}
          </AnimatePresence>
        </div>

        {/* Bouton Commander en bas à droite */}
        <div className="absolute bottom-28 md:bottom-24 right-6 md:right-12" style={{ zIndex: 30 }}>
          <motion.button
            onClick={() => { const el = document.getElementById('section-entrees'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
            style={{
              fontSize: 'clamp(11px, 2.5vw, 14px)',
              letterSpacing: '0.1em',
              color: '#C9A96E',
              border: '2px solid #C9A96E',
              backgroundColor: 'transparent',
              padding: 'clamp(10px, 2vw, 14px) clamp(20px, 4vw, 32px)',
              borderRadius: '50px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              position: 'relative',
              overflow: 'hidden',
            }}
            whileHover={{ scale: 1.1, boxShadow: '0 0 30px rgba(201,169,110,0.4)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C9A96E'; e.currentTarget.style.color = '#1E3422'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#C9A96E'; }}
          >
            <motion.span
              style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)' }}
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
            />
            <span style={{ position: 'relative', zIndex: 1 }}>Commander</span>
          </motion.button>
        </div>

        {/* Barre de progression en bas */}
        <div className="absolute bottom-8 left-0 right-0 px-12" style={{ zIndex: 30 }}>
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <div
                key={index}
                onClick={() => goToSlide(index)}
                className="flex-1 h-1 rounded-full overflow-hidden cursor-pointer"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(to right, white, #f5dfa0, white)',
                    boxShadow: index === currentIndex ? '0 0 10px rgba(201,169,110,0.8)' : 'none',
                  }}
                  animate={{ width: index === currentIndex ? `${progress}%` : index < currentIndex ? '100%' : '0%' }}
                  transition={{ duration: index === currentIndex ? 0.1 : 0.3, ease: 'linear' }}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
