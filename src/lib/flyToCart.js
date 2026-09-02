// src/lib/flyToCart.js
//
// La pastille qui file vers le mini-panier à chaque ajout.
//
// Vit ICI et pas dans un composant parce qu'elle sert TOUS les chemins d'ajout
// — bouton + d'une carte produit, tuiles des modales d'options (protéine, jus,
// coulis, eau, formules), composeur de woks — sur les deux peaux. Elle est
// appelée depuis `add()` dans KaiKaiApp, le point de passage unique de tout
// ajout au panier : aucun appelant n'a à s'en soucier, et un futur chemin
// d'ajout en héritera sans qu'on y pense.
//
// ⚠ COUCHE PUREMENT VISUELLE. Elle ne lit ni n'écrit le panier, ne connaît ni
// prix ni variante, et son échec est toujours silencieux : si la cible manque,
// si le navigateur n'a pas l'API Web Animations, ou si le client a demandé
// moins d'animations, l'ajout se déroule exactement pareil.

// La cible porte cet attribut. Le mini-panier flottant est rendu par KaiKaiApp
// hors de toute peau, c'est le seul repère stable des deux habillages.
export const CART_TARGET_ATTR = 'data-minicart';

// Géométrie du mini-panier flottant, recopiée de MiniCart (position: fixed,
// bottom: 24, right: 16). Elle ne sert QUE lorsqu'il n'est pas encore dans le
// document — au tout premier ajout, où la pastille doit voler vers l'endroit
// où il va apparaître.
//
// ⚠ Si la géométrie de MiniCart change, ces trois valeurs suivent.
const DOCK = { bottom: 24, right: 16, w: 200, h: 64 };

const DUREE = 620;

const reduitLesAnimations = () => {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  } catch { return false; }
};

// Le mini-panier tel qu'il est RÉELLEMENT visible. Monté mais escamoté (la
// barre récap du composeur l'efface le temps de sa traversée) ne compte pas :
// il porte alors aria-hidden, son rect est décalé par son transform de sortie,
// et surtout il n'y a rien à faire tressaillir.
function cibleVisible() {
  const el = document.querySelector(`[${CART_TARGET_ATTR}]`);
  if (!el || el.getAttribute('aria-hidden') === 'true') return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? el : null;
}

// Point d'arrivée : le centre du mini-panier s'il est là, sinon le centre de
// l'emplacement qu'il occupera. Les deux cas visent le même coin, donc le vol
// a la même allure qu'il existe déjà ou non.
function pointArrivee(el) {
  if (el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return {
    x: window.innerWidth - DOCK.right - DOCK.w / 2,
    y: window.innerHeight - DOCK.bottom - DOCK.h / 2,
  };
}

// Lit l'accent de la peau sur l'élément d'où part le vol : lime sous
// `.rf-root`, doré sur le site historique. La pastille n'a ainsi pas à savoir
// dans quelle peau elle tourne.
function accentDe(el) {
  const source = el && el.isConnected ? el : document.querySelector('.rf-root') || document.body;
  try {
    return getComputedStyle(source).getPropertyValue('--rf-accent').trim() || '#C9A96E';
  } catch { return '#C9A96E'; }
}

// Lance le vol. `origin` = { x, y, el } — le dernier point de pointeur connu.
// Renvoie la durée d'animation en millisecondes, ou 0 si rien n'a été joué :
// c'est ce que l'appelant utilise pour faire apparaître le mini-panier à
// l'ARRIVÉE de la pastille, et pas avant.
export function flyToCart(origin) {
  if (typeof document === 'undefined' || !origin) return 0;
  const { x, y } = origin;
  if (typeof x !== 'number' || typeof y !== 'number') return 0;
  if (reduitLesAnimations()) return 0;
  if (typeof Element === 'undefined' || !Element.prototype.animate) return 0;

  const cible = cibleVisible();
  const arrivee = pointArrivee(cible);

  const el = document.createElement('div');
  el.className = 'kk-flyer';
  el.setAttribute('aria-hidden', 'true');
  el.textContent = '+';
  el.style.background = accentDe(origin.el);
  el.style.left = `${x - 20}px`;
  el.style.top = `${y - 20}px`;
  document.body.appendChild(el);

  const dx = arrivee.x - x;
  const dy = arrivee.y - y;

  // Point de passage bombé : une trajectoire droite se lit comme un glitch, une
  // cloche se lit comme un geste.
  //
  // Le creux est PROPORTIONNEL à la distance, et pris à mi-parcours exactement.
  // Une valeur constante ne courbe rien : sur un vol typique (75 px à gauche,
  // 276 px vers le bas), un creux fixe de 46 px replace le point de contrôle
  // à moins d'un pixel de la ligne droite — la courbe était plate sans que ça
  // se voie dans le code. Ici l'écart à la droite VAUT le creux, par
  // construction, quelle que soit la géométrie.
  const creux = Math.min(120, Math.max(40, Math.hypot(dx, dy) * 0.22));

  const anim = el.animate(
    [
      { transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - creux}px) scale(0.8)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.25)`, opacity: 0.1 },
    ],
    { duration: DUREE, easing: 'cubic-bezier(0.36, 0, 0.2, 1)', fill: 'forwards' },
  );
  const nettoie = () => el.remove();
  anim.onfinish = nettoie;
  anim.oncancel = nettoie;

  // Le panier tressaille à l'ARRIVÉE, pas au clic — et seulement s'il est là
  // pour être vu. Au premier ajout il n'existe pas encore : c'est son animation
  // d'apparition qui joue ce rôle.
  if (cible) {
    setTimeout(() => {
      cible.classList.add('kk-cart-bump');
      setTimeout(() => cible.classList.remove('kk-cart-bump'), 460);
    }, DUREE - 80);
  }

  return DUREE;
}
