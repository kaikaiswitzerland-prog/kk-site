import { useMemo } from 'react';
import KpiCard from './KpiCard.jsx';
import TransactionsTable from './TransactionsTable.jsx';
import {
  fmt,
  calcStats,
  dayBoundaries,
  inRange,
  isRevenue,
  pctChange,
  favoritePaymentToday,
  exportOrdersCSV,
  PAYMENT_LABELS,
  PAYMENT_ICON,
} from '../../lib/admin/orderHelpers.js';

export default function ComptaView({ orders, onSelectOrder }) {
  const kpis = useMemo(() => {
    const { startOfDay, startOfYesterday, startOfWeek, startOfMonth } = dayBoundaries();
    const valid = orders.filter(isRevenue);

    const today = valid.filter((o) => inRange(o, startOfDay));
    const yesterday = valid.filter((o) => inRange(o, startOfYesterday, startOfDay));
    const week = valid.filter((o) => inRange(o, startOfWeek));
    const month = valid.filter((o) => inRange(o, startOfMonth));

    const dayStats = calcStats(today);
    const yStats = calcStats(yesterday);
    const weekStats = calcStats(week);
    const monthStats = calcStats(month);

    const revenueChange = pctChange(dayStats.revenue, yStats.revenue);
    const countChange = dayStats.count - yStats.count;
    const avgChange = pctChange(dayStats.avg, yStats.avg);

    const favorite = favoritePaymentToday(orders);

    return { dayStats, yStats, weekStats, monthStats, revenueChange, countChange, avgChange, favorite };
  }, [orders]);

  const trendUpDown = (n, suffix = '%') => {
    if (n === null || n === undefined) return null;
    if (n === 0) return { tone: 'neutral', icon: '·', text: `Stable ${suffix === '%' ? '' : suffix}` };
    const tone = n > 0 ? 'up' : 'down';
    const icon = n > 0 ? '▲' : '▼';
    const text = `${n > 0 ? '+' : ''}${n}${suffix} vs hier`;
    return { tone, icon, text };
  };

  const countTrend = (n) => {
    if (n === null || n === undefined) return null;
    if (n === 0) return { tone: 'neutral', icon: '·', text: '= vs hier' };
    const tone = n > 0 ? 'up' : 'down';
    const icon = n > 0 ? '▲' : '▼';
    return { tone, icon, text: `${n > 0 ? '+' : ''}${n} vs hier` };
  };

  return (
    <div>
      {/* KPIs */}
      <div className="mb-8 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <KpiCard
          label="CA du jour"
          value={fmt(kpis.dayStats.revenue)}
          trend={trendUpDown(kpis.revenueChange)}
        />
        <KpiCard
          label="Commandes"
          value={kpis.dayStats.count}
          trend={countTrend(kpis.countChange)}
        />
        <KpiCard
          label="Panier moyen"
          value={fmt(kpis.dayStats.avg)}
          trend={trendUpDown(kpis.avgChange)}
        />
        <KpiCard
          label="Mode favori"
          value={
            kpis.favorite ? (
              <span className="text-[28px]">
                {PAYMENT_ICON[kpis.favorite.method]} {PAYMENT_LABELS[kpis.favorite.method]}
              </span>
            ) : (
              <span className="text-[28px] text-ink-3">—</span>
            )
          }
          trend={
            kpis.favorite
              ? { tone: 'neutral', icon: '·', text: `${kpis.favorite.percent}% des paiements` }
              : null
          }
        />
      </div>

      {/* Vue secondaire — semaine / mois */}
      <div className="mb-8 grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-bg-elev p-5">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">
            Cette semaine
          </div>
          <div className="font-display text-2xl italic tracking-[-0.02em]">
            {fmt(kpis.weekStats.revenue)}
          </div>
          <div className="mt-1 font-mono text-[11px] text-ink-3">
            {kpis.weekStats.count} commandes · moy. {fmt(kpis.weekStats.avg)}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-bg-elev p-5">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">
            Ce mois
          </div>
          <div className="font-display text-2xl italic tracking-[-0.02em]">
            {fmt(kpis.monthStats.revenue)}
          </div>
          <div className="mt-1 font-mono text-[11px] text-ink-3">
            {kpis.monthStats.count} commandes · moy. {fmt(kpis.monthStats.avg)}
          </div>
        </div>
      </div>

      {/* Tableau transactions */}
      <TransactionsTable orders={orders} onSelect={onSelectOrder} />

      {/* Export CSV */}
      <div className="mt-6">
        <button
          onClick={() => exportOrdersCSV(orders)}
          className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-bg-elev-2 px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-white/10"
        >
          📥 Exporter CSV
        </button>
      </div>
    </div>
  );
}
