// src/hooks/useRestaurantOpen.js
// Hook qui combine deux sources d'ouverture pour KaïKaï :
//   1. La règle horaires automatique (mardi-dim 11h-14h / 17h30-22h, lundi fermé)
//      → calculée localement via getRestaurantStatus(now) dans restaurantHours.js.
//   2. Le flag manuel app_settings.kitchen_open (3 états — voir ci-dessous).
//
// Sémantique 3 états du flag admin (app_settings.kitchen_open) :
//   - true  → FORCE ouvert (bypass horaires, ex: ouverture exceptionnelle lundi)
//   - false → FORCE fermé (stop commandes immédiat)
//   - null/absent → AUTO (suit les horaires programmés)
//
// Polling 30s :
//   - refresh `now` toutes les 30s (déclenche un re-render avec un nouveau
//     status horaires, ce qui couvre les bascules ouvert↔fermé automatiques).
//   - re-fetch `kitchen_open` toutes les 30s (couvre les toggles admin sans
//     dépendre de Realtime Supabase pour démarrer).
//
// 1 requête / 30s / client = OK pour la charge prévue.

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { getRestaurantStatus, formatStatusLabel } from '../lib/restaurantHours.js';

const POLL_INTERVAL_MS = 30_000;

async function fetchKitchenOpen() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'kitchen_open')
    .maybeSingle();
  if (error) {
    console.warn('[KaïKaï kitchen] lecture app_settings échec, fallback auto', error);
    return null;
  }
  // value est un JSONB qui contient `true` ou `false`. Supabase JS le décode
  // déjà en bool ; tout le reste (absent, null, autre) → mode auto.
  if (data && typeof data.value === 'boolean') return data.value;
  return null;
}

export function useRestaurantOpen() {
  const [kitchenOpen, setKitchenOpen] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFlag() {
      const open = await fetchKitchenOpen();
      if (!cancelled) {
        setKitchenOpen(open);
        setLoading(false);
      }
    }

    loadFlag();

    const id = setInterval(() => {
      setNow(new Date());
      loadFlag();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const status = getRestaurantStatus(now);
  const manualClosure = kitchenOpen === false;
  const manualOpening = kitchenOpen === true && !status.isOpen;
  // 3-state logic — voir doc en haut de fichier.
  const isOpen =
    kitchenOpen === false ? false
    : kitchenOpen === true ? true
    : status.isOpen;

  // Label : si admin force ouvert ET schedule ouvert aussi, on garde le label
  // schedule qui contient l'heure de fermeture (utile au client). Si force
  // ouvert hors horaires (ex: lundi exceptionnel), label simple "Ouvert".
  const statusLabel =
    manualClosure ? 'Fermé temporairement'
    : manualOpening ? 'Ouvert'
    : formatStatusLabel(status);

  return {
    isOpen,
    manualClosure,
    manualOpening,
    statusLabel,
    status,
    loading,
  };
}
