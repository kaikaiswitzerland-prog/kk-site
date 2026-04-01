// src/components/HeroSliderV2.jsx — adapté depuis Figma Make
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback.jsx";
import { ChevronDown } from "lucide-react";

const SLIDES = [
  { name: "Tahiti",           category: "POISSON", price: "22.90 CHF", description: "Thon rouge, citron vert, gingembre, sauce coco",  bgGradient: "radial-gradient(ellipse at 50% 50%, #1a4a2e 0%, #0e2a1a 55%, #061208 100%)", accentColor: "#2a6644", image: "/froid-tahitien.jpg"  },
  { name: "Hawaï",            category: "POISSON", price: "22.90 CHF", description: "Thon rouge, mangue, ananas, sauce sésame",        bgGradient: "radial-gradient(ellipse at 50% 50%, #4a2e00 0%, #2a1800 55%, #100800 100%)", accentColor: "#c47a2a", image: "/froid-kaikai.jpg"   },
  { name: "Chao Men",         category: "CHAUD",   price: "18.90 CHF", description: "Nouilles sautées, wok de porc, sauce crevettes",  bgGradient: "radial-gradient(ellipse at 50% 50%, #3a1010 0%, #200a0a 55%, #0e0404 100%)", accentColor: "#8b2a1a", image: "/chaud-chaomen.jpg"  },
  { name: "Kai Fan",          category: "CHAUD",   price: "18.90 CHF", description: "Riz sauté, wok de porc, sauce champignons",       bgGradient: "radial-gradient(ellipse at 50% 50%, #142a14 0%, #0a1a0a 55%, #040a04 100%)", accentColor: "#2a5a1a", image: "/chaud-kaifan.jpg"   },
  { name: "Coulant Chocolat", category: "DESSERT", price: "9.90 CHF",  description: "Coulant fondant, servi chaud",                    bgGradient: "radial-gradient(ellipse at 50% 50%, #241200 0%, #100a00 55%, #080400 100%)", accentColor: "#5a2a00", image: "/dessert-coulant.jpg" },
];

// Floating particles component — fix 4: useMemo pour stabiliser les positions aléatoires
function FloatingParticles({ accentColor }) {
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 4,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: accentColor,
            opacity: 0.3,
          }}
          animate={{
            y: [0, -60, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Animated text with mask reveal
function MaskRevealText({ children, delay = 0, className = "", style = {} }) {
  return (
    <div className="overflow-hidden">
      <motion.div
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        exit={{ y: "-110%" }}
        transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
        className={className}
        style={style}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default function HeroSliderV2() {
  const N = SLIDES.length;
  const [cur, setCur] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [swipePaused, setSwipePaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const progressStart = useRef(Date.now());
  const rafRef = useRef(0);
  const swipePauseRef = useRef(null);
  const touchStartX = useRef(null);

  const goTo = useCallback((idx) => {
    setDirection(idx > cur ? 1 : -1);
    setCur(idx);
    progressStart.current = Date.now();
  }, [cur]);

  const goNext = useCallback(() => {
    setDirection(1);
    setCur((c) => (c + 1) % N);
    progressStart.current = Date.now();
  }, [N]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCur((c) => (c - 1 + N) % N);
    progressStart.current = Date.now();
  }, [N]);

  // Fix 1 : support touch swipe
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) >= 60) {
      if (delta > 0) goNext();
      else goPrev();
      clearTimeout(swipePauseRef.current);
      setSwipePaused(true);
      swipePauseRef.current = setTimeout(() => setSwipePaused(false), 8000);
    }
    touchStartX.current = null;
  }, [goNext, goPrev]);

  useEffect(() => {
    if (hoverPaused || swipePaused) return;
    const id = setInterval(goNext, 5000);
    return () => clearInterval(id);
  }, [hoverPaused, swipePaused, goNext]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (hoverPaused || swipePaused) { setProgress(0); return; }
    progressStart.current = Date.now();
    setProgress(0);
    const tick = () => {
      const p = Math.min((Date.now() - progressStart.current) / 5000, 1);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cur, hoverPaused, swipePaused]);

  const slide = SLIDES[cur];

  const scrollToMenu = () => {
    const el = document.getElementById("section-entrees");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ height: "calc(100vh - 60px)" }}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated background */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`bg-${cur}`}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          style={{ background: slide.bgGradient }}
        />
      </AnimatePresence>

      {/* Film grain overlay */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      <FloatingParticles accentColor={slide.accentColor} />

      {/* Horizontal decorative lines */}
      <motion.div
        className="absolute top-[20%] left-0 right-0 h-px z-[2] pointer-events-none"
        style={{ background: "rgba(255,255,255,0.04)" }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      <motion.div
        className="absolute bottom-[25%] left-0 right-0 h-px z-[2] pointer-events-none"
        style={{ background: "rgba(255,255,255,0.04)" }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
      />

      {/* Central image with 3D effect */}
      <div className="absolute inset-0 flex items-center justify-center z-[3]">
        {/* Orbiting ring — fix 5: clamp min réduit à 260px */}
        <motion.div
          className="absolute rounded-full border pointer-events-none"
          style={{
            width: "clamp(260px, 58vmin, 640px)",
            height: "clamp(260px, 58vmin, 640px)",
            borderColor: `${slide.accentColor}22`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            className="absolute -top-1 left-1/2 w-2 h-2 rounded-full"
            style={{ background: slide.accentColor, opacity: 0.5 }}
          />
        </motion.div>

        {/* Glow pulse */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: "clamp(300px, 52vmin, 580px)",
            height: "clamp(300px, 52vmin, 580px)",
          }}
          animate={{
            boxShadow: [
              `0 0 60px 20px ${slide.accentColor}15`,
              `0 0 100px 40px ${slide.accentColor}25`,
              `0 0 60px 20px ${slide.accentColor}15`,
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Bowl image */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`bowl-${cur}`}
            className="relative rounded-full overflow-hidden shrink-0"
            style={{
              width: "clamp(260px, 48vmin, 500px)",
              height: "clamp(260px, 48vmin, 500px)",
              boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 40px 120px rgba(0,0,0,0.5), 0 0 60px ${slide.accentColor}30`,
            }}
            initial={{
              scale: 0.8,
              rotate: direction * 20,
              opacity: 0,
              filter: "blur(10px)",
            }}
            animate={{
              scale: 1,
              rotate: 0,
              opacity: 1,
              filter: "blur(0px)",
              y: [0, -10, 0],
            }}
            exit={{
              scale: 0.8,
              rotate: direction * -20,
              opacity: 0,
              filter: "blur(10px)",
            }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
            }}
          >
            <ImageWithFallback
              src={slide.image}
              alt={slide.name}
              className="w-full h-full object-cover"
            />
            {/* Subtle shine sweep */}
            <motion.div
              className="absolute inset-0"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)",
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Large background category text */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`cat-text-${cur}`}
            className="absolute pointer-events-none select-none z-[-1]"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -30 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: "clamp(100px, 20vw, 220px)",
              fontFamily: "'Bebas Neue', Impact, sans-serif",
              color: "rgba(255,255,255,0.05)",
              textTransform: "uppercase",
              letterSpacing: "0.3em",
              lineHeight: 1,
            }}
          >
            {slide.category}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Text info + CTA mobile — bottom left */}
      <div className="absolute bottom-[12%] left-[5%] max-w-[55%] z-10 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div key={`info-${cur}`} className="flex flex-col">
            {/* Category tag */}
            <MaskRevealText delay={0.1}>
              <div className="inline-flex items-center gap-2 mb-3">
                <motion.div
                  className="h-px bg-[#C9A96E]"
                  initial={{ width: 0 }}
                  animate={{ width: 32 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                />
                <span
                  className="text-[#C9A96E] uppercase"
                  style={{ fontSize: "0.7rem", letterSpacing: "0.25em" }}
                >
                  {slide.category}
                </span>
              </div>
            </MaskRevealText>

            {/* Dish name */}
            <MaskRevealText delay={0.2}>
              <h2
                className="text-white"
                style={{
                  fontSize: "clamp(48px, 7vw, 90px)",
                  fontFamily: "'Bebas Neue', Impact, sans-serif",
                  lineHeight: 0.95,
                  letterSpacing: "0.02em",
                }}
              >
                {slide.name}
              </h2>
            </MaskRevealText>

            {/* Price */}
            <MaskRevealText delay={0.35} style={{ marginTop: 8 }}>
              <span
                className="text-white/90"
                style={{
                  fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)",
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: "italic",
                }}
              >
                {slide.price}
              </span>
            </MaskRevealText>

            {/* Description */}
            <MaskRevealText delay={0.45} style={{ marginTop: 6 }}>
              <p
                className="text-white/50"
                style={{ fontSize: "clamp(0.78rem, 1.3vw, 0.92rem)", lineHeight: 1.6, maxWidth: "28ch" }}
              >
                {slide.description}
              </p>
            </MaskRevealText>

            {/* Fix 2 : CTA mobile — sous le texte, colonne, visible uniquement mobile */}
            <div className="mt-5 md:hidden pointer-events-auto">
              <motion.button
                onClick={scrollToMenu}
                className="group relative px-8 py-3 rounded-full cursor-pointer overflow-hidden"
                style={{ border: "1.5px solid #C9A96E", background: "transparent", color: "#C9A96E" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                <motion.div
                  className="absolute inset-0 bg-[#C9A96E]"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "0%" }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  style={{ zIndex: 0 }}
                />
                <span
                  className="relative z-10 uppercase group-hover:text-black transition-colors duration-300"
                  style={{ fontSize: "0.8rem", letterSpacing: "0.2em" }}
                >
                  Commander
                </span>
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA — bottom right (desktop uniquement) */}
      <motion.div
        className="absolute bottom-[12%] right-[5%] z-10 hidden md:flex flex-col items-end gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <motion.button
          onClick={scrollToMenu}
          className="group relative px-8 py-3 rounded-full cursor-pointer overflow-hidden"
          style={{
            border: "1.5px solid #C9A96E",
            background: "transparent",
            color: "#C9A96E",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.div
            className="absolute inset-0 bg-[#C9A96E]"
            initial={{ x: "-100%" }}
            whileHover={{ x: "0%" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{ zIndex: 0 }}
          />
          <span
            className="relative z-10 uppercase group-hover:text-black transition-colors duration-300"
            style={{ fontSize: "0.8rem", letterSpacing: "0.2em" }}
          >
            Commander
          </span>
        </motion.button>
      </motion.div>

      {/* Slide indicators — vertical right side (desktop uniquement) */}
      <div className="absolute right-[5%] top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3 max-md:hidden">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="group relative flex items-center justify-center cursor-pointer"
            style={{ width: 20, height: 20 }}
          >
            <motion.div
              className="rounded-full"
              style={{ background: i === cur ? "#C9A96E" : "rgba(255,255,255,0.25)" }}
              animate={{ width: i === cur ? 10 : 5, height: i === cur ? 10 : 5 }}
              transition={{ duration: 0.3 }}
            />
            {i === cur && (
              <motion.div
                className="absolute rounded-full border border-[#C9A96E]/40"
                style={{ width: 18, height: 18 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Fix 3 : Dots horizontaux mobile (au-dessus de la progress bar) */}
      <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 z-10 flex gap-3 md:hidden">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="relative flex items-center justify-center cursor-pointer"
            style={{ width: 16, height: 16 }}
          >
            <motion.div
              className="rounded-full"
              style={{ background: i === cur ? "#C9A96E" : "rgba(255,255,255,0.25)" }}
              animate={{ width: i === cur ? 8 : 5, height: i === cur ? 8 : 5 }}
              transition={{ duration: 0.3 }}
            />
            {i === cur && (
              <motion.div
                className="absolute rounded-full border border-[#C9A96E]/40"
                style={{ width: 14, height: 14 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Progress bar — bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] flex z-10 pointer-events-none">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-full overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.1)",
              marginRight: i < N - 1 ? 2 : 0,
            }}
          >
            <motion.div
              className="h-full"
              style={{
                background: i === cur ? "#C9A96E" : "rgba(255,255,255,0.5)",
                width: i === cur ? `${progress * 100}%` : i < cur ? "100%" : "0%",
              }}
              transition={{ duration: 0.1 }}
            />
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 pointer-events-none"
        animate={{ y: [0, 6, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-white/30 uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.2em" }}>
          Menu
        </span>
        <ChevronDown className="w-4 h-4 text-white/30" />
      </motion.div>

      {/* Bottom gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-[5]"
        style={{ background: "linear-gradient(to bottom, transparent, #000)" }}
      />
    </div>
  );
}
