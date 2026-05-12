// Page admin Menu : gestion des ruptures de stock par plat.
// Lit la liste app_settings.out_of_stock_items et expose un toggle par plat.
// POST /api/admin/toggle-item-stock met à jour la liste côté serveur.
//
// Polling 30s côté client (useOutOfStock) — un toggle ici sera visible
// sur la carte publique en <30s.

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { getMenuByGroup } from '../../data/menuMeta.js';

export default function MenuView() {
  const [outOfStock, setOutOfStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState(null);
  const [error, setError] = useState(null);

  // Fetch initial — on lit explicitement (pas via le hook public) pour
  // ne pas dépendre du timing de polling.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: err } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'out_of_stock_items')
        .maybeSingle();
      if (cancelled) return;
      if (err) {
        console.warn('[KaïKaï menu-admin] lecture initiale échec', err);
      } else if (data && Array.isArray(data.value)) {
        setOutOfStock(data.value.filter(x => typeof x === 'string'));
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleToggle = async (itemId, currentlyAvailable) => {
    if (pendingId) return;
    const next = !currentlyAvailable; // état "available" cible
    setPendingId(itemId);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Session expirée — reconnectez-vous');
      const res = await fetch('/api/admin/toggle-item-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ itemId, available: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Échec (HTTP ${res.status})`);
      setOutOfStock(Array.isArray(body.out_of_stock_items) ? body.out_of_stock_items : []);
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setPendingId(null);
    }
  };

  const groups = getMenuByGroup();
  const outCount = outOfStock.length;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-xl border border-line bg-bg-elev p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">Info</div>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
          Bascule un plat en rupture pour empêcher les commandes carte et le griser sur la carte client.
          Les changements sont visibles côté public en moins de 30 secondes.
        </p>
        {outCount > 0 && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-accent-warm">
            {outCount} plat{outCount > 1 ? 's' : ''} en rupture
          </p>
        )}
      </div>

      {loading ? (
        <div className="rounded-xl border border-line bg-bg-elev p-8 text-center text-[13px] text-ink-3">
          Chargement…
        </div>
      ) : (
        groups.map(group => (
          <div key={group.id} className="rounded-xl border border-line bg-bg-elev p-5">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">
              {group.label}
            </div>
            <div className="divide-y divide-line">
              {group.items.map(item => {
                const available = !outOfStock.includes(item.id);
                const pending = pendingId === item.id;
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] text-ink">{item.name}</div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
                        #{item.id}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(item.id, available)}
                      disabled={pending}
                      className={[
                        'inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors disabled:opacity-60',
                        available
                          ? 'border-accent-green/30 bg-accent-green/10 text-accent-green hover:bg-accent-green/15'
                          : 'border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/20',
                      ].join(' ')}
                    >
                      <span className={`block h-[7px] w-[7px] rounded-full ${available ? 'bg-accent-green' : 'bg-red-400'}`} />
                      {pending ? '…' : available ? 'Disponible' : 'En rupture'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
