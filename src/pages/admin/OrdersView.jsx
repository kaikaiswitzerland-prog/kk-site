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
      {/* Tabs — scroll horizontal avec snap sur mobile, gradient fade à droite */}
      <div className="relative mb-5 md:mb-7">
        <div
          className="kk-scroll flex gap-1 overflow-x-auto border-b border-line"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {TAB_FILTERS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ scrollSnapAlign: 'start' }}
                className={[
                  '-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors',
                  'md:gap-2 md:px-4 md:py-3',
                  active
                    ? 'border-accent text-ink'
                    : 'border-transparent text-ink-3 hover:text-ink-2',
                ].join(' ')}
              >
                {tab.label}
                {counts[tab.id] > 0 && (
                  <span
                    className={[
                      'rounded-full px-2 py-0.5 font-mono text-[11px]',
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
        {/* Fade à droite pour signaler le scroll possible (mobile uniquement) */}
        <div
          className="pointer-events-none absolute bottom-0 right-0 top-0 w-10 md:hidden"
          style={{
            background: 'linear-gradient(to left, var(--color-bg) 0%, rgba(10,10,10,0.6) 60%, transparent 100%)',
          }}
        />
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
