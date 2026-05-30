import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { fmt, isAdminVisible } from '../lib/admin/orderHelpers.js';

// Intervalle du polling de secours (ms). Le Realtime reste la voie rapide,
// ce refetch périodique garantit la cohérence si la WebSocket décroche
// (mobile en veille, onglet en arrière-plan, perte réseau brève).
// 15 000 ms = plancher raisonnable pour ne pas surcharger Supabase.
const POLLING_INTERVAL_MS = 15000;

// Charge la liste des commandes + souscription Realtime + polling de secours
// + refetch au focus. Déclenche un toast et une notification navigateur sur
// INSERT, et expose un updateStatus optimiste.
export function useOrders({ enabled }) {
  const [orders, setOrders] = useState([]);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState(() => new Set());
  const [toast, setToast] = useState(null);
  const soundEnabled = useRef(
    typeof window !== 'undefined'
      ? localStorage.getItem('kkAdminSound') !== '0'
      : true
  );

  const triggerToast = useCallback((order) => {
    setToast(order);
    setTimeout(() => setToast(null), 5000);
  }, []);

  const triggerBrowserNotification = useCallback((order) => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    const isCard = order.payment_method === 'card';
    const title = isCard
      ? '🍜 Nouvelle commande payée carte'
      : '🍜 Nouvelle commande KaïKaï';
    new Notification(title, {
      body: `${order.customer_name} — ${fmt(order.total)}`,
      icon: '/favicon.png',
      tag: 'kaikai-order',
    });
  }, []);

  const markRecentlyAdded = useCallback((id) => {
    setRecentlyAddedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      setRecentlyAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2000);
  }, []);

  // Chargement initial + souscription Realtime
  useEffect(() => {
    if (!enabled) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    let mounted = true;

    // Fetch unique réutilisé par : chargement initial, polling de secours,
    // refetch au focus, et resync après reconnexion Realtime.
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!mounted) return;
      if (!error && data) setOrders(data);
    };

    fetchOrders();

    // Track la première souscription pour ne refetcher qu'aux RE-connexions
    // (la première SUBSCRIBED arrive juste après notre fetch initial).
    let hasBeenSubscribed = false;

    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (!mounted) return;
          if (payload.eventType === 'INSERT') {
            const order = payload.new;
            setOrders((prev) => [order, ...prev]);
            // pending_payment ne déclenche aucune alerte (attente webhook SumUp)
            if (isAdminVisible(order)) {
              markRecentlyAdded(order.id);
              triggerToast(order);
              triggerBrowserNotification(order);
              if (soundEnabled.current) {
                try {
                  const a = new Audio('/notif.mp3');
                  a.volume = 0.5;
                  a.play().catch(() => { /* autoplay bloqué : ignoré */ });
                } catch { /* fichier absent : ignoré */ }
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const next = payload.new;
            // Cas SumUp : la commande passe de pending_payment → paid (webhook).
            // On la traite alors comme une nouvelle commande visible (toast + notif).
            const wasHidden = payload.old?.status === 'pending_payment';
            const nowVisible = isAdminVisible(next);
            setOrders((prev) =>
              prev.map((o) => (o.id === next.id ? next : o))
            );
            if (wasHidden && nowVisible) {
              markRecentlyAdded(next.id);
              triggerToast(next);
              triggerBrowserNotification(next);
            }
          } else if (payload.eventType === 'DELETE') {
            // Suppression définitive (corbeille) — retire la row côté autres clients.
            setOrders((prev) => prev.filter((o) => o.id !== payload.old?.id));
          }
        }
      )
      .subscribe((status) => {
        // À chaque reconnexion (SUBSCRIBED après une coupure), on refetch
        // pour rattraper les events tombés pendant la déconnexion.
        if (status === 'SUBSCRIBED') {
          if (hasBeenSubscribed) fetchOrders();
          hasBeenSubscribed = true;
        }
      });

    // Polling de secours — garantit la fraîcheur même Realtime KO.
    const pollingId = setInterval(fetchOrders, POLLING_INTERVAL_MS);

    // Refetch immédiat quand l'admin revient sur l'onglet/l'app (mobile++).
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchOrders();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', fetchOrders);

    return () => {
      mounted = false;
      clearInterval(pollingId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', fetchOrders);
      supabase.removeChannel(channel);
    };
  }, [enabled, markRecentlyAdded, triggerToast, triggerBrowserNotification]);

  const updateStatus = useCallback(async (id, status) => {
    // Patch optimiste : on inclut l'horodatage de la transition pour que la
    // timeline et les chronos s'actualisent immédiatement, sans attendre
    // l'aller-retour Supabase + Realtime.
    const patch = { status };
    const nowIso = new Date().toISOString();
    if (status === 'accepted')          patch.accepted_at         = nowIso;
    if (status === 'ready')             patch.ready_at            = nowIso;
    if (status === 'out_for_delivery')  patch.out_for_delivery_at = nowIso;
    if (status === 'delivered')         patch.delivered_at        = nowIso;
    if (status === 'picked_up')         patch.picked_up_at        = nowIso;

    // Snapshot pour rollback si l'UPDATE échoue (CHECK constraint, RLS, etc.).
    // Sans ce rollback, l'optimistic patch laissait la commande dans un statut
    // que la DB n'avait jamais accepté — invisible au reload suivant.
    let previousOrder = null;
    setOrders((prev) => prev.map((o) => {
      if (o.id !== id) return o;
      previousOrder = o;
      return { ...o, ...patch };
    }));

    const { error } = await supabase.from('orders').update(patch).eq('id', id);
    if (error) {
      console.error('[KaïKaï admin] updateStatus échec', id, status, error);
      if (previousOrder) {
        setOrders((prev) => prev.map((o) => (o.id === id ? previousOrder : o)));
      }
      triggerToast({ message: `Échec mise à jour : ${error.message || 'erreur DB'}` });
    }
  }, [triggerToast]);

  // Refus structuré (chantier 7) : passe status=refused + persiste le motif
  // (code) et le commentaire libre. Patch optimiste local pour réactivité.
  const refuseOrder = useCallback(async (id, { reason, comment }) => {
    const patch = {
      status: 'refused',
      refusal_reason: reason,
      refusal_comment: comment || null,
    };
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    const { error } = await supabase.from('orders').update(patch).eq('id', id);
    if (error) throw error;
  }, []);

  // ─── Corbeille (commandes test) ──────────────────────────
  // Mise à la corbeille : exclue de l'écran d'accueil ET de la compta.
  // Patch optimiste ; le Realtime UPDATE rejoue ensuite la même valeur.
  const trashOrder = useCallback(async (id) => {
    const patch = { is_trashed: true, trashed_at: new Date().toISOString() };
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    const { error } = await supabase.from('orders').update(patch).eq('id', id);
    if (error) throw error;
  }, []);

  // Mise à la corbeille en masse : un seul UPDATE avec `.in('id', ids)`
  // (pas une boucle de N requêtes). Patch optimiste sur toutes les commandes
  // sélectionnées, puis toast de succès.
  const trashOrders = useCallback(async (ids) => {
    if (!ids || ids.length === 0) return;
    const trashedAt = new Date().toISOString();
    const idSet = new Set(ids);
    setOrders((prev) =>
      prev.map((o) => (idSet.has(o.id) ? { ...o, is_trashed: true, trashed_at: trashedAt } : o))
    );
    const { error } = await supabase
      .from('orders')
      .update({ is_trashed: true, trashed_at: trashedAt })
      .in('id', ids);
    if (error) throw error;
    const n = ids.length;
    triggerToast({ message: `${n} commande${n > 1 ? 's' : ''} mise${n > 1 ? 's' : ''} à la corbeille` });
  }, [triggerToast]);

  // Restauration : la commande réapparaît dans la liste + la compta.
  const restoreOrder = useCallback(async (id) => {
    const patch = { is_trashed: false, trashed_at: null };
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    const { error } = await supabase.from('orders').update(patch).eq('id', id);
    if (error) throw error;
  }, []);

  // Restauration en masse : un seul UPDATE `.in('id', ids)`. Patch optimiste + toast.
  const restoreOrders = useCallback(async (ids) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    setOrders((prev) =>
      prev.map((o) => (idSet.has(o.id) ? { ...o, is_trashed: false, trashed_at: null } : o))
    );
    const { error } = await supabase
      .from('orders')
      .update({ is_trashed: false, trashed_at: null })
      .in('id', ids);
    if (error) throw error;
    const n = ids.length;
    triggerToast({ message: `${n} commande${n > 1 ? 's' : ''} restaurée${n > 1 ? 's' : ''}` });
  }, [triggerToast]);

  // Suppression définitive : DELETE en base (RLS policy delete requise).
  const deleteOrder = useCallback(async (id) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
  }, []);

  // Suppression définitive en masse : un seul DELETE `.in('id', ids)`. Optimiste + toast.
  const deleteOrders = useCallback(async (ids) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    setOrders((prev) => prev.filter((o) => !idSet.has(o.id)));
    const { error } = await supabase.from('orders').delete().in('id', ids);
    if (error) throw error;
    const n = ids.length;
    triggerToast({ message: `${n} commande${n > 1 ? 's' : ''} supprimée${n > 1 ? 's' : ''} définitivement` });
  }, [triggerToast]);

  const setSoundEnabled = useCallback((on) => {
    soundEnabled.current = on;
    try { localStorage.setItem('kkAdminSound', on ? '1' : '0'); } catch { /* */ }
  }, []);

  return {
    orders,
    recentlyAddedIds,
    toast,
    dismissToast: () => setToast(null),
    updateStatus,
    refuseOrder,
    trashOrder,
    trashOrders,
    restoreOrder,
    restoreOrders,
    deleteOrder,
    deleteOrders,
    soundEnabled: soundEnabled.current,
    setSoundEnabled,
  };
}
