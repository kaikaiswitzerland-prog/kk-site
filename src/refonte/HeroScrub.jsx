// src/refonte/HeroScrub.jsx
//
// Hero vidéo « scrubbé » : le scroll ne fait pas défiler la vidéo, il la
// PILOTE. Un track de 380vh laisse la scène collée en haut de l'écran pendant
// que la position de scroll est convertie en `video.currentTime`.
//
// Trois précautions qui font toute la différence :
//
//   1. Lissage. On n'écrit jamais la position brute du scroll dans la vidéo :
//      une valeur cible est interpolée frame par frame (lerp 0.12) dans une
//      boucle requestAnimationFrame, sinon le rendu saccade à chaque cran de
//      molette. La boucle s'arrête d'elle-même une fois la cible atteinte.
//
//   2. iOS. Safari refuse tout `currentTime` tant que la vidéo n'a pas été
//      lue une fois à la suite d'un geste utilisateur. Un play() muet suivi
//      d'un pause() immédiat, au premier touchstart/scroll, débloque le seek
//      sans que rien ne se voie.
//
//   3. prefers-reduced-motion. Le scrub est un effet de mouvement piloté par
//      le scroll : sous cette préférence on le retire entièrement. La vidéo
//      repasse en autoplay/loop classique, le track reprend une hauteur
//      d'écran normale et le CTA est visible immédiatement.
//
// ⚠ Intégration dans le site actuel : `position: sticky` est neutralisé si un
// ancêtre a `overflow-x: hidden`. App.jsx en pose un sur html/body via
// globalStyles — à traiter le jour où le hero passe sur la page principale.

import { useCallback, useEffect, useRef, useState } from 'react';

const VIDEO_SRC = '/hero-bol.mp4';

// Part du scroll à partir de laquelle badges + CTA apparaissent.
const REVEAL_AT = 0.82;

// Facteur d'interpolation. Plus bas = plus doux mais plus « en retard » sur
// le doigt ; plus haut = plus réactif mais plus nerveux.
const LERP = 0.12;

// En-dessous de cet écart (en fraction de la durée), on considère la cible
// atteinte et on coupe la boucle rAF.
const SETTLE = 0.004;

const BADGES = ['halal', 'fait maison', 'livraison genève'];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export default function HeroScrub({ ctaTargetId = 'rf-entrees' }) {
  const trackRef = useRef(null);
  const videoRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  const [scrolled, setScrolled] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // React ne pose pas toujours la propriété `muted` sur l'élément à partir de
  // l'attribut JSX — et une vidéo non muette ne démarre nulle part sans geste.
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = true;
  }, []);

  // ─── Mode réduit : autoplay/loop, CTA visible d'emblée, aucun scrub ───────
  useEffect(() => {
    if (!reduced) return;
    setRevealed(true);
    setScrolled(true);
    const video = videoRef.current;
    if (video) {
      video.loop = true;
      video.play().catch(() => { /* autoplay refusé : la 1ʳᵉ frame suffit */ });
    }
  }, [reduced]);

  // ─── Scrub piloté par le scroll ──────────────────────────────────────────
  useEffect(() => {
    if (reduced) return;

    const track = trackRef.current;
    const video = videoRef.current;
    if (!track || !video) return;

    video.loop = false;
    video.pause();

    let rafId = 0;
    let target = 0;      // position visée, 0→1
    let current = 0;     // position réellement appliquée, lissée
    let running = false;
    let unlocked = false;

    // iOS : un seul play()/pause() muet suffit à autoriser les seeks suivants.
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      const played = video.play();
      if (played && typeof played.then === 'function') {
        played.then(() => video.pause()).catch(() => { /* sans geste : ignoré */ });
      } else {
        try { video.pause(); } catch { /* ignore */ }
      }
    };

    const progress = () => {
      const distance = track.offsetHeight - window.innerHeight;
      if (distance <= 0) return 0;
      const travelled = -track.getBoundingClientRect().top;
      return Math.min(1, Math.max(0, travelled / distance));
    };

    const tick = () => {
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) {
        running = false;
        return;
      }
      current += (target - current) * LERP;
      const settled = Math.abs(target - current) < SETTLE;
      if (settled) current = target;

      // Un seek encore en vol : on laisse passer cette frame plutôt que
      // d'empiler les demandes, le décodeur ne suivrait pas.
      let applied = false;
      if (!video.seeking) {
        // -0.03 s : se caler pile sur la fin fait parfois clignoter la
        // dernière frame selon le décodeur.
        const t = Math.max(0, Math.min(duration - 0.03, current * duration));
        try {
          video.currentTime = t;
          applied = true;
        } catch { /* seek refusé, la frame suivante retentera */ }
      }

      // On ne coupe la boucle qu'une fois la position finale RÉELLEMENT
      // écrite : s'arrêter sur une frame où le seek était en vol laisserait
      // la vidéo figée avant sa cible.
      if (settled && applied) {
        running = false;
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      unlock();
      target = progress();
      if (target > 0.002) setScrolled(true);
      setRevealed(target >= REVEAL_AT);
      kick();
    };

    // Position de départ : rechargement au milieu de la page, retour arrière
    // du navigateur, ou métadonnées arrivées après le premier scroll.
    const onReady = () => {
      target = progress();
      kick();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    video.addEventListener('loadedmetadata', onReady);
    if (video.readyState >= 1) onReady();

    return () => {
      cancelAnimationFrame(rafId);
      running = false;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('touchstart', unlock);
      video.removeEventListener('loadedmetadata', onReady);
    };
  }, [reduced]);

  const goToMenu = useCallback(() => {
    const el = document.getElementById(ctaTargetId);
    if (!el) return;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }, [ctaTargetId, reduced]);

  return (
    <div ref={trackRef} className={`rf-scrub${reduced ? ' rf-scrub--still' : ''}`}>
      <div className="rf-scrub__stage">
        <video
          ref={videoRef}
          className="rf-scrub__video"
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden="true"
          tabIndex={-1}
        />
        <div className="rf-scrub__scrim" aria-hidden="true" />

        <div className="rf-scrub__overlay">
          <div className="rf-scrub__head">
            <span className="rf-scrub__kicker">cuisine tahitienne · genève</span>
            <h1 className="rf-scrub__title">
              compose <em>ton wok</em>
            </h1>
          </div>

          <div
            className={`rf-scrub__actions${revealed ? ' rf-scrub__actions--on' : ''}`}
            aria-hidden={!revealed}
          >
            <ul className="rf-scrub__badges">
              {BADGES.map((badge) => (
                <li key={badge} className="rf-scrub__badge">{badge}</li>
              ))}
            </ul>
            <button
              type="button"
              className="rf-scrub__cta"
              onClick={goToMenu}
              tabIndex={revealed ? 0 : -1}
            >
              je commande
            </button>
          </div>
        </div>

        {!reduced && (
          <div
            className={`rf-scrub__hint${scrolled ? ' rf-scrub__hint--off' : ''}`}
            aria-hidden="true"
          >
            <span className="rf-scrub__hint-arrow">▼</span> scrolle
          </div>
        )}
      </div>
    </div>
  );
}
