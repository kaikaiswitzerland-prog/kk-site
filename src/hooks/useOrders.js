import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { fmt, isAdminVisible } from '../lib/admin/orderHelpers.js';

// Charge la liste des commandes + souscription Realtime + déclenche un toast
// + une notification navigateur sur INSERT, et expose un updateStatus optimiste.
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

    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (!error && data) setOrders(data);
      });

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
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
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

    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    await supabase.from('orders').update(patch).eq('id', id);
  }, []);

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
    soundEnabled: soundEnabled.current,
    setSoundEnabled,
  };
}
