// src/pages/admin/RefundModal.jsx — Confirmation de remboursement
//
// Affichée au clic sur "Rembourser" (commandes payées carte uniquement).
// Récap commande + champ optionnel pour le motif. Au confirm, appelle
// /api/sumup-refund avec le JWT de l'admin.

import { useState } from 'react';
import { fmt, orderNumber } from '../../lib/admin/orderHelpers.js';

export default function RefundModal({ order, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(order, reason.trim() || null);
      onClose();
    } catch (err) {
      setError(err?.message || 'Échec du remboursement');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center"
      onClick={submitting ? undefined : onClose}
    >
      <div
        className="kk-slide-up w-full max-w-md overflow-hidden rounded-t-3xl border-t border-line bg-bg-elev p-6 md:rounded-2xl md:border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded bg-line md:hidden" />

        <h2 className="mb-4 font-display text-2xl italic tracking-[-0.02em]">
          Confirmer le remboursement
        </h2>

        <div className="mb-5 space-y-2 rounded-xl border border-line bg-bg p-4 font-mono text-[12px]">
          <div className="flex justify-between">
            <span className="text-ink-3">Commande</span>
            <span>#{orderNumber(order.id)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-3">Client</span>
            <span>{order.customer_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-3">Montant remboursé</span>
            <span className="font-bold text-accent">{fmt(order.total)}</span>
          </div>
        </div>

        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          Motif (optionnel, ajouté aux notes de la commande)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Ex : rupture stock, erreur préparation, demande client…"
          disabled={submitting}
          className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-[13px] outline-none focus:border-line-strong"
        />

        {error && (
          <div className="mt-3 rounded-lg border border-accent-red/30 bg-accent-red/10 p-2.5 text-[12px] text-accent-red">
            {error}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-lg border border-line bg-transparent px-4 py-2.5 text-sm text-ink-2 transition-colors hover:text-ink disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 rounded-lg border border-accent-red/30 bg-accent-red/15 px-4 py-2.5 text-sm font-bold text-accent-red transition-colors hover:bg-accent-red/25 disabled:opacity-60"
          >
            {submitting ? 'Remboursement…' : `Rembourser ${fmt(order.total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
