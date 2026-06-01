import { fmt } from '../../lib/admin/orderHelpers.js';

export default function Toast({ order }) {
  if (!order) return null;

  // Toast générique (message libre).
  // Sans `tone` → legacy corbeille : fond warm + préfixe 🗑️ automatique.
  // Avec `tone` ('success' | 'error') → toast d'impression thermique :
  // l'appelant fournit l'emoji, on n'en ajoute pas. Couleurs dédiées.
  if (order.message) {
    const tone = order.tone;
    if (!tone) {
      return (
        <div
          className="
            kk-toast-in fixed left-1/2 top-5 z-[100] -translate-x-1/2 whitespace-nowrap
            rounded-xl px-4 py-2.5 text-sm font-bold shadow-2xl
          "
          style={{ background: 'var(--color-accent-warm)', color: '#000' }}
        >
          🗑️ {order.message}
        </div>
      );
    }
    const bg =
      tone === 'success' ? 'var(--color-accent-green)'
      : tone === 'error'   ? 'var(--color-accent-red)'
      : 'var(--color-accent-warm)';
    const fg = tone === 'error' ? '#fff' : '#000';
    return (
      <div
        className="
          kk-toast-in fixed left-1/2 top-5 z-[100] -translate-x-1/2 whitespace-nowrap
          rounded-xl px-4 py-2.5 text-sm font-bold shadow-2xl
        "
        style={{ background: bg, color: fg }}
      >
        {order.message}
      </div>
    );
  }

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
