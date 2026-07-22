import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { fmt, isAdminVisible } from '../lib/admin/orderHelpers.js';

// Intervalle du polling de secours (ms). Le Realtime reste la voie rapide,
// ce refetch périodique garantit la cohérence si la WebSocket décroche
// (mobile en veille, onglet en arrière-plan, perte réseau brève).
// 15 000 ms = plancher raisonnable pour ne pas surcharger Supabase.
const POLLING_INTERVAL_MS = 15000;

// Cadence de répétition de l'alarme tant qu'une commande n'est pas prise en
// charge. La sonnerie dure ~1,6 s : 3 s laisse un silence audible entre deux
// salves, sans laisser le temps d'oublier la commande.
const ALARM_REPEAT_MS = 3000;

// Statuts d'une commande « pas encore prise en charge » — ceux de l'onglet
// « À traiter ». Dès que la commande en sort (acceptée, refusée…), son alarme
// s'arrête.
const ALARM_STATUSES = ['pending', 'paid'];

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
  // AudioContext réutilisé entre les bips : les navigateurs plafonnent le
  // nombre de contextes simultanés, en créer un par commande finit par échouer.
  const audioCtx = useRef(null);
  // Ids des commandes arrivées en temps réel et pas encore prises en charge.
  // Uniquement alimenté par les events Realtime — jamais par le fetch initial,
  // pour qu'un rechargement de l'admin ne déclenche pas l'alarme sur des
  // commandes déjà à l'écran.
  const alarmIds = useRef(new Set());
  const alarmTimer = useRef(null);

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

  // Crée (si besoin) et débloque l'AudioContext. Safari et Chrome n'autorisent
  // la lecture qu'après un geste utilisateur : appelé depuis un handler de clic,
  // le resume() est accepté et le contexte reste `running` pour les bips
  // ultérieurs, qui eux arrivent hors geste (event Realtime).
  const ensureAudioCtx = useCallback(() => {
    const Ctx =
      typeof window !== 'undefined' &&
      (window.AudioContext || window.webkitAudioContext);
    if (!Ctx) return null;
    try {
      if (!audioCtx.current || audioCtx.current.state === 'closed') {
        audioCtx.current = new Ctx();
      }
      if (audioCtx.current.state === 'suspended') {
        audioCtx.current.resume().catch(() => { /* geste requis : réessayé plus tard */ });
      }
      return audioCtx.current;
    } catch {
      return null;
    }
  }, []);

  // Déblocage au premier geste sur la page — typiquement le clic de connexion,
  // bien avant la première commande. Sans ça, l'AudioContext naît `suspended`
  // et les bips sont programmés sur une horloge à l'arrêt : aucun son, aucune
  // erreur. `once: true` car un seul déblocage suffit pour toute la session.
  useEffect(() => {
    const unlock = () => {
      ensureAudioCtx();
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, [ensureAudioCtx]);

  // Sonnerie de nouvelle commande, synthétisée à la volée (aucun fichier
  // audio à servir). Alarme de 3 salves de deux notes aiguës, ~1,6 s au total,
  // calibrée pour percer le bruit ambiant d'une cuisine.
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled.current) return;
    // Fallback : recrée/relance le contexte si le déblocage n'a pas eu lieu ou
    // si le navigateur l'a resuspendu (onglet longtemps en arrière-plan).
    const ctx = ensureAudioCtx();
    if (!ctx) return;

    try {
      const start = ctx.currentTime + 0.02;
      // 3 salves à t+0 / +0.6 / +1.2 ; chacune = deux notes [Hz, décalage].
      // Onde carrée + aigus 1200/1800 Hz : riche en harmoniques, ça tranche
      // dans le bruit de cuisine là où une sinusoïde douce se fait couvrir.
      for (const salve of [0, 0.6, 1.2]) {
        for (const [freq, delay] of [[1200, 0], [1800, 0.2]]) {
          const t = start + salve + delay;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, t);
          // Enveloppe : montée quasi instantanée, plateau au volume max sur
          // l'essentiel de la note, extinction juste avant l'arrêt pour éviter
          // le clic. Les notes ne se recouvrent jamais — pas de saturation.
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(1.0, t + 0.01);
          gain.gain.setValueAtTime(1.0, t + 0.17);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
          osc.connect(gain).connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.2);
        }
      }
    } catch { /* audio indisponible : ignoré */ }
  }, [ensureAudioCtx]);

  const stopAlarm = useCallback(() => {
    if (alarmTimer.current) {
      clearInterval(alarmTimer.current);
      alarmTimer.current = null;
    }
  }, []);

  // Démarre (ou prolonge) l'alarme pour une commande fraîchement arrivée.
  // Plusieurs commandes en attente partagent un seul timer : la sonnerie ne se
  // superpose pas, elle continue simplement tant que `alarmIds` n'est pas vide.
  const startAlarm = useCallback((id) => {
    // Son coupé : aucune alarme, et on n'enregistre pas l'id — sinon la
    // remettre sur ON relancerait l'alarme toute seule.
    if (!soundEnabled.current) return;
    alarmIds.current.add(id);
    playNotificationSound(); // première sonnerie immédiate
    if (alarmTimer.current) return; // timer déjà en route
    alarmTimer.current = setInterval(playNotificationSound, ALARM_REPEAT_MS);
  }, [playNotificationSound]);

  // Arbitrage de l'alarme sur l'état réel des commandes plutôt que dans chaque
  // mutation : `updateStatus`, `refuseOrder`, `trashOrder`… patchent tous
  // `orders` de façon optimiste, donc accepter une commande (ici ou depuis une
  // autre tablette, via Realtime) la fait sortir de `ALARM_STATUSES` et retire
  // son id. L'alarme ne s'arrête qu'une fois le dernier id parti.
  useEffect(() => {
    if (alarmIds.current.size === 0) return;
    for (const id of alarmIds.current) {
      const order = orders.find((o) => o.id === id);
      // Absente de la liste → on garde l'alarme. Un refetch parti avant
      // l'arrivée de la commande (polling 15 s, retour au premier plan) revient
      // sans elle : la retirer ici couperait l'alarme après une seule sonnerie.
      // Une commande ne disparaît jamais pour de bon sans passer par la
      // corbeille, cas couvert par `is_trashed` juste en dessous.
      if (!order) continue;
      if (order.is_trashed || !ALARM_STATUSES.includes(order.status)) {
        alarmIds.current.delete(id);
      }
    }
    if (alarmIds.current.size === 0) stopAlarm();
  }, [orders, stopAlarm]);

  // Filet de sécurité : pas de timer fantôme si le hook est démonté alors que
  // l'alarme sonne (déconnexion, navigation hors admin).
  useEffect(() => stopAlarm, [stopAlarm]);

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
              startAlarm(order.id);
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
              startAlarm(next.id);
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
  }, [
    enabled,
    markRecentlyAdded,
    triggerToast,
    triggerBrowserNotification,
    startAlarm,
  ]);

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
    if (on) {
      // Activer le son est un geste utilisateur : on en profite pour débloquer
      // l'audio, au cas où ce serait le tout premier clic de la session.
      ensureAudioCtx();
    } else {
      // 🔕 coupe l'alarme en cours. On vide aussi la liste d'attente pour que
      // repasser sur ON ne relance pas la sonnerie de son propre chef : seule
      // une nouvelle commande pourra la redéclencher.
      stopAlarm();
      alarmIds.current.clear();
    }
    try { localStorage.setItem('kkAdminSound', on ? '1' : '0'); } catch { /* */ }
  }, [ensureAudioCtx, stopAlarm]);

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
