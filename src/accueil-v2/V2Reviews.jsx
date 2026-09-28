// src/accueil-v2/V2Reviews.jsx
//
// Avis Google de la fiche KaïKaï, en cartes qui défilent en boucle.
//
// Source : /api/google-reviews (fonction serveur, cache 24 h) — le navigateur
// ne parle jamais à Google avec une clé. Tant que la réponse n'est pas là, ou
// si elle n'est pas un 200 avec au moins un avis, la section n'existe pas :
// rien ne casse quand l'API n'est pas configurée.
//
// Défilement : la piste est un conteneur à défilement horizontal natif (donc
// défilable à la main, au doigt comme à la molette) que l'on fait avancer
// doucement par requestAnimationFrame ; les cartes sont dupliquées une fois
// pour boucler sans à-coup. Pause au survol, au toucher, au focus et pendant
// un défilement manuel ; aucun défilement automatique si « réduire les
// animations » est activé. Sur un écran assez large pour tout afficher, pas
// de duplication ni de mouvement.
//
// Attribution Google (conditions de Places) : mention « Google », nom et photo
// de l'auteur tels que fournis, lien vers son profil, lien vers la fiche.

import { useEffect, useRef, useState } from 'react';

const SPEED_PX_PER_S = 28;      // vitesse du défilement automatique
const RESUME_DELAY_MS = 3500;   // reprise après un défilement manuel

function Stars({ value, small = false }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className={`stars${small ? ' small' : ''}`} style={{ '--r': v }} role="img" aria-label={`${v.toLocaleString('fr-CH')} sur 5`}>
      ★★★★★
    </span>
  );
}

function useReviews() {
  const [data, setData] = useState(null);
  useEffect(() => {
    const ac = new AbortController();
    fetch('/api/google-reviews', { signal: ac.signal, headers: { Accept: 'application/json' } })
      .then((r) => (r.status === 200 ? r.json() : null))
      .then((d) => {
        if (d && d.rating > 0 && Array.isArray(d.reviews) && d.reviews.length > 0) setData(d);
      })
      .catch(() => { /* réseau, abandon, 204… : la section reste absente */ });
    return () => ac.abort();
  }, []);
  return data;
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
  const author = r.authorUri
    ? <a className="rauthor" href={r.authorUri} target="_blank" rel="noopener noreferrer">{r.author}</a>
    : <span className="rauthor">{r.author}</span>;
  return (
    <article className="rcard" aria-hidden={hidden || undefined}>
      {/* Pas de <header> ici : la règle globale `.v2-root header` (barre de
          menu) s'y appliquerait. */}
      <div className="rtop">
        {r.photo
          ? <img src={r.photo} alt="" width="40" height="40" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
          : <span className="ravatar" aria-hidden="true">{initial}</span>}
        <span className="rwho">
          {author}
          <small>{r.when}</small>
        </span>
        <Stars value={r.rating} small />
      </div>
      {r.text && <p title={r.text}>{r.text}</p>}
    </article>
  );
}

export default function V2Reviews({ restaurant }) {
  const data = useReviews();
  const trackRef = useRef(null);
  const loops = useAutoScroll(trackRef, !!data);
  if (!data) return null;

  const mapsUri = data.mapsUri || restaurant?.google_page;
  const rating = Number(data.rating).toLocaleString('fr-CH', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  // Deux jeux de cartes pour boucler ; le second n'existe que pour l'œil.
  const sets = loops ? [data.reviews, data.reviews] : [data.reviews];

  return (
    <section className="reviews" id="avis" aria-labelledby="avis-title">
      <div className="wrap">
        <div className="rhead">
          <h2 id="avis-title">Ce que disent nos clients</h2>
          <div className="rsum">
            <span className="rnum">{rating}</span>
            <Stars value={data.rating} />
            <span className="rcount">{data.count.toLocaleString('fr-CH')} avis sur Google</span>
          </div>
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
          <a href={mapsUri} target="_blank" rel="noopener noreferrer">Voir tous les avis sur Google</a>
        </p>
      </div>
    </section>
  );
}
