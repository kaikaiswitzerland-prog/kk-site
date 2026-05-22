// src/pages/admin/TrashView.jsx — Vue Corbeille
//
// Liste des commandes mises à la corbeille (is_trashed=true), triées par
// trashed_at DESC (tri assuré par AdminApp). Chaque commande propose :
//   - Restaurer (↩️)               → la remet dans la liste + la compta
//   - Supprimer définitivement (❌) → DELETE en base (via modale de confirmation)
//
// La corbeille est exclue de l'écran d'accueil et de toute la compta.

import { RotateCcw, Trash2 } from 'lucide-react';
import {
  fmt,
  fmtDate,
  fmtTime,
  fmtRelative,
  orderNumber,
  STATUS_LABELS,
} from '../../lib/admin/orderHelpers.js';

export default function TrashView({ orders, onRestore, onRequestDelete }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-bg-elev/40 p-12 text-center">
        <div className="mb-2 text-3xl">🗑️</div>
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
          Corbeille vide
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-5 text-[13px] text-ink-3">
        {orders.length} commande{orders.length > 1 ? 's' : ''} à la corbeille —
        exclue{orders.length > 1 ? 's' : ''} de l'écran d'accueil et de la compta.
      </p>

      <div className="kk-orders-grid grid gap-3 md:gap-3.5">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-xl border border-line bg-bg-elev p-3 md:p-4"
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
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
                  {STATUS_LABELS[order.status] || order.status} ·{' '}
                  {fmtDate(order.created_at)} {fmtTime(order.created_at)}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="font-display text-[22px] italic leading-none tracking-[-0.02em]">
                  {fmt(order.total)}
                </span>
                {order.trashed_at && (
                  <span className="mt-1 block font-mono text-[10px] text-ink-3">
                    🗑️ {fmtRelative(order.trashed_at)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onRestore(order)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line-strong bg-bg px-3 py-2.5 text-[12px] font-medium text-ink transition-colors hover:bg-bg-elev-2"
              >
                <RotateCcw size={14} strokeWidth={1.75} /> Restaurer
              </button>
              <button
                type="button"
                onClick={() => onRequestDelete(order)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-accent-red/30 bg-accent-red/10 px-3 py-2.5 text-[12px] font-medium text-accent-red transition-colors hover:bg-accent-red/20"
              >
                <Trash2 size={14} strokeWidth={1.75} /> Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
