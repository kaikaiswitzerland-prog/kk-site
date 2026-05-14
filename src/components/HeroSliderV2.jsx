// src/components/HeroSliderV2.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback.jsx";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const GOLD = "#C9A96E";
const DURATION = 5500;

const SLIDES = [
  {
    name: "Tahiti",
    category: "POISSON CRU",
    price: "22.90 CHF",
    description: "Thon rouge mariné au citron vert, gingembre frais, sauce coco légère et herbes fraîches",
    image: "/hero-tartare-coco.jpg",
  },
  {
    name: "Hawaï",
    category: "POISSON CRU",
    price: "22.90 CHF",
    description: "Thon rouge, mangue fraîche, ananas grillé, sauce sésame toastée maison",
    image: "/froid-kaikai.jpg",
  },
  {
    name: "Chao Men",
    category: "PLAT CHAUD",
    price: "18.90 CHF",
    description: "Nouilles sautées au wok, porc fondant, sauce crevettes parfumée et légumes croquants",
    image: "/hero-chaomen-v2.jpg",
  },
  {
    name: "Kai Fan",
    category: "PLAT CHAUD",
    price: "18.90 CHF",
    description: "Riz sauté au wok, porc caramélisé, sauce champignons noirs et oignons dorés",
    image: "/hero-kaifan-v2.jpg",
  },
  {
    name: "Coulant Chocolat",
    category: "DESSERT",
    price: "9.90 CHF",
    description: "Coulant au chocolat noir fondant, cœur coulant, servi chaud à la commande",
    image: "/dessert-coulant.jpg",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
  exit: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
};

const containerVariantsMobile = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
  exit: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -14, transition: { duration: 0.3, ease: "easeIn" } },
};

export default function HeroSliderV2() {
  const N = SLIDES.length;
  const [cur, setCur] = useState(0);
  const [progress, setProgress] = useState(0);
  const [swipePaused, setSwipePaused] = useState(false);
  const progressStart = useRef(Date.now());
  const rafRef = useRef(0);
  const swipePauseRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isSwiping = useRef(false);

  const go = useCallback((idx) => {
    setCur(idx);
    setProgress(0);
    progressStart.current = Date.now();
  }, []);

  const goNext = useCallback(() => {
    setCur((c) => (c + 1) % N);
    setProgress(0);
    progressStart.current = Date.now();
  }, [N]);

  const goPrev = useCallback(() => {
    setCur((c) => (c - 1 + N) % N);
    setProgress(0);
    progressStart.current = Date.now();
  }, [N]);

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStartX.current === null) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (!isSwiping.current && (dx > 5 || dy > 5)) {
      isSwiping.current = dx > dy;
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null || !isSwiping.current) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) >= 60) {
      if (delta > 0) goNext();
      else goPrev();
      clearTimeout(swipePauseRef.current);
      setSwipePaused(true);
      swipePauseRef.current = setTimeout(() => setSwipePaused(false), 8000);
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
  }, [goNext, goPrev]);

  useEffect(() => {
    if (swipePaused) return;
    const id = setInterval(goNext, DURATION);
    return () => clearInterval(id);
  }, [swipePaused, goNext]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (swipePaused) { setProgress(0); return; }
    progressStart.current = Date.now();
    setProgress(0);
    const tick = () => {
      const p = Math.min((Date.now() - progressStart.current) / DURATION, 1);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cur, swipePaused]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(swipePauseRef.current);
  }, []);

  const slide = SLIDES[cur];

  const scrollToMenu = () => {
    const el = document.getElementById("section-entrees");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ height: "calc(100vh - 60px)" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Fullscreen image — crossfade + Ken Burns */}
      <AnimatePresence initial={false}>
        <motion.div
          key={`img-${cur}`}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1.12 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.2, ease: "easeInOut" },
            scale: { duration: 7, ease: "linear" },
          }}
        >
          <ImageWithFallback
            src={slide.image}
            alt={slide.name}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Linear gradient overlay — 5 stops */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 25%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.35) 75%, rgba(0,0,0,0.8) 100%)",
        }}
      />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.45) 100%)",
        }}
      />


      {/* ── DESKTOP: text bottom-left ── */}
      <div className="absolute bottom-[12%] left-[5%] max-w-[45%] z-10 pointer-events-none max-md:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`desktop-info-${cur}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col"
          >
            <motion.p
              variants={itemVariants}
              className="uppercase mb-2"
              style={{ fontSize: "0.7rem", letterSpacing: "0.25em", color: GOLD }}
            >
              {slide.category}
            </motion.p>
            <motion.h2
              variants={itemVariants}
              className="text-white"
              style={{
                fontSize: "clamp(48px, 7vw, 90px)",
                fontFamily: "'Bebas Neue', Impact, sans-serif",
                lineHeight: 0.95,
                letterSpacing: "0.02em",
              }}
            >
              {slide.name}
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-white/90 mt-2"
              style={{
                fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)",
                fontFamily: "'Playfair Display', serif",
                fontStyle: "italic",
              }}
            >
              {slide.price}
            </motion.p>
            <motion.p
              variants={itemVariants}
              className="text-white/50 mt-1.5"
              style={{ fontSize: "clamp(0.78rem, 1.3vw, 0.92rem)", lineHeight: 1.6, maxWidth: "28ch" }}
            >
              {slide.description}
            </motion.p>
            <motion.div variants={itemVariants} className="mt-5 pointer-events-auto">
              <button
                onClick={scrollToMenu}
                style={{
                  borderRadius: 0,
                  border: `1.5px solid ${GOLD}`,
                  background: "transparent",
                  color: GOLD,
                  padding: "10px 32px",
                  fontSize: "0.8rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Voir le menu
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>


      {/* ── MOBILE: prev/next arrows ── */}
      <button
        onClick={goPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full md:hidden"
        style={{
          background: "rgba(0,0,0,0.35)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(8px)",
        }}
      >
        <ChevronLeft className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={goNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full md:hidden"
        style={{
          background: "rgba(0,0,0,0.35)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(8px)",
        }}
      >
        <ChevronRight className="w-4 h-4 text-white" />
      </button>

      {/* ── MOBILE: text centered ── */}
      <div className="absolute bottom-[14%] left-0 right-0 z-10 flex flex-col items-center text-center px-10 pointer-events-none md:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`mobile-info-${cur}`}
            variants={containerVariantsMobile}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center"
          >
            <motion.div variants={itemVariants} className="flex items-center gap-2 mb-2">
              <div style={{ width: 24, height: 1, background: `${GOLD}80` }} />
              <span
                className="uppercase"
                style={{ fontSize: "0.65rem", letterSpacing: "0.25em", color: GOLD }}
              >
                {slide.category}
              </span>
              <div style={{ width: 24, height: 1, background: `${GOLD}80` }} />
            </motion.div>
            <motion.h2
              variants={itemVariants}
              className="text-white"
              style={{
                fontSize: "clamp(40px, 10vw, 72px)",
                fontFamily: "'Bebas Neue', Impact, sans-serif",
                lineHeight: 0.95,
                letterSpacing: "0.02em",
              }}
            >
              {slide.name}
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-white/90 mt-1.5"
              style={{ fontSize: "1.1rem", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
            >
              {slide.price}
            </motion.p>
            <motion.p
              variants={itemVariants}
              className="text-white/50 mt-1"
              style={{ fontSize: "0.8rem", lineHeight: 1.5 }}
            >
              {slide.description}
            </motion.p>
            <motion.div variants={itemVariants} className="mt-4 pointer-events-auto">
              <button
                onClick={scrollToMenu}
                style={{
                  borderRadius: 0,
                  border: `1.5px solid ${GOLD}`,
                  background: "transparent",
                  color: GOLD,
                  padding: "8px 24px",
                  fontSize: "0.75rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Voir le menu
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Progress bar bottom ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] flex z-10 pointer-events-none">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className="relative flex-1 h-full overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.1)",
              marginRight: i < N - 1 ? 1 : 0,
            }}
          >
            <div
              className="absolute inset-y-0 left-0"
              style={{
                background: i === cur ? GOLD : i < cur ? "rgba(255,255,255,0.5)" : "transparent",
                width: i === cur ? `${progress * 100}%` : i < cur ? "100%" : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Scroll indicator — desktop only */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 pointer-events-none max-md:hidden"
        animate={{ y: [0, 6, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-white/30 uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.2em" }}>
          Menu
        </span>
        <ChevronDown className="w-4 h-4 text-white/30" />
      </motion.div>
    </div>
  );
}
