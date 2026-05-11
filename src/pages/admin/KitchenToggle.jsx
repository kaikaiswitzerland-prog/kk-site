// src/pages/admin/KitchenToggle.jsx
// Toggle "Stop commandes" — réservé au header admin.
// Lit l'état initial dans app_settings.kitchen_open, bascule via
// POST /api/admin/toggle-kitchen (JWT admin). Affiche en sous-texte l'état
// horaires automatique pour que l'admin comprenne qu'un toggle "ouvert"
// reste sans effet hors heures de service.

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useRestaurantOpen } from '../../hooks/useRestaurantOpen.js';
import { formatStatusLabel } from '../../lib/restaurantHours.js';

export default function KitchenToggle() {
  const { status: autoStatus, loading: hookLoading } = useRestaurantOpen();
  const [kitchenOpen, setKitchenOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // État initial : on lit explicitement (le hook ci-dessus le fait déjà,
  // mais on veut une lecture indépendante pour ne pas dépendre du timing
  // interne du hook).
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: err } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'kitchen_open')
        .maybeSingle();
      if (cancelled) return;
      if (err) {
        console.warn('[KaïKaï kitchen-toggle UI] lecture initiale échec', err);
      } else if (data && typeof data.value === 'boolean') {
        setKitchenOpen(data.value);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleToggle = async () => {
    if (submitting) return;
    const next = !kitchenOpen;

    // Confirmation explicite si on est en train de couper — c'est l'action
    // potentiellement coûteuse pour le business. Le ré-ouverture est sans
    // friction.
    if (!next) {
      const ok = window.confirm(
        'Stopper les commandes ?\n\nLes clients verront « Fermé temporairement » et ne pourront plus passer commande.'
      );
      if (!ok) return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Session expirée — reconnectez-vous');
      const res = await fetch('/api/admin/toggle-kitchen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ open: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Échec (HTTP ${res.status})`);
      setKitchenOpen(body.open);
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || hookLoading) {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-bg-elev-2 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
        <span className="block h-[7px] w-[7px] rounded-full bg-ink-3" />
        Cuisine…
      </span>
    );
  }

  // Couleurs : vert pour ouvert (cohérent avec accent-green ailleurs),
  // rouge pour stop. Style identique aux autres pills du TopBar.
  const cls = kitchenOpen
    ? 'border-accent-green/30 bg-accent-green/10 text-accent-green hover:bg-accent-green/15'
    : 'border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/20';

  const autoLabel = formatStatusLabel(autoStatus);

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        onClick={handleToggle}
        disabled={submitting}
        title={
          kitchenOpen
            ? 'Les commandes peuvent passer — cliquer pour STOPPER'
            : 'STOP COMMANDES actif — cliquer pour ré-ouvrir'
        }
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors disabled:opacity-60 ${cls}`}
      >
        <span className={`block h-[7px] w-[7px] rounded-full ${kitchenOpen ? 'bg-accent-green kk-pulse-dot' : 'bg-red-400'}`} />
        <span className="hidden md:inline">{kitchenOpen ? 'Cuisine ouverte' : 'STOP commandes'}</span>
        <span className="md:hidden">{kitchenOpen ? 'Cuisine' : 'STOP'}</span>
      </button>
      <span className="hidden md:block font-mono text-[9px] uppercase tracking-[0.12em] text-ink-3">
        Auto : {autoLabel}
      </span>
      {error && (
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}
