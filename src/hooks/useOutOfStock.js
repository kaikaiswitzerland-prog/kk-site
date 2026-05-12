// src/hooks/useOutOfStock.js
// Lit la liste des plats en rupture stockée dans app_settings.out_of_stock_items
// (JSONB array d'ids string). Polling 30s comme useRestaurantOpen.
//
// Lecture publique via la policy RLS SELECT de app_settings (chantier 6).
// Pas de Realtime pour démarrer — la latence ≤30s est acceptable pour ce cas.

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

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

  return { items, loading, isOutOfStock: (id) => items.includes(String(id)) };
}
