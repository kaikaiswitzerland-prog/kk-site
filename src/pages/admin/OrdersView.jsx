import { useEffect, useMemo, useState } from 'react';
import OrderCard from './OrderCard.jsx';
import { TAB_FILTERS, isAdminVisible, sortByPriority } from '../../lib/admin/orderHelpers.js';

const SCOPE_STORAGE_KEY = 'admin_orders_tab';

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
    const tab = scopedTabs.find((t) => t.id === activeTab) || scopedTabs[0];
    if (!tab) return [];
    const inTab = visible.filter((o) => tab.statuses.includes(o.status));
    return sortByPriority(inTab, tab.id);
  }, [visible, activeTab, scopedTabs]);

  return (
    <div>
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

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-bg-elev/40 p-12 text-center">
          <div className="mb-2 text-3xl">🍃</div>
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
            Aucune commande
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
