// src/pages/admin/KitchenToggle.jsx
// Toggle 3 états du mode cuisine — réservé au header admin.
// Lit/écrit app_settings.kitchen_open avec sémantique :
//   - null  → AUTO (suit les horaires programmés)
//   - true  → FORCER OUVERT (bypass horaires)
//   - false → STOP COMMANDES (force fermé immédiat)
// Côté API : POST /api/admin/toggle-kitchen avec body { open: true|false|null }.

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useRestaurantOpen } from '../../hooks/useRestaurantOpen.js';
import { formatStatusLabel } from '../../lib/restaurantHours.js';

const MODES = [
  { id: 'auto', value: null,  short: 'AUTO',   title: 'Suivre les horaires programmés' },
  { id: 'open', value: true,  short: 'OUVERT', title: 'Forcer la prise de commandes (bypass horaires)' },
  { id: 'stop', value: false, short: 'STOP',   title: 'Stopper les commandes immédiatement' },
];

function valueToMode(v) {
  if (v === true)  return 'open';
  if (v === false) return 'stop';
  return 'auto';
}

export default function KitchenToggle() {
  const { status: autoStatus, loading: hookLoading } = useRestaurantOpen();
  const [mode, setMode] = useState('auto');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
        setMode(valueToMode(data.value));
      }
      // row absente / value non-boolean → mode 'auto' (état initial du useState)
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const changeMode = async (nextMode) => {
    if (submitting || nextMode === mode) return;
    const nextValue = MODES.find((m) => m.id === nextMode).value;

    // Confirmation explicite pour STOP (impact business). Les deux autres
    // bascules sont sans friction.
    if (nextMode === 'stop') {
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
        body: JSON.stringify({ open: nextValue }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Échec (HTTP ${res.status})`);
      setMode(valueToMode(typeof body.open === 'boolean' ? body.open : null));
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

  // Style cohérent avec les pills du TopBar : actif = couleur pleine + dot,
  // inactif = neutre ink-3.
  const segCls = (m) => {
    if (m.id !== mode) {
      return 'border-line-strong bg-bg-elev-2 text-ink-3 hover:text-ink-2';
    }
    if (m.id === 'auto') return 'border-amber-400/40 bg-amber-400/15 text-amber-300';
    if (m.id === 'open') return 'border-accent-green/30 bg-accent-green/10 text-accent-green';
    return 'border-red-500/40 bg-red-500/15 text-red-300';
  };

  const dotCls = (m) => {
    if (m.id === 'auto') return 'bg-amber-300 kk-pulse-dot';
    if (m.id === 'open') return 'bg-accent-green kk-pulse-dot';
    return 'bg-red-400';
  };

  const autoLabel = formatStatusLabel(autoStatus);
  const subtext =
    mode === 'auto' ? `Auto · ${autoLabel}`
    : mode === 'open' ? `Forcé ouvert · auto = ${autoLabel}`
    : 'Forcé fermé';

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="inline-flex items-center gap-1" role="group" aria-label="Mode cuisine">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => changeMode(m.id)}
            disabled={submitting}
            title={m.title}
            aria-pressed={mode === m.id}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors disabled:opacity-60 ${segCls(m)}`}
          >
            {mode === m.id && (
              <span className={`block h-[7px] w-[7px] rounded-full ${dotCls(m)}`} />
            )}
            <span>{m.short}</span>
          </button>
        ))}
      </div>
      <span className="hidden md:block font-mono text-[9px] uppercase tracking-[0.12em] text-ink-3">
        {subtext}
      </span>
      {error && (
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}
