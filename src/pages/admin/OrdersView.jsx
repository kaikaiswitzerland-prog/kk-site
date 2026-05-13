import { useEffect, useMemo, useState } from 'react';
import OrderCard from './OrderCard.jsx';
import { TAB_FILTERS, isAdminVisible, orderNumber, sortByPriority } from '../../lib/admin/orderHelpers.js';

const SCOPE_STORAGE_KEY = 'admin_orders_tab';
const SEARCH_MIN_CHARS = 3;
const SEARCH_DEBOUNCE_MS = 200;

const PRIMARY_SCOPES = [
  { id: 'active',    label: 'En cours' },
  { id: 'completed', label: 'Terminées' },
];

function readInitialScope() {
  try {
    const stored = localStorage.getItem(SCOPE_STORAGE_KEY);
    if (stored === 'active' || stored === 'completed') return stored;
  } catch {
    /* localStorage indisponible — fallback default */
  }
  return 'active';
}

// Normalisation pour la recherche : casse + accents (NFD strip diacritics).
const DIACRITICS_RE = /[̀-ͯ]/g;
function normalize(s) {
  return String(s ?? '').normalize('NFD').replace(DIACRITICS_RE, '').toLowerCase();
}

function orderMatches(order, needle) {
  const fields = [
    order.customer_name,
    order.customer_email,
    order.customer_phone,
    order.customer_address,
    orderNumber(order.id),
    order.note_kitchen,
    order.note_delivery,
  ];
  return fields.some((f) => f && normalize(f).includes(needle));
}

export default function OrdersView({
  orders,
  activeTab,
  setActiveTab,
  recentlyAddedIds,
  onSelect,
  onUpdateStatus,
  onPrint,
  onRequestRefund,
  onRequestRefuse,
}) {
  // Onglet primaire (En cours / Terminées) persistant en localStorage.
  const [primaryScope, setPrimaryScope] = useState(readInitialScope);

  useEffect(() => {
    try { localStorage.setItem(SCOPE_STORAGE_KEY, primaryScope); } catch { /* */ }
  }, [primaryScope]);

  // Barre de recherche : `query` reflète l'input en temps réel, mais le filtre
  // utilise `debouncedQuery` (200ms) pour éviter le re-render à chaque frappe.
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);
  const needle = normalize(debouncedQuery.trim());
  const searchActive = needle.length >= SEARCH_MIN_CHARS;

  // Toujours masquer pending_payment du tableau de bord
  const visible = useMemo(() => orders.filter(isAdminVisible), [orders]);

  // Sous-onglets affichés = ceux du scope primaire courant.
  const scopedTabs = useMemo(
    () => TAB_FILTERS.filter((t) => t.scope === primaryScope),
    [primaryScope]
  );

  const counts = useMemo(() => {
    const c = {};
    for (const tab of TAB_FILTERS) {
      c[tab.id] = visible.filter((o) => tab.statuses.includes(o.status)).length;
    }
    return c;
  }, [visible]);

  // Total par scope primaire (badge sur l'onglet niveau 1).
  const scopeCounts = useMemo(() => {
    const c = { active: 0, completed: 0 };
    for (const tab of TAB_FILTERS) {
      c[tab.scope] += counts[tab.id] || 0;
    }
    return c;
  }, [counts]);

  // Si on bascule de scope et que l'activeTab courant n'appartient plus au
  // nouveau scope, on jump vers le premier sous-onglet du scope.
  useEffect(() => {
    const stillValid = scopedTabs.some((t) => t.id === activeTab);
    if (!stillValid && scopedTabs.length > 0) {
      setActiveTab(scopedTabs[0].id);
    }
  }, [scopedTabs, activeTab, setActiveTab]);

  const filtered = useMemo(() => {
    // Mode recherche : on bypass les onglets et on fouille toutes les
    // commandes visibles. Tri par created_at desc (plus récentes en haut).
    if (searchActive) {
      const matched = visible.filter((o) => orderMatches(o, needle));
      return [...matched].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    const tab = scopedTabs.find((t) => t.id === activeTab) || scopedTabs[0];
    if (!tab) return [];
    const inTab = visible.filter((o) => tab.statuses.includes(o.status));
    return sortByPriority(inTab, tab.id);
  }, [visible, activeTab, scopedTabs, searchActive, needle]);

  return (
    <div>
      {/* Barre de recherche — full width, toujours visible. Si la query
          contient ≥3 caractères (debounce 200ms), on bypass les onglets et
          on affiche les résultats sur toutes les commandes (active + archives). */}
      <div className="mb-3 relative md:mb-4">
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
        >
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher (nom, email, tél, n° commande, adresse, note…)"
          className="w-full rounded-xl border border-line bg-bg py-2.5 pl-9 pr-9 text-[13px] outline-none transition-colors focus:border-line-strong"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Effacer la recherche"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 font-mono text-[14px] text-ink-3 transition-colors hover:bg-bg-elev-2 hover:text-ink"
          >
            ✕
          </button>
        )}
      </div>

      {/* Mode recherche : header résultats à la place des onglets. */}
      {searchActive ? (
        <div className="mb-4 flex items-center justify-between gap-3 md:mb-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''} pour
            <span className="ml-1 text-ink">« {debouncedQuery.trim()} »</span>
          </div>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
          >
            Effacer
          </button>
        </div>
      ) : (
      <>
      {/* Niveau 1 : onglets primaires En cours / Terminées (segmented control).
          Persistant en localStorage. */}
      <div className="mb-3 inline-flex rounded-xl border border-line bg-bg p-1 md:mb-4">
        {PRIMARY_SCOPES.map((scope) => {
          const active = scope.id === primaryScope;
          const count = scopeCounts[scope.id] || 0;
          return (
            <button
              key={scope.id}
              onClick={() => setPrimaryScope(scope.id)}
              className={[
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors',
                active
                  ? 'bg-bg-elev-2 text-ink shadow-sm'
                  : 'text-ink-3 hover:text-ink-2',
              ].join(' ')}
            >
              {scope.label}
              {count > 0 && (
                <span
                  className={[
                    'rounded-full px-2 py-0.5 font-mono text-[10px]',
                    active ? 'bg-accent font-bold text-black' : 'bg-bg-elev-2 text-ink-2',
                  ].join(' ')}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Niveau 2 : sous-onglets filtrés par scope (scroll horizontal sur mobile). */}
      <div
        className="kk-scroll mb-5 flex gap-0.5 overflow-x-auto border-b border-line md:mb-7 md:gap-1"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {scopedTabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ scrollSnapAlign: 'start' }}
              className={[
                '-mb-px inline-flex items-center gap-1 whitespace-nowrap border-b-2 px-2.5 py-2 text-[12px] font-medium transition-colors',
                'md:gap-2 md:px-4 md:py-3 md:text-[13px]',
                active
                  ? 'border-accent text-ink'
                  : 'border-transparent text-ink-3 hover:text-ink-2',
              ].join(' ')}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span
                  className={[
                    'rounded-full px-1.5 py-0.5 font-mono text-[10px] md:px-2 md:text-[11px]',
                    active ? 'bg-accent font-bold text-black' : 'bg-bg-elev-2 text-ink-2',
                  ].join(' ')}
                >
                  {counts[tab.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>
      </>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-bg-elev/40 p-12 text-center">
          <div className="mb-2 text-3xl">🍃</div>
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
            {searchActive ? 'Aucun résultat' : 'Aucune commande'}
          </div>
        </div>
      ) : (
        <div
          className="kk-orders-grid grid gap-3 md:gap-3.5"
        >
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isNew={recentlyAddedIds.has(order.id)}
              onSelect={onSelect}
              onUpdateStatus={onUpdateStatus}
              onPrint={onPrint}
              onRequestRefund={onRequestRefund}
              onRequestRefuse={onRequestRefuse}
            />
          ))}
        </div>
      )}
    </div>
  );
}
