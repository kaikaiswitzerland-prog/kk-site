import { useMemo, useState } from 'react';
import {
  fmtAmount,
  fmtTime,
  orderNumber,
  isRevenue,
  PAYMENT_LABELS,
} from '../../lib/admin/orderHelpers.js';

const FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'card', label: 'Carte' },
  { id: 'twint', label: 'Twint' },
  { id: 'cash', label: 'Cash' },
];

const PILL_CLASS = {
  card: 'bg-accent-blue/10 text-accent-blue',
  twint: 'bg-accent/10 text-accent',
  cash: 'bg-accent-warm/10 text-accent-warm',
};

export default function TransactionsTable({ orders, onSelect }) {
  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => {
    const valid = orders.filter(isRevenue);
    return filter === 'all' ? valid : valid.filter((o) => o.payment_method === filter);
  }, [orders, filter]);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-bg-elev">
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
        <h3 className="font-display text-2xl italic tracking-[-0.02em]">
          Transactions
        </h3>
        <div className="flex gap-2">
          {FILTERS.map((f) => {
            const active = f.id === filter;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={[
                  'rounded-md border px-3 py-1.5 font-mono text-[12px] tracking-wider transition-colors',
                  active
                    ? 'border-ink bg-ink text-black'
                    : 'border-line bg-transparent text-ink-2 hover:border-line-strong hover:text-ink',
                ].join(' ')}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
          Aucune transaction
        </div>
      ) : (
        <div className="overflow-x-auto kk-scroll">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th>Heure</Th>
                <Th>Commande</Th>
                <Th>Client</Th>
                <Th>Mode</Th>
                <Th align="right">Montant</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => onSelect?.(o)}
                  className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                >
                  <Td>{fmtTime(o.created_at)}</Td>
                  <Td mono>#{orderNumber(o.id)}</Td>
                  <Td>{o.customer_name}</Td>
                  <Td>
                    <span
                      className={[
                        'inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider',
                        PILL_CLASS[o.payment_method] || 'bg-white/[0.06] text-ink-2',
                      ].join(' ')}
                    >
                      {(PAYMENT_LABELS[o.payment_method] || o.payment_method).toUpperCase()}
                    </span>
                  </Td>
                  <Td align="right" mono>
                    <span className="font-bold text-ink">{fmtAmount(o.total)}</span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, align = 'left' }) {
  return (
    <th
      className="border-b border-line bg-bg px-5 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-3"
      style={{ textAlign: align }}
    >
      {children}
    </th>
  );
}

function Td({ children, align = 'left', mono = false }) {
  return (
    <td
      className={[
        'border-b border-line px-5 py-3.5 text-[13px] text-ink-2',
        mono ? 'font-mono' : '',
      ].join(' ')}
      style={{ textAlign: align }}
    >
      {children}
    </td>
  );
}
