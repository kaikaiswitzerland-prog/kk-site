import { useEffect, useState } from 'react';

// Tick global partagé : un seul setInterval pour toutes les cards qui
// ont besoin d'un re-render périodique (chronos d'urgence). Évite N timers
// quand on a N cartes commande à l'écran.

const subscribers = new Set();
let timer = null;

function ensureTimer(intervalMs) {
  if (timer) return;
  timer = setInterval(() => {
    const now = Date.now();
    subscribers.forEach((cb) => cb(now));
  }, intervalMs);
}

function clearIfIdle() {
  if (timer && subscribers.size === 0) {
    clearInterval(timer);
    timer = null;
  }
}

export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    subscribers.add(setNow);
    ensureTimer(intervalMs);
    return () => {
      subscribers.delete(setNow);
      clearIfIdle();
    };
  }, [intervalMs]);
  return now;
}
