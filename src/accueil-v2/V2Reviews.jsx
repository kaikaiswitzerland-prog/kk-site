// src/accueil-v2/V2Reviews.jsx
//
// Avis Google de la fiche KaïKaï, en cartes qui défilent en boucle.
//
// Source : src/data/reviews.js — avis transcrits à la main depuis la fiche
// Google (aucun appel réseau, aucune clé). Liste vide → la section n'existe
// pas. En-tête : « Avis Google », étoiles au prorata de la note moyenne
// affichée par la fiche (GOOGLE_RATING) et « 4,6 · 8 avis Google ».
//
// Carte : pastille ronde avec l'initiale (palette, pas de photo), prénom +
// initiale, badge Google éventuel (« Local Guide »), étoiles, mois et année,
// texte limité à 5 lignes avec « Lire la suite » qui déplie la carte, mention
// éventuelle sous l'avis (« Traduit de l'anglais par Google »).
//
// Défilement : la piste est un conteneur à défilement horizontal natif (donc
// défilable à la main, au doigt comme à la molette) que l'on fait avancer
// doucement par requestAnimationFrame ; les cartes sont dupliquées une fois
// pour boucler sans à-coup. Pause au survol, au toucher, au focus et pendant
// un défilement manuel ; aucun défilement automatique si « réduire les
// animations » est activé. Sur un écran assez large pour tout afficher, pas
// de duplication ni de mouvement. Les cartes d'une même rangée ont la même
// hauteur (flex, étirement).

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { REVIEWS, GOOGLE_RATING } from '../data/reviews.js';

const SPEED_PX_PER_S = 28;      // vitesse du défilement automatique
const RESUME_DELAY_MS = 3500;   // reprise après un défilement manuel

// Cinq étoiles, chacune remplie au prorata : 4,6 → quatre pleines et une à 60 %.
function Stars({ value, small = false }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className={`stars${small ? ' small' : ''}`} role="img" aria-label={`${v.toLocaleString('fr-CH')} sur 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, v - i));
        return <i key={i} style={{ '--f': `${Math.round(fill * 100)}%` }} aria-hidden="true">★</i>;
      })}
    </span>
  );
}

// Fait avancer la piste en boucle ; rend `true` quand un jeu de cartes est
// plus large que le conteneur (il y a alors quelque chose à faire défiler, et
// les cartes sont dupliquées). La mesure tient compte du nombre de jeux
// réellement rendus : un seul au premier rendu, deux dès que l'on boucle.
function useAutoScroll(ref, enabled) {
  const [loops, setLoops] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sets = loops ? 2 : 1;
    const measure = () => { const one = el.scrollWidth / sets; setLoops(one > el.clientWidth + 8); return one; };
    let one = measure();
    let paused = false, manualUntil = 0, last = 0, raf = 0;
    // Position tenue en flottant : le navigateur arrondit scrollLeft au pixel,
    // et un pas de moins d'un pixel par image serait perdu à chaque fois.
    let pos = el.scrollLeft, lastSet = pos;
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    const manual = () => { manualUntil = performance.now() + RESUME_DELAY_MS; };
    const tick = (t) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(64, t - last) : 0; last = t;
      if (paused || t < manualUntil || document.hidden) { pos = el.scrollLeft; lastSet = pos; return; }
      if (Math.abs(el.scrollLeft - lastSet) > 1) pos = el.scrollLeft; // défilé à la main entre-temps
      pos += (SPEED_PX_PER_S * dt) / 1000;
      if (pos >= one) pos -= one;
      el.scrollLeft = pos; lastSet = el.scrollLeft;
    };
    const onResize = () => { one = measure(); };
    el.addEventListener('pointerenter', pause); el.addEventListener('pointerleave', resume);
    el.addEventListener('pointerdown', manual); el.addEventListener('touchstart', manual, { passive: true });
    el.addEventListener('wheel', manual, { passive: true });
    el.addEventListener('focusin', pause); el.addEventListener('focusout', resume);
    window.addEventListener('resize', onResize);
    if (!reduce && loops) raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointerenter', pause); el.removeEventListener('pointerleave', resume);
      el.removeEventListener('pointerdown', manual); el.removeEventListener('touchstart', manual);
      el.removeEventListener('wheel', manual);
      el.removeEventListener('focusin', pause); el.removeEventListener('focusout', resume);
      window.removeEventListener('resize', onResize);
    };
  }, [ref, enabled, loops]);
  return loops;
}

function ReviewCard({ r, hidden }) {
  const initial = (r.author || '?').trim().charAt(0).toUpperCase();
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false); // le texte dépasse-t-il 5 lignes ?
  const pRef = useRef(null);
  useLayoutEffect(() => {
    const p = pRef.current;
    if (!p) return undefined;
    const check = () => { if (!expanded) setClamped(p.scrollHeight > p.clientHeight + 1); };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [expanded, r.text]);
  return (
    <article className={`rcard${expanded ? ' open' : ''}`} aria-hidden={hidden || undefined}>
      {/* Pas de <header> ici : la règle globale `.v2-root header` (barre de
          menu) s'y appliquerait. */}
      <div className="rtop">
        <span className="ravatar" aria-hidden="true">{initial}</span>
        <span className="rwho">
          <span className="rauthor">
            <span className="rname">{r.author}</span>
            {r.badge && <em className="rbadge">{r.badge}</em>}
          </span>
          <small>{r.when}</small>
        </span>
        <Stars value={r.rating} small />
      </div>
      <p ref={pRef}>{r.text}</p>
      {r.note && <small className="rnote">{r.note}</small>}
      {(clamped || expanded) && (
        <button type="button" className="rread" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} tabIndex={hidden ? -1 : 0}>
          {expanded ? 'Réduire' : 'Lire la suite'}
        </button>
      )}
    </article>
  );
}

export default function V2Reviews({ restaurant }) {
  const reviews = Array.isArray(REVIEWS) ? REVIEWS.filter((r) => r && r.author && r.rating) : [];
  const trackRef = useRef(null);
  const loops = useAutoScroll(trackRef, reviews.length > 0);
  if (reviews.length === 0) return null;

  const { average, count } = GOOGLE_RATING || {};
  const hasRating = Number(average) > 0 && Number(count) > 0;
  const avg = hasRating ? Number(average).toLocaleString('fr-CH', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : null;
  // Deux jeux de cartes pour boucler ; le second n'existe que pour l'œil.
  const sets = loops ? [reviews, reviews] : [reviews];

  return (
    <section className="reviews" id="avis" aria-labelledby="avis-title">
      <div className="wrap">
        <div className="rhead">
          <h2 id="avis-title">Avis Google</h2>
          {hasRating && (
            <div className="rsum">
              <Stars value={average} />
              <span className="rcount">{avg} · {Number(count).toLocaleString('fr-CH')} avis Google</span>
            </div>
          )}
        </div>
        {/* data-scroll-x : défilement horizontal voulu (l'audit de débordement l'ignore). */}
        <div
          className={`rtrack${loops ? ' loops' : ''}`}
          ref={trackRef}
          data-scroll-x=""
          tabIndex={0}
          aria-label="Avis Google. Défilement automatique, en pause au survol ou au toucher ; défilement manuel possible."
        >
          {sets.map((set, k) => set.map((r) => <ReviewCard key={`${k}-${r.id}`} r={r} hidden={k > 0} />))}
        </div>
        <p className="rmore">
          <a href={restaurant?.google_page} target="_blank" rel="noopener noreferrer">Voir tous nos avis sur Google</a>
        </p>
      </div>
    </section>
  );
}
