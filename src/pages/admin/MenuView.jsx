// Page admin Menu : gestion des ruptures, au plat ET à l'option.
// Lit la liste app_settings.out_of_stock_items et expose un toggle par plat
// plus un toggle par option, en retrait sous le plat.
// POST /api/admin/toggle-item-stock met à jour la liste côté serveur.
//
// Clés manipulées : "5" (plat entier) et "5:porc" (option seule).
//
// La cascade « toutes les options en rupture → plat indisponible » est
// CALCULÉE à l'affichage (stockRules.isItemUnavailable) et n'est jamais
// écrite en base : on ne persiste que ce que l'admin a explicitement basculé.
//
// Polling 30s côté client (useOutOfStock) — un toggle ici sera visible
// sur la carte publique en <30s.

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { getMenuByGroup, MENU_ITEMS } from '../../data/menuMeta.js';
import {
  getItemOptions,
  isItemExplicitlyOut,
  isItemUnavailable,
  isOptionOut,
  makeStockKey,
  parseStockKey,
} from '../../lib/stockRules.js';

export default function MenuView() {
  const [outOfStock, setOutOfStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState(null);
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

  const handleToggle = async (stockKey, currentlyAvailable) => {
    if (pendingKey) return;
    const next = !currentlyAvailable; // état "available" cible
    setPendingKey(stockKey);
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
        body: JSON.stringify({ itemId: stockKey, available: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Échec (HTTP ${res.status})`);
      setOutOfStock(Array.isArray(body.out_of_stock_items) ? body.out_of_stock_items : []);
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setPendingKey(null);
    }
  };

  const groups = getMenuByGroup();

  // Compteurs : plats RÉELLEMENT indisponibles (explicites + cascade), et
  // options en rupture (clés porteuses d'un optionId).
  const unavailableCount = MENU_ITEMS.filter(it => isItemUnavailable(outOfStock, it)).length;
  const outOptionCount = outOfStock.filter(k => parseStockKey(k).optionId).length;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-xl border border-line bg-bg-elev p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">Info</div>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
          Bascule un plat en rupture pour empêcher les commandes carte et le griser sur la carte client.
          Tu peux aussi ne couper qu'une option (une protéine, un coulis, un jus…) : le plat reste
          commandable avec les autres. Les changements sont visibles côté public en moins de 30 secondes.
        </p>
        {(unavailableCount > 0 || outOptionCount > 0) && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-accent-warm">
            {unavailableCount} plat{unavailableCount > 1 ? 's' : ''} indisponible{unavailableCount > 1 ? 's' : ''}
            {' · '}
            {outOptionCount} option{outOptionCount > 1 ? 's' : ''} en rupture
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
                const explicitlyOut = isItemExplicitlyOut(outOfStock, item.id);
                const available = !explicitlyOut;
                const pending = pendingKey === item.id;
                const options = getItemOptions(item);
                // Cascade : toutes les options tombées sans que le plat lui-même
                // ait été basculé. Purement informatif, rien n'est écrit en base.
                const cascaded = !explicitlyOut && isItemUnavailable(outOfStock, item);

                return (
                  <div key={item.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] text-ink">{item.name}</div>
                        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
                          #{item.id}
                        </div>
                        {cascaded && (
                          <div className="mt-1 text-[11px] text-accent-warm">
                            Indisponible (toutes options en rupture)
                          </div>
                        )}
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

                    {options.length > 0 && (
                      <div className="mt-2 space-y-1 border-l border-line pl-4">
                        {options.map(opt => {
                          const key = makeStockKey(item.id, opt.id);
                          const optAvailable = !isOptionOut(outOfStock, item.id, opt.id);
                          const optPending = pendingKey === key;
                          // Le toggle plat entier prime : options verrouillées
                          // tant que le plat est explicitement coupé.
                          const locked = explicitlyOut;

                          return (
                            <div
                              key={key}
                              className={`flex items-center justify-between gap-3 py-1 ${locked ? 'opacity-40' : ''}`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-[13px] text-ink-2">{opt.name}</div>
                                <div className="font-mono text-[10px] tracking-wider text-ink-3">
                                  {key}
                                </div>
                              </div>
                              <button
                                onClick={() => handleToggle(key, optAvailable)}
                                disabled={optPending || locked}
                                title={locked ? 'Le plat entier est en rupture' : undefined}
                                className={[
                                  'inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                                  optAvailable
                                    ? 'border-accent-green/30 bg-accent-green/10 text-accent-green hover:bg-accent-green/15'
                                    : 'border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/20',
                                ].join(' ')}
                              >
                                <span className={`block h-[6px] w-[6px] rounded-full ${optAvailable ? 'bg-accent-green' : 'bg-red-400'}`} />
                                {optPending ? '…' : optAvailable ? 'Disponible' : 'En rupture'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
