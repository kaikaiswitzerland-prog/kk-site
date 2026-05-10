import { useMemo } from 'react';
import OrderCard from './OrderCard.jsx';
import { TAB_FILTERS, isAdminVisible, sortByPriority } from '../../lib/admin/orderHelpers.js';

export default function OrdersView({
  orders,
  activeTab,
  setActiveTab,
  recentlyAddedIds,
  onSelect,
  onUpdateStatus,
  onPrint,
  onRequestRefund,
}) {
  // Toujours masquer pending_payment du tableau de bord
  const visible = useMemo(() => orders.filter(isAdminVisible), [orders]);

  const counts = useMemo(() => {
    const c = {};
    for (const tab of TAB_FILTERS) {
      c[tab.id] = visible.filter((o) => tab.statuses.includes(o.status)).length;
    }
    return c;
  }, [visible]);

  const filtered = useMemo(() => {
    const tab = TAB_FILTERS.find((t) => t.id === activeTab) || TAB_FILTERS[0];
    const inTab = visible.filter((o) => tab.statuses.includes(o.status));
    return sortByPriority(inTab, tab.id);
  }, [visible, activeTab]);

  return (
    <div>
      {/* Tabs — scroll horizontal avec snap proximity (peut déborder, scroll naturel).
          Sur mobile : padding/text/badge ultra-compacts pour maximiser le nombre
          de tabs visibles d'un coup sans déborder. */}
      <div
        className="kk-scroll mb-5 flex gap-0.5 overflow-x-auto border-b border-line md:mb-7 md:gap-1"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {TAB_FILTERS.map((tab) => {
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
