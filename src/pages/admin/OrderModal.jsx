import { useState } from 'react';
import {
  fmt,
  fmtDate,
  fmtTime,
  orderNumber,
  STATUS_LABELS,
  STATUS_VISUAL,
  PAYMENT_LABELS,
  PAYMENT_ICON,
  renderVariantLines,
  buildTimeline,
  FORCEABLE_STATUSES,
  getItemCategoryLabel,
} from '../../lib/admin/orderHelpers.js';

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

export default function OrderModal({ order, onClose, onUpdateStatus, onPrint, onRequestRefund }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const visual = STATUS_VISUAL[order.status] || 'new';
  const isPaidCard = order.status === 'paid';
  const isTodo = order.status === 'pending' || order.status === 'paid';
  const timeline = buildTimeline(order);
  const [forceOpen, setForceOpen] = useState(false);

  const isRefundable = order.payment_method === 'card' &&
    ['paid', 'accepted', 'ready', 'delivered'].includes(order.status);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center"
      onClick={onClose}
    >
      <div
        className="kk-slide-up kk-scroll w-full max-w-[640px] overflow-y-auto rounded-t-3xl border-t border-line bg-bg-elev p-6 md:rounded-2xl md:border"
        style={{ maxHeight: '92svh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded bg-line md:hidden" />

        {/* En-tête */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="font-mono text-[11px] tracking-[0.1em] text-ink-3">
              #{orderNumber(order.id)}
            </div>
            <h2 className="font-display text-3xl italic leading-none tracking-[-0.02em]">
              {order.customer_name}
            </h2>
            <div className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
              {fmtDate(order.created_at)} · {fmtTime(order.created_at)}
            </div>
          </div>
          <span
            className={[
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em]',
              STATUS_PILL_CLASS[visual] || STATUS_PILL_CLASS.new,
            ].join(' ')}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        {/* Client */}
        <Section title="Client">
          <Row label="Téléphone">
            <a href={`tel:${order.customer_phone}`} className="font-mono text-accent">
              {order.customer_phone}
            </a>
          </Row>
          <Row
            label="Livraison"
            value={
              order.delivery_mode === 'pickup'
                ? '📦 À emporter'
                : `🚴 ${order.customer_address}`
            }
          />
          <Row label="Paiement">
            <span className="font-mono">
              {PAYMENT_ICON[order.payment_method] || ''} {PAYMENT_LABELS[order.payment_method] || order.payment_method}
              {isPaidCard && (
                <span className="ml-2 rounded bg-accent-green/12 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-accent-green">
                  Encaissée
                </span>
              )}
            </span>
          </Row>
          {/* Notes séparées (chantier 4) + fallback legacy `notes` pour les
              commandes antérieures à la migration. */}
          {order.note_kitchen && (
            <Row label="👨‍🍳 Cuisine" value={order.note_kitchen} />
          )}
          {order.delivery_mode === 'delivery' && order.note_delivery && (
            <Row label="🚴 Livreur" value={order.note_delivery} />
          )}
          {!order.note_kitchen && !order.note_delivery && order.notes && (
            <Row label="📝 Notes" value={order.notes} />
          )}
        </Section>

        {/* Timeline */}
        <Section title="Timeline">
          <div className="px-4 py-3 font-mono text-[12px] leading-relaxed text-ink-2">
            {timeline.map((step, i) => {
              const last = i === timeline.length - 1;
              return (
                <div key={i} className="flex flex-wrap items-baseline gap-2">
                  <span className="text-base leading-none">{step.icon}</span>
                  <span className="text-ink">{step.label}</span>
                  <span>:</span>
                  <span>{fmtTime(step.time)}</span>
                  {step.deltaMin !== null && (
                    <span className="text-ink-3">
                      (+{step.deltaMin} min{step.deltaFromLabel ? ` après ${step.deltaFromLabel}` : ''})
                    </span>
                  )}
                  {last && step.totalMin !== undefined && (
                    <span className="ml-auto rounded bg-accent/10 px-2 py-0.5 font-bold text-accent">
                      Total : {step.totalMin} min
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        {/* Articles */}
        <Section title="Articles">
          {items.map((it, i) => {
            const variants = renderVariantLines(it.variants);
            return (
              <div
                key={i}
                className="border-b border-line px-4 py-3 last:border-b-0"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span>
                    <span className="mr-2.5 font-mono font-semibold text-accent">{it.qty}×</span>
                    <span className="font-medium">{it.name}</span>
                    <span className="ml-1.5 font-mono text-[10px] uppercase tracking-[0.04em] text-ink-3">
                      [{getItemCategoryLabel(it)}]
                    </span>
                  </span>
                  <span className="font-mono font-semibold">
                    {fmt(it.subtotal ?? it.price * it.qty)}
                  </span>
                </div>
                {variants.length > 0 && (
                  <ul className="ml-7 mt-1.5 space-y-0.5 text-[12px] text-ink-3">
                    {variants.map((line, j) => (
                      <li key={j}>· {line}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          <div className="flex items-baseline justify-between px-4 py-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
              Total
            </span>
            <span className="font-display text-3xl italic leading-none tracking-[-0.02em]">
              {fmt(order.total)}
            </span>
          </div>
        </Section>

        {/* Actions principales */}
        <div className="mt-5 flex flex-wrap gap-2">
          {isTodo && (
            <>
              <button
                onClick={() => { onUpdateStatus(order.id, 'accepted'); onClose(); }}
                className="flex-1 rounded-lg bg-accent px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-accent-soft"
              >
                ✅ Accepter
              </button>
              {!isPaidCard && (
                <button
                  onClick={() => { onUpdateStatus(order.id, 'refused'); onClose(); }}
                  className="flex-1 rounded-lg border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm font-semibold text-accent-red transition-colors hover:bg-accent-red/20"
                >
                  Refuser
                </button>
              )}
            </>
          )}
          {order.status === 'accepted' && (
            <button
              onClick={() => { onUpdateStatus(order.id, 'ready'); onClose(); }}
              className="flex-1 rounded-lg bg-accent px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-accent-soft"
            >
              🍳 Marquer prête
            </button>
          )}
          {order.status === 'ready' && (
            <button
              onClick={() => { onUpdateStatus(order.id, 'delivered'); onClose(); }}
              className="flex-1 rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-4 py-3 text-sm font-bold text-accent-blue transition-colors hover:bg-accent-blue/20"
            >
              🛵 Marquer livrée
            </button>
          )}
          <button
            onClick={() => onPrint(order)}
            className="flex-1 rounded-lg border border-line-strong bg-bg px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-bg-elev-2"
          >
            🖨️ Ticket cuisine
          </button>
        </div>

        {/* Bouton Rembourser — uniquement pour les commandes carte payées */}
        {isRefundable && onRequestRefund && (
          <button
            onClick={() => onRequestRefund(order)}
            className="mt-2 w-full rounded-lg border border-accent-red/25 bg-transparent px-4 py-2.5 text-[12px] font-medium text-accent-red transition-colors hover:bg-accent-red/10"
          >
            ↩ Rembourser via SumUp
          </button>
        )}

        {/* Forcer le statut (override admin) */}
        <div className="mt-4 rounded-lg border border-line bg-bg/40 p-3">
          <button
            onClick={() => setForceOpen((v) => !v)}
            className="flex w-full items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3 transition-colors hover:text-ink-2"
          >
            <span>⚙️ Forcer le statut</span>
            <span>{forceOpen ? '▴' : '▾'}</span>
          </button>
          {forceOpen && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {FORCEABLE_STATUSES.map((s) => {
                const isCurrent = s === order.status;
                return (
                  <button
                    key={s}
                    onClick={() => { onUpdateStatus(order.id, s); }}
                    disabled={isCurrent}
                    className={[
                      'rounded-md border px-2.5 py-1 font-mono text-[11px] tracking-wider transition-colors',
                      isCurrent
                        ? 'cursor-default border-line bg-bg-elev-2 text-ink-3'
                        : 'border-line-strong bg-bg-elev-2 text-ink hover:bg-bg-elev-2',
                    ].join(' ')}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-2.5 w-full rounded-lg border border-line bg-transparent px-4 py-2.5 text-sm text-ink-2 transition-colors hover:text-ink"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <div className="mb-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">
        {title}
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-bg">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, children }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
      <span className="flex-shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
        {label}
      </span>
      <span className="break-words text-right text-[13px]">{children ?? value}</span>
    </div>
  );
}
