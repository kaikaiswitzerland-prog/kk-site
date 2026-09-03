// src/pages/admin/SoundGate.jsx
//
// Deux choses que l'admin n'avait pas, et dont l'absence a coûté des commandes
// non entendues en service :
//
//   1. un DÉBLOCAGE explicite du son, dans un vrai geste utilisateur ;
//   2. un indicateur qui dit l'ÉTAT RÉEL du moteur audio, pas la préférence.
//
// Le bouton « 🔔 Son ON » de la barre du haut reflète `soundEnabled` — ce que
// l'utilisateur a demandé. Sur iPad, l'AudioContext peut être suspendu (pas de
// geste depuis le chargement, retour de veille) ou muet (commutateur silencieux
// de l'appareil) pendant que ce bouton affiche fièrement « ON ». Le personnel
// croit le son actif, personne n'entend rien, et la commande attend.
//
// Ce composant montre donc l'état réel et, tant qu'il n'est pas bon, refuse de
// se taire.

import { useEffect, useState } from 'react';

export default function SoundGate({ audioState, soundEnabled, onUnlock, alarmActive }) {
  const [teste, setTeste] = useState(false);

  // Le repli visuel : si une commande attend ET que le son ne peut pas jouer,
  // le titre de l'onglet clignote. C'est le dernier filet quand l'iPad est
  // silencieux, posé loin, écran allumé — on voit alterner de l'autre bout de
  // la cuisine.
  const muet = soundEnabled && audioState !== 'running';
  useEffect(() => {
    if (!alarmActive || !muet) return undefined;
    const titre = document.title;
    let on = false;
    const id = setInterval(() => {
      on = !on;
      document.title = on ? '🔴 NOUVELLE COMMANDE' : titre;
    }, 700);
    return () => { clearInterval(id); document.title = titre; };
  }, [alarmActive, muet]);

  if (!soundEnabled) return null;

  // Tout va bien : une pastille discrète, pour qu'on puisse vérifier d'un coup
  // d'œil avant le service plutôt que de le découvrir pendant.
  if (audioState === 'running') {
    return (
      <div className="mb-3 flex items-center gap-2 text-xs text-emerald-400" role="status">
        <span aria-hidden="true">●</span>
        <span>Son actif{teste ? ' — bip de test entendu ?' : ''}</span>
        {!teste && (
          <button
            type="button"
            onClick={() => { onUnlock(); setTeste(true); }}
            className="underline underline-offset-2 opacity-70 hover:opacity-100"
          >
            tester
          </button>
        )}
      </div>
    );
  }

  const indisponible = audioState === 'unsupported';

  return (
    <div
      role="alert"
      className={`mb-4 rounded-2xl border p-4 ${
        alarmActive
          ? 'animate-pulse border-red-500 bg-red-500/15'
          : 'border-amber-500/60 bg-amber-500/10'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">
            {indisponible ? 'Son indisponible sur cet appareil' : 'Son bloqué — les commandes ne sonneront pas'}
          </p>
          <p className="mt-1 text-xs text-white/70">
            {indisponible
              ? "Ce navigateur ne permet pas de jouer un son. Gardez l'écran allumé et à vue."
              : "Safari exige une touche sur l'écran pour autoriser le son. Vérifiez aussi que l'iPad n'est pas en mode silencieux."}
          </p>
        </div>
        {!indisponible && (
          <button
            type="button"
            onClick={() => { onUnlock(); setTeste(true); }}
            className="flex-none rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black active:scale-95"
          >
            🔔 Activer le son
          </button>
        )}
      </div>
    </div>
  );
}
