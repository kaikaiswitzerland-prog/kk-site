// src/accueil-v2/V2PromoPopup.jsx
//
// Petite fenêtre « −20 % avec le code PREMIER » (14.10.2026). Discrète :
// en bas de l'écran, après quelques secondes, UNE fois par visiteur
// (mémorisé dans le navigateur), et seulement tant que le code est valable.
// Le code reste vérifié au paiement par le serveur (src/lib/promoCodes.js).

import { useEffect, useState } from 'react';
import { PROMO_CODES } from '../lib/promoCodes.js';
import { scrollToId } from './useScrollSpy.js';

const SEEN_KEY = 'kk-promo-premier-vu';
const DELAY_MS = 4000;

function alreadySeen() {
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
}
function markSeen() {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* navigation privée : tant pis */ }
}

export default function V2PromoPopup() {
  const promo = PROMO_CODES.PREMIER;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!promo || Date.now() >= promo.endsAt || alreadySeen()) return undefined;
    const t = setTimeout(() => { setOpen(true); markSeen(); }, DELAY_MS);
    return () => clearTimeout(t);
  }, [promo]);

  if (!open) return null;

  const close = () => setOpen(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(promo.code); setCopied(true); } catch { /* pas grave */ }
  };
  const order = () => { close(); scrollToId('menu'); };

  return (
    <div className="promo-pop" role="dialog" aria-live="polite" aria-label="Code de bienvenue">
      <button type="button" className="x" onClick={close} aria-label="Fermer">×</button>
      <p className="big">−20 % sur ta 1<sup>re</sup> commande</p>
      <p className="txt">
        Avec le code{' '}
        <button type="button" className="code" onClick={copy} title="Copier le code">
          {promo.code}
        </button>
        {copied && <span className="ok"> copié</span>} au paiement, sur le site.
      </p>
      <p className="small">Jusqu'au 30 novembre · une fois par personne · hors offre du midi</p>
      <button type="button" className="btn primary" onClick={order}>Voir le menu</button>
    </div>
  );
}
