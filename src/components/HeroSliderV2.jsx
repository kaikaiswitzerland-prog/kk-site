// src/components/HeroSliderV2.jsx — Hero carousel Framer Motion style
// Images locales, sans TypeScript, sans figma:asset
import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, useSpring } from 'motion/react';

const slides = [
  {
    name: 'Tahiti',
    category: 'POISSON',
    price: '22.90 CHF',
    description: 'Thon rouge, citron vert, gingembre, sauce coco',
    image: '/froid-tahitien.jpg',
    bg: '#0e2a1a',
    categoryWord: 'POISSON',
  },
  {
    name: 'Hawaï',
    category: 'POISSON',
    price: '22.90 CHF',
    description: 'Thon rouge, mangue, ananas, sauce sésame',
    image: '/froid-kaikai.jpg',
    bg: '#2a1800',
    categoryWord: 'POISSON',
  },
  {
    name: 'Manoa',
    category: 'POISSON',
    price: '24.90 CHF',
    description: 'Thon rouge, sauce arachide, guacamole maison',
    image: '/froid-mokai.jpg',
    bg: '#1a1200',
    categoryWord: 'POISSON',
  },
  {
    name: 'Chao Men',
    category: 'CHAUD',
    price: '18.90 CHF',
    description: 'Nouilles sautées, wok de porc, sauce crevettes',
    image: '/chaud-chaomen.jpg',
    bg: '#200a0a',
    categoryWord: 'CHAUD',
  },
  {
    name: 'Kai Fan',
    category: 'CHAUD',
    price: '18.90 CHF',
    description: 'Riz sauté, wok de porc, sauce champignons',
    image: '/chaud-kaifan.jpg',
    bg: '#0a1a0a',
    categoryWord: 'CHAUD',
  },
  {
    name: 'Coulant Chocolat',
    category: 'DESSERT',
    price: '9.90 CHF',
    description: 'Coulant fondant, servi chaud',
    image: '/dessert-coulant.jpg',
    bg: '#100a00',
    categoryWord: 'DESSERT',
  },
];

export default function HeroSliderV2() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const dragX = useMotionValue(0);
  const dragRotation = useTransform(dragX, [-300, 300], [-15, 15]);
  const dragScale = useTransform(dragX, [-300, 0, 300], [0.85, 1, 0.85]);

  const mouseX = useSpring(0.5, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(0.5, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(mouseY, [0, 1], [8, -8]);
  const rotateY = useTransform(mouseX, [0, 1], [-10, 10]);

  const containerRef = useRef(null);
  const currentSlide = slides[currentIndex];

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + 100 / 50;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [currentIndex, isPaused]);

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setProgress(0);
  };

  const goToPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  };

  const handleDragEnd = (_, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (Math.abs(offset) > 80 || Math.abs(velocity) > 500) {
      if (offset > 0) goToPrev();
      else goToNext();
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

  // Particules d'ambiance (stables, générées une seule fois)
  const particles = useRef(
    Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
    }))
  ).current;

  const slideVariants = {
    enter: (d) => ({
      x: d > 0 ? '120%' : '-120%',
      rotateZ: d > 0 ? 25 : -25,
      scale: 0.6,
      opacity: 0,
      filter: 'blur(10px)',
    }),
    center: {
      x: 0,
      rotateZ: 0,
      scale: 1,
      opacity: 1,
      filter: 'blur(0px)',
    },
    exit: (d) => ({
      x: d > 0 ? '-120%' : '120%',
      rotateZ: d > 0 ? -25 : 25,
      scale: 0.6,
      opacity: 0,
      filter: 'blur(10px)',
    }),
  };

  const categoryWordVariants = {
    enter: (d) => ({
      x: d > 0 ? '100%' : '-100%',
      scale: 1.5,
      rotateZ: d > 0 ? 15 : -15,
      opacity: 0,
      filter: 'blur(20px)',
    }),
    center: {
      x: 0,
      scale: 1,
      rotateZ: 0,
      opacity: 0.08,
      filter: 'blur(0px)',
    },
    exit: (d) => ({
      x: d > 0 ? '-100%' : '100%',
      scale: 0.8,
      rotateZ: d > 0 ? -15 : 15,
      opacity: 0,
      filter: 'blur(20px)',
    }),
  };

  return (
    <motion.div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: currentSlide.bg,
        perspective: '1800px',
        fontFamily: "'DM Sans', sans-serif",
        cursor: 'grab',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsPaused(true)}
      animate={{ backgroundColor: currentSlide.bg }}
      transition={{ duration: 0.8, ease: [0.6, 0.01, 0.05, 0.95] }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {/* Particules d'ambiance */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5, overflow: 'hidden' }}>
          {particles.map((p, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.3)',
                left: `${p.x}%`,
                top: `${p.y}%`,
              }}
              animate={{ scale: [0, 1, 0], opacity: [0, 0.6, 0], y: [-20, -100] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeOut' }}
            />
          ))}
        </div>

        {/* Dégradé sombre gauche */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.30) 50%, transparent 100%)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />

        {/* Mot catégorie géant derrière */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide.categoryWord + currentIndex}
              custom={direction}
              variants={categoryWordVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 1.2,
                ease: [0.6, 0.01, 0.05, 0.95],
                scale: { type: 'spring', stiffness: 100, damping: 15 },
              }}
              style={{
                fontFamily: "'Bebas Neue', Impact, 'Arial Black', sans-serif",
                fontSize: 'clamp(140px, 20vw, 280px)',
                letterSpacing: '0.35em',
                color: 'white',
                opacity: 0.08,
                whiteSpace: 'nowrap',
                userSelect: 'none',
                textShadow: '0 0 40px rgba(255,255,255,0.1)',
              }}
            >
              {currentSlide.categoryWord}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Image bol central */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 1.4,
                ease: [0.6, 0.01, 0.05, 0.95],
                scale: { type: 'spring', stiffness: 80, damping: 12 },
                rotateZ: { type: 'spring', stiffness: 60, damping: 15 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDragEnd={handleDragEnd}
              style={{ x: dragX, rotate: dragRotation, scale: dragScale }}
            >
              {/* Halo glow derrière bol */}
              <motion.div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '420px',
                  height: '420px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(201,169,110,0.4) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                  transform: 'scale(1.2)',
                }}
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1.2, 1.4, 1.2] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              <motion.div
                style={{
                  borderRadius: '50%',
                  overflow: 'hidden',
                  position: 'relative',
                  width: 'clamp(280px, 42vmin, 420px)',
                  height: 'clamp(280px, 42vmin, 420px)',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(201,169,110,0.2)',
                }}
                whileHover={{ scale: 1.05, boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 80px rgba(201,169,110,0.3)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* Bordure animée */}
                <motion.div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '2px solid rgba(201,169,110,0.3)',
                    zIndex: 1,
                  }}
                  animate={{ borderColor: ['rgba(201,169,110,0.3)', 'rgba(201,169,110,0.6)', 'rgba(201,169,110,0.3)'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.img
                  src={currentSlide.image}
                  alt={currentSlide.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  draggable={false}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.5, ease: [0.6, 0.01, 0.05, 0.95] }}
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Logo KaïKaï en haut */}
        <div
          style={{
            position: 'absolute',
            top: '48px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 30,
            pointerEvents: 'none',
          }}
        >
          <motion.h1
            style={{
              fontFamily: "'Bebas Neue', Impact, 'Arial Black', sans-serif",
              fontSize: '48px',
              color: 'white',
              letterSpacing: '0.1em',
              margin: 0,
              textShadow: '0 0 20px rgba(201,169,110,0.3)',
            }}
            animate={{
              textShadow: [
                '0 0 20px rgba(201,169,110,0.3)',
                '0 0 30px rgba(201,169,110,0.5)',
                '0 0 20px rgba(201,169,110,0.3)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            KaïKaï
          </motion.h1>
        </div>

        {/* Infos bas-gauche */}
        <div
          style={{
            position: 'absolute',
            bottom: '96px',
            left: '48px',
            zIndex: 30,
            pointerEvents: 'none',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex + 'info'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8, type: 'spring', stiffness: 100, damping: 12 }}
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  color: '#C9A96E',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}
              >
                {currentSlide.category}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.9, type: 'spring', stiffness: 80, damping: 15 }}
                style={{
                  fontFamily: "'Bebas Neue', Impact, 'Arial Black', sans-serif",
                  fontSize: 'clamp(42px, 6vw, 80px)',
                  color: 'white',
                  lineHeight: 0.9,
                  margin: '0 0 16px',
                  letterSpacing: '0.05em',
                  textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                }}
              >
                {currentSlide.name.split('').map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.5, type: 'spring', stiffness: 200, damping: 10 }}
                    style={{ display: 'inline-block' }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.6, type: 'spring', stiffness: 150, damping: 12 }}
                style={{ fontSize: '20px', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}
              >
                {currentSlide.price}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.7, ease: [0.6, 0.01, 0.05, 0.95] }}
                style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', maxWidth: '360px' }}
              >
                {currentSlide.description}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bouton Commander bas-droite */}
        <div style={{ position: 'absolute', bottom: '96px', right: '48px', zIndex: 30 }}>
          <motion.button
            onClick={() => {
              const el = document.getElementById('section-entrees');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              fontSize: '14px',
              letterSpacing: '0.1em',
              color: '#C9A96E',
              border: '2px solid #C9A96E',
              backgroundColor: 'transparent',
              padding: '14px 32px',
              borderRadius: '50px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              position: 'relative',
              overflow: 'hidden',
            }}
            whileHover={{ scale: 1.1, boxShadow: '0 0 30px rgba(201,169,110,0.4)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#C9A96E';
              e.currentTarget.style.color = '#1E3422';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#C9A96E';
            }}
          >
            <motion.span
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)',
              }}
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
            />
            <span style={{ position: 'relative', zIndex: 1 }}>Commander</span>
          </motion.button>
        </div>

        {/* Barre de progression segmentée */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            padding: '0 48px 32px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            {slides.map((_, index) => (
              <motion.div
                key={index}
                onClick={() => { setCurrentIndex(index); setProgress(0); }}
                style={{
                  flex: 1,
                  height: '4px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
                whileHover={{ scaleY: 1.5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <motion.div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(to right, white, #f5dfa0, white)',
                    borderRadius: '9999px',
                    width:
                      index === currentIndex
                        ? `${progress}%`
                        : index < currentIndex
                        ? '100%'
                        : '0%',
                    boxShadow: index === currentIndex ? '0 0 10px rgba(201,169,110,0.8)' : 'none',
                    transition: index === currentIndex ? 'width 0.1s linear' : 'width 0.3s ease',
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Dégradé bas vers le menu */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 140,
            background: 'linear-gradient(to bottom, transparent, #000)',
            zIndex: 6,
            pointerEvents: 'none',
          }}
        />
      </motion.div>
    </motion.div>
  );
}
