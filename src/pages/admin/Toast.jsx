import { fmt } from '../../lib/admin/orderHelpers.js';

export default function Toast({ order }) {
  if (!order) return null;
  const isCard = order.payment_method === 'card';
  return (
    <div
      className="
        kk-toast-in fixed left-1/2 top-5 z-[100] -translate-x-1/2 whitespace-nowrap
        rounded-xl px-4 py-2.5 text-sm font-bold shadow-2xl
      "
      style={{
        background: isCard ? 'var(--color-accent-green)' : 'var(--color-accent-warm)',
        color: '#000',
      }}
    >
      🍜 Nouvelle commande — {order.customer_name} · {fmt(order.total)}
      {isCard && <span className="ml-2 font-mono text-[11px] opacity-80">payée carte</span>}
    </div>
  );
}
