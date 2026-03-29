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
  enter: (direction) => ({
    x: direction > 0 ? '120%' : '-120%',
    rotateZ: direction > 0 ? 25 : -25,
    scale: 0.6,
    opacity: 0,
    filter: 'blur(10px)',
  }),
  center: { x: 0, rotateZ: 0, scale: 1, opacity: 1, filter: 'blur(0px)' },
  exit: (direction) => ({
    x: direction > 0 ? '-120%' : '120%',
    rotateZ: direction > 0 ? -25 : 25,
    scale: 0.6,
    opacity: 0,
    filter: 'blur(10px)',
  }),
};

const categoryWordVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    scale: 1.5,
    rotateZ: direction > 0 ? 15 : -15,
    opacity: 0,
    filter: 'blur(20px)',
  }),
  center: { x: 0, scale: 1, rotateZ: 0, opacity: 0.08, filter: 'blur(0px)' },
  exit: (direction) => ({
    x: direction > 0 ? '-100%' : '100%',
    scale: 0.8,
    rotateZ: direction > 0 ? -15 : 15,
    opacity: 0,
    filter: 'blur(20px)',
  }),
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
// COMPOSANT PRINCIPAL
// ============================================================
export default function HeroSliderV2() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction,    setDirection]    = useState(1);
  const [isPaused,     setIsPaused]     = useState(false);
  const [progress,     setProgress]     = useState(0);

  const dragX       = useMotionValue(0);
  const dragRotation = useTransform(dragX, [-300, 300], [-15, 15]);
  const dragScale    = useTransform(dragX, [-300, 0, 300], [0.85, 1, 0.85]);

  const mouseX = useSpring(0.5, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(0.5, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(mouseY, [0, 1], [2, -2]);
  const rotateY = useTransform(mouseX, [0, 1], [-3, 3]);

  const containerRef  = useRef(null);
  const currentSlide  = slides[currentIndex];

  // Autoplay + progress
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { goToNext(); return 0; }
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

  const goToSlide = (index) => {
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
        <div className="absolute inset-0 pointer-events-none z-5 overflow-hidden">
          {particles.map((particle, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 rounded-full"
              style={{ left: `${particle.x}%`, top: `${particle.y}%`, backgroundColor: 'rgba(255,255,255,0.3)' }}
              animate={{ scale: [0, 1, 0], opacity: [0, 0.6, 0], y: [-20, -100] }}
              transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: 'easeOut' }}
            />
          ))}
        </div>

        {/* Gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent z-10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />

        {/* Mot catégorie géant en arrière-plan */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-0">
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
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(200px, 20vw, 280px)',
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

        {/* Image du plat au centre */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
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
              className="cursor-grab active:cursor-grabbing"
            >
              {/* Glow doré derrière l'image */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  width: '420px',
                  height: '420px',
                  background: 'radial-gradient(circle, rgba(201,169,110,0.4) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                  transform: 'scale(1.2)',
                }}
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1.2, 1.4, 1.2] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Image circulaire */}
              <motion.div
                className="rounded-full overflow-hidden relative"
                style={{
                  width: '420px',
                  height: '420px',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(201,169,110,0.2)',
                }}
                whileHover={{ scale: 1.05, boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 80px rgba(201,169,110,0.3)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* Bordure dorée animée */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ border: '2px solid rgba(201,169,110,0.3)' }}
                  animate={{ borderColor: ['rgba(201,169,110,0.3)', 'rgba(201,169,110,0.6)', 'rgba(201,169,110,0.3)'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.img
                  src={currentSlide.image}
                  alt={currentSlide.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.5, ease: [0.6, 0.01, 0.05, 0.95] }}
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Logo KaïKaï en haut au centre */}
        <div className="absolute top-12 left-0 right-0 flex justify-center z-30 pointer-events-none">
          <motion.h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '48px',
              color: 'white',
              letterSpacing: '0.1em',
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

        {/* Infos du plat en bas à gauche */}
        <div className="absolute bottom-24 left-6 md:left-12 z-30 pointer-events-none max-w-[50%] md:max-w-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex + 'info'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 60, rotateX: -90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.4, duration: 0.8, type: 'spring', stiffness: 100, damping: 12 }}
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  color: '#C9A96E',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                  textShadow: '0 0 10px rgba(201,169,110,0.5)',
                }}
              >
                {currentSlide.category}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, x: -100, rotateY: -45 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ delay: 0.5, duration: 0.9, type: 'spring', stiffness: 80, damping: 15 }}
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 'clamp(40px, 10vw, 80px)',
                  color: 'white',
                  lineHeight: 0.9,
                  marginBottom: '16px',
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
                style={{ fontSize: 'clamp(16px, 3vw, 20px)', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}
              >
                {currentSlide.price}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.7, ease: [0.6, 0.01, 0.05, 0.95] }}
                style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', color: 'rgba(255,255,255,0.5)', maxWidth: '400px' }}
              >
                {currentSlide.description}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bouton Commander en bas à droite */}
        <div className="absolute bottom-28 md:bottom-24 right-6 md:right-12 z-30">
          <motion.button
            onClick={() => { const el = document.getElementById('section-entrees'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
            style={{
              fontFamily: "'DM Sans', sans-serif",
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
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)' }}
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
            />
            <span className="relative z-10">Commander</span>
          </motion.button>
        </div>

        {/* Barre de progression en bas */}
        <div className="absolute bottom-8 left-0 right-0 z-30 px-12">
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <motion.div
                key={index}
                className="flex-1 h-1 rounded-full overflow-hidden cursor-pointer"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                onClick={() => goToSlide(index)}
                whileHover={{ scale: 1.05, height: 6, backgroundColor: 'rgba(255,255,255,0.3)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-white via-amber-200 to-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: index === currentIndex ? `${progress}%` : index < currentIndex ? '100%' : '0%' }}
                  transition={{ duration: 0.1 }}
                  style={{ boxShadow: index === currentIndex ? '0 0 10px rgba(201,169,110,0.8)' : 'none' }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
