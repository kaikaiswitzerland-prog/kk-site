import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import {
  REVENUE_STATUSES,
  buildMonthAnalytics,
  monthRange,
  parseMonthKey,
} from '../lib/admin/analyticsHelpers.js';

// PostgREST plafonne une réponse à 1000 lignes par défaut. Un mois chargé peut
// dépasser ce seuil, et la troncature est SILENCIEUSE : on recevrait un CA
// mensuel faux sans le moindre message d'erreur. On pagine donc explicitement
// jusqu'à épuisement plutôt que de parier sur le volume.
const PAGE_SIZE = 1000;

// Charge les commandes d'UN mois et rend ses agrégats.
//
// Le filtrage est fait côté Supabase (bornes de date, corbeille, statuts) :
// seules les lignes réellement comptabilisées traversent le réseau, et l'index
// orders_created_at_idx couvre déjà la plage.
//
// ⚠ La table `orders` ne contient QUE les commandes directes (site + saisies
// restaurant). Il n'existe aucune colonne source/channel et aucune donnée Uber
// Eats / Just Eat nulle part dans le schéma : la contrainte « commandes
// directes uniquement » est donc tenue par construction, sans filtre à écrire.
// Si un jour un canal externe est importé dans cette table, c'est ICI qu'il
// faudra l'exclure.
// Date de la toute première commande en base, qui borne le sélecteur de mois.
//
// Volontairement SANS filtre de statut ni de corbeille : la question posée est
// « depuis quand y a-t-il des commandes ? », pas « depuis quand y a-t-il du
// chiffre ? ». Si la plus ancienne ligne est un panier abandonné, son mois
// apparaît quand même — vide, et annoncé comme tel. C'est plus honnête qu'une
// liste qui commencerait mystérieusement un mois plus tard.
//
// Une seule ligne remontée (order + limit 1), donc l'index orders_created_at_idx
// répond sans balayer la table.
export function useFirstOrderDate({ enabled = true } = {}) {
  const [state, setState] = useState({ date: null, loading: true, error: null });

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1);

      if (cancelled) return;
      if (error) {
        console.error('[KaïKaï admin] analyses — première commande introuvable', error);
        setState({ date: null, loading: false, error: error.message });
        return;
      }
      const iso = data?.[0]?.created_at || null;
      setState({ date: iso ? new Date(iso) : null, loading: false, error: null });
    })();

    return () => { cancelled = true; };
  }, [enabled]);

  return state;
}

export function useMonthlyAnalytics(key, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const load = useCallback(async (signal) => {
    const { year, monthIndex } = parseMonthKey(key);
    const { fromISO, toISO } = monthRange(year, monthIndex);

    const rows = [];
    for (let page = 0; ; page += 1) {
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, total, items, status')
        .gte('created_at', fromISO)
        .lt('created_at', toISO)
        .eq('is_trashed', false)
        .in('status', REVENUE_STATUSES)
        .order('created_at', { ascending: true })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (error) throw new Error(error.message);
      if (signal.cancelled) return null;
      rows.push(...(data || []));
      if (!data || data.length < PAGE_SIZE) break;
    }
    return rows;
  }, [key]);

  useEffect(() => {
    if (!enabled || !key) return undefined;
    const signal = { cancelled: false };
    setState((prev) => ({ ...prev, loading: true, error: null }));

    load(signal)
      .then((rows) => {
        if (signal.cancelled || rows === null) return;
        setState({ data: buildMonthAnalytics(rows, parseMonthKey(key)), loading: false, error: null });
      })
      .catch((err) => {
        if (signal.cancelled) return;
        console.error('[KaïKaï admin] analyses — chargement du mois échoué', err);
        setState({ data: null, loading: false, error: err.message || 'Chargement impossible' });
      });

    return () => { signal.cancelled = true; };
  }, [key, enabled, load]);

  return state;
}
