// src/hooks/useOutOfStock.js
// Lit la liste des ruptures stockée dans app_settings.out_of_stock_items
// (JSONB array de strings). Polling 30s comme useRestaurantOpen.
//
// La liste mélange deux formes de clé : "5" (plat entier) et "5:porc" (option
// seule). Le décodage vit dans src/lib/stockRules.js — ce hook ne fait que
// l'exposer lié à la liste courante.
//
// Lecture publique via la policy RLS SELECT de app_settings (chantier 6).
// Pas de Realtime pour démarrer — la latence ≤30s est acceptable pour ce cas.

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import {
  availableOptions as availableOptionsRule,
  isItemUnavailable as isItemUnavailableRule,
  isOptionOut as isOptionOutRule,
} from '../lib/stockRules.js';

const POLL_INTERVAL_MS = 30_000;

async function fetchOutOfStock() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'out_of_stock_items')
    .maybeSingle();
  if (error) {
    console.warn('[KaïKaï out-of-stock] lecture échec, fallback []', error);
    return [];
  }
  if (data && Array.isArray(data.value)) {
    return data.value.filter(x => typeof x === 'string');
  }
  return [];
}

export function useOutOfStock() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const next = await fetchOutOfStock();
      if (!cancelled) {
        setItems(next);
        setLoading(false);
      }
    }

    load();
    const id = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Signatures historiques (`items`, `isOutOfStock`) inchangées : d'autres
  // appelants en dépendent. Les helpers option/cascade sont additifs.
  return useMemo(() => ({
    items,
    loading,
    isOutOfStock: (id) => items.includes(String(id)),
    isOptionOut: (itemId, optionId) => isOptionOutRule(items, itemId, optionId),
    availableOptions: (menuItem) => availableOptionsRule(items, menuItem),
    isItemUnavailable: (menuItem) => isItemUnavailableRule(items, menuItem),
  }), [items, loading]);
}
