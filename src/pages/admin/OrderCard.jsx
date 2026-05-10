import {
  fmt,
  fmtTime,
  fmtRelative,
  orderNumber,
  STATUS_VISUAL,
  STATUS_LABELS,
  STATUS_SUBLABEL,
  urgencyFor,
  getItemCategoryLabel,
  renderVariantLines,
} from '../../lib/admin/orderHelpers.js';
import { useNow } from '../../hooks/useNow.js';

const STATUS_PILL_CLASS = {
  new: 'bg-accent-warm/12 text-accent-warm',
  paid: 'bg-accent-green/12 text-accent-green',
  preparing: 'bg-accent-blue/12 text-accent-blue',
  ready: 'bg-accent/12 text-accent',
  delivered: 'bg-bg-elev-2 text-ink-2',
  refused: 'bg-accent-red/12 text-accent-red',
  refunded: 'bg-accent-red/8 text-accent-red',
  pending_payment: 'bg-bg-elev-2 text-ink-3',
};

const URGENCY_TONE_CLASS = {
  green: 'text-accent-green',
  yellow: 'text-accent',
  red: 'text-accent-red kk-urgent-blink',
};

export default function OrderCard({ order, isNew, onSelect, onUpdateStatus, onPrint, onRequestRefund }) {
  const now = useNow();
  const items = Array.isArray(order.items) ? order.items : [];
  const visual = STATUS_VISUAL[order.status] || 'new';
  const sublabel = STATUS_SUBLABEL(order);
  const isTodo = order.status === 'pending' || order.status === 'paid';
  const isPaidCard = order.status === 'paid';
  const urgency = urgencyFor(order, now);

  // Une commande est remboursable côté UI si elle a été payée carte (cycle
  // SumUp : paid/accepted/ready/delivered) — on n'affiche pas le bouton sur
  // 'pending' (twint/cash non encore encaissé) ni 'refunded' (déjà fait).
  const isRefundable = order.payment_method === 'card' &&
    ['paid', 'accepted', 'ready', 'delivered'].includes(order.status);

  const deliveryPill =
    order.delivery_mode === 'pickup' ? '📦 À emporter' : '🚴 Livraison';

  return (
    <div
      data-status={visual}
      className={[
        'kk-order-card group cursor-pointer rounded-xl border border-line bg-bg-elev p-3 md:p-4',
        'transition-colors hover:border-line-strong hover:bg-bg-elev-2',
        isNew ? 'kk-new-pulse' : '',
      ].join(' ')}
      onClick={() => onSelect(order)}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[11px] tracking-[0.1em] text-ink-3">
            #{orderNumber(order.id)}
          </div>
          <div
            title={order.customer_name}
            className="truncate text-base font-semibold leading-tight tracking-[-0.01em]"
          >
            {order.customer_name}
          </div>
        </div>
        <div className="flex-shrink-0 text-right font-mono text-[13px] text-ink-2">
          {fmtTime(order.created_at)}
          <span className="mt-0.5 block text-[10px] text-ink-3">
            {fmtRelative(order.created_at)}
          </span>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <div
          className={[
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em]',
            STATUS_PILL_CLASS[visual] || STATUS_PILL_CLASS.new,
          ].join(' ')}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {STATUS_LABELS[order.status]}
        </div>
        {sublabel && (
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
            · {sublabel}
          </span>
        )}
      </div>

      {urgency && (
        <div
          className={[
            'mb-3 flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-tight',
            URGENCY_TONE_CLASS[urgency.tone],
          ].join(' ')}
        >
          <span aria-hidden>
            {urgency.tone === 'green' ? '🟢' : urgency.tone === 'yellow' ? '🟡' : '🔴'}
          </span>
          <span>{urgency.label}</span>
        </div>
      )}

      <ul className="mb-3 space-y-1 text-xs md:text-[13px]">
        {items.slice(0, 4).map((it, i) => {
          const variantLines = renderVariantLines(it.variants);
          return (
            <li key={i} className="text-ink-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-baseline">
                  <span className="mr-2.5 flex-shrink-0 font-mono font-semibold text-accent">
                    {it.qty}×
                  </span>
                  <span className="truncate text-ink" title={it.name}>{it.name}</span>
                  <span className="ml-1.5 flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.04em] text-ink-3">
                    [{getItemCategoryLabel(it)}]
                  </span>
                </span>
                <span className="flex-shrink-0 font-mono text-ink-2">
                  {fmt(it.subtotal ?? it.price * it.qty)}
                </span>
              </div>
              {variantLines.length > 0 && (
                <ul className="mt-1 space-y-0.5 pl-7 font-mono text-[12px] text-ink-3">
                  {variantLines.map((line, j) => (
                    <li key={j}>· {line}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
        {items.length > 4 && (
          <li className="pl-7 font-mono text-[11px] text-ink-3">
            + {items.length - 4} autre{items.length - 4 > 1 ? 's' : ''}
          </li>
        )}
      </ul>

      <div className="mb-3 flex flex-wrap gap-1.5 border-y border-dashed border-line py-2.5">
        <Pill>{deliveryPill}</Pill>
        {order.delivery_mode === 'delivery' && order.customer_address && (
          <Pill>📍 {order.customer_address}</Pill>
        )}
        {order.notes && <Pill>📝 {order.notes}</Pill>}
      </div>

      <div className="mb-3 flex items-baseline justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">Total</span>
        <span className="flex-shrink-0 font-display text-[26px] italic leading-none tracking-[-0.02em] md:text-[32px]">
          {fmt(order.total)}
        </span>
      </div>

      {isTodo && (
        <div
          className="flex flex-wrap gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onPrint(order)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line-strong bg-bg px-3 py-2.5 text-[12px] font-medium text-ink transition-colors hover:bg-bg-elev-2"
          >
            🖨️ Ticket
          </button>
          <button
            onClick={() => onUpdateStatus(order.id, 'accepted')}
            className="flex flex-1 items-center justify-center rounded-lg bg-accent px-3 py-2.5 text-[12px] font-bold text-black transition-colors hover:bg-accent-soft"
          >
            Accepter →
          </button>
          {/* Bouton Refuser caché sur les commandes payées carte (remboursement = flow séparé) */}
          {!isPaidCard && (
            <button
              onClick={() => onUpdateStatus(order.id, 'refused')}
              className="flex flex-none items-center justify-center rounded-lg border border-accent-red/30 bg-accent-red/10 px-3 py-2.5 text-[12px] font-medium text-accent-red transition-colors hover:bg-accent-red/20"
              title="Refuser"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {order.status === 'accepted' && (
        <div onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onUpdateStatus(order.id, 'ready')}
            className="w-full rounded-lg bg-accent px-3 py-2.5 text-[12px] font-bold text-black transition-colors hover:bg-accent-soft"
          >
            🍳 Marquer prête →
          </button>
        </div>
      )}

      {order.status === 'ready' && (
        <div onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onUpdateStatus(order.id, 'delivered')}
            className="w-full rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-3 py-2.5 text-[12px] font-bold text-accent-blue transition-colors hover:bg-accent-blue/20"
          >
            🛵 Marquer livrée
          </button>
        </div>
      )}

      {/* Bouton Rembourser : visible pour les commandes carte (paid →
          delivered). Cliquer ouvre la RefundModal de confirmation. */}
      {isRefundable && onRequestRefund && (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onRequestRefund(order)}
            className="w-full rounded-lg border border-accent-red/20 bg-transparent px-3 py-2 text-[11px] font-medium text-accent-red transition-colors hover:bg-accent-red/10"
            title="Rembourser via SumUp"
          >
            ↩ Rembourser
          </button>
        </div>
      )}
    </div>
  );
}

function Pill({ children }) {
  return (
    <span className="max-w-full break-words rounded bg-bg-elev-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-2">
      {children}
    </span>
  );
}
