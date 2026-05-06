export default function KpiCard({ label, value, trend }) {
  return (
    <div className="kk-kpi rounded-xl border border-line bg-bg-elev p-5">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">
        {label}
      </div>
      <div className="font-display text-[42px] italic leading-none tracking-[-0.03em]">
        {value}
      </div>
      {trend && (
        <div
          className={[
            'mt-2 inline-flex items-center gap-1 font-mono text-[11px]',
            trend.tone === 'up' ? 'text-accent-green' :
            trend.tone === 'down' ? 'text-accent-red' :
            'text-ink-3',
          ].join(' ')}
        >
          {trend.icon} {trend.text}
        </div>
      )}
    </div>
  );
}
