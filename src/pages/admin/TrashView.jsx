// src/pages/admin/TrashView.jsx — Vue Corbeille
//
// Liste des commandes mises à la corbeille (is_trashed=true), triées par
// trashed_at DESC (tri assuré par AdminApp). Deux modes :
//   - Normal      : boutons Restaurer (↩️) / Supprimer (❌) par carte.
//   - Sélection   : checkbox par carte + barre flottante avec actions de masse
//                   (Restaurer tout / Supprimer définitivement tout).
//
// La corbeille est exclue de l'écran d'accueil et de toute la compta.

import { useState } from 'react';
import { CheckSquare, X, Check, RotateCcw, Trash2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal.jsx';
import {
  fmt,
  fmtDate,
  fmtTime,
  fmtRelative,
  orderNumber,
  STATUS_LABELS,
} from '../../lib/admin/orderHelpers.js';

export default function TrashView({
  orders,
  onRestore,
  onRequestDelete,
  onRestoreOrders,
  onDeleteOrders,
}) {
  // ─── Mode sélection multiple (actions de masse) ─────────────
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const selectedCount = selectedIds.size;

  // "Tout sélectionner" : ajoute toutes les commandes de la corbeille à la
  // sélection. "Tout désélectionner" : vide.
  const selectAllVisible = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      orders.forEach((o) => next.add(o.id));
      return next;
    });
  const deselectAll = () => setSelectedIds(new Set());

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
      {/* En-tête : intro + bouton Sélectionner (même style qu'OrdersView). */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-3">
          {orders.length} commande{orders.length > 1 ? 's' : ''} à la corbeille —
          exclue{orders.length > 1 ? 's' : ''} de l'écran d'accueil et de la compta.
        </p>
        <button
          type="button"
          onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
          className={[
            'flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-colors',
            selectMode
              ? 'border-line-strong bg-bg-elev-2 text-ink'
              : 'border-line bg-bg text-ink-2 hover:border-line-strong hover:text-ink',
          ].join(' ')}
        >
          {selectMode ? <X size={15} /> : <CheckSquare size={15} />}
          <span className="hidden sm:inline">{selectMode ? 'Annuler' : 'Sélectionner'}</span>
        </button>
      </div>

      <div className="kk-orders-grid grid gap-3 md:gap-3.5">
        {orders.map((order) => {
          const selected = selectedIds.has(order.id);
          return (
            <div
              key={order.id}
              onClick={selectMode ? () => toggleSelect(order.id) : undefined}
              className={[
                'rounded-xl border bg-bg-elev p-3 md:p-4 transition-colors',
                selectMode ? 'cursor-pointer hover:border-line-strong' : '',
                selected ? 'border-accent bg-accent/5' : 'border-line',
              ].join(' ')}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                {selectMode && (
                  <div
                    aria-hidden
                    className={[
                      'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors',
                      selected ? 'border-accent bg-accent text-black' : 'border-line-strong bg-bg',
                    ].join(' ')}
                  >
                    {selected && <Check size={14} strokeWidth={3} />}
                  </div>
                )}
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

              {/* Boutons individuels — masqués en mode sélection. */}
              {!selectMode && (
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
              )}
            </div>
          );
        })}
      </div>

      {/* Espace pour que les dernières cartes ne soient pas masquées par la
          barre flottante. */}
      {selectMode && selectedCount > 0 && <div aria-hidden className="h-24" />}

      {/* Barre d'actions flottante — même position/style qu'OrdersView. */}
      {selectMode && selectedCount > 0 && (
        <div
          className="fixed left-1/2 z-[60] flex w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-bg-elev/95 px-3 py-2.5 shadow-2xl backdrop-blur-[20px] md:px-4"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4.75rem)' }}
        >
          <span className="font-mono text-[12px] font-bold text-ink">
            {selectedCount} commande{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={selectAllVisible}
              className="rounded-lg border border-line px-2.5 py-1.5 text-[12px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
            >
              Tout sélectionner
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="rounded-lg border border-line px-2.5 py-1.5 text-[12px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
            >
              Tout désélectionner
            </button>
            <button
              type="button"
              onClick={() => setConfirmRestoreOpen(true)}
              className="rounded-lg border border-line-strong bg-bg px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-bg-elev-2"
            >
              ↩️ Restaurer
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              className="rounded-lg border border-accent-red/30 bg-accent-red/15 px-3 py-1.5 text-[12px] font-bold text-accent-red transition-colors hover:bg-accent-red/25"
            >
              ❌ Supprimer définitivement
            </button>
          </div>
        </div>
      )}

      {confirmRestoreOpen && (
        <ConfirmModal
          title="Restaurer les commandes ?"
          message={`Restaurer ${selectedCount} commande${selectedCount > 1 ? 's' : ''} ? Elle${selectedCount > 1 ? 's réapparaîtront' : ' réapparaîtra'} dans l'écran d'accueil et la compta.`}
          confirmLabel="Restaurer"
          onConfirm={async () => {
            await onRestoreOrders([...selectedIds]);
            exitSelectMode();
          }}
          onClose={() => setConfirmRestoreOpen(false)}
        />
      )}

      {confirmDeleteOpen && (
        <ConfirmModal
          title="Supprimer définitivement ?"
          message={`Supprimer définitivement ${selectedCount} commande${selectedCount > 1 ? 's' : ''} ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          tone="danger"
          onConfirm={async () => {
            await onDeleteOrders([...selectedIds]);
            exitSelectMode();
          }}
          onClose={() => setConfirmDeleteOpen(false)}
        />
      )}
    </div>
  );
}
