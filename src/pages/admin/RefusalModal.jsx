// src/pages/admin/RefusalModal.jsx — Refus structuré d'une commande
//
// Affichée au clic sur "Refuser" (commandes pending/paid). Force l'admin à
// sélectionner un motif structuré (rupture stock, hors zone, erreur produit,
// fermé, autre). Commentaire libre obligatoire si motif = 'other'.
//
// Au confirmer :
//   1. UPDATE orders SET status='refused', refusal_reason, refusal_comment via Supabase
//   2. Si payé carte (paid/accepted/ready/out_for_delivery/delivered) →
//      déclenche un refund SumUp via onRefund(order)
//   3. Notifie le client par email via /api/admin/send-refusal-email
//      (chantier 7 — ajouté ultérieurement)
//   4. onClose

import { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { fmt, orderNumber, REFUSAL_REASONS } from '../../lib/admin/orderHelpers.js';

export default function RefusalModal({ order, onClose, onConfirm }) {
  const [reasonCode, setReasonCode] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isOther = reasonCode === 'other';
  const canSubmit = !!reasonCode && !submitting && (!isOther || comment.trim().length > 0);

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(order, {
        reason: reasonCode,
        comment: comment.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err?.message || 'Échec du refus');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center"
      onClick={submitting ? undefined : onClose}
    >
      <div
        className="kk-slide-up kk-scroll w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-line bg-bg-elev p-6 md:rounded-2xl md:border"
        style={{ maxHeight: '92svh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded bg-line md:hidden" />

        <h2 className="mb-1 font-display text-2xl italic tracking-[-0.02em]">
          Refuser la commande
        </h2>
        <div className="mb-5 font-mono text-[11px] tracking-[0.1em] text-ink-3">
          #{orderNumber(order.id)} · {order.customer_name} · {fmt(order.total)}
        </div>

        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          Motif du refus
        </label>
        <div className="mb-4 flex flex-col gap-1.5">
          {REFUSAL_REASONS.map((r) => {
            const selected = r.code === reasonCode;
            return (
              <button
                key={r.code}
                type="button"
                onClick={() => setReasonCode(r.code)}
                disabled={submitting}
                className={[
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-[13px] transition-colors',
                  selected
                    ? 'border-accent-red/40 bg-accent-red/10 text-ink'
                    : 'border-line bg-bg text-ink-2 hover:border-line-strong hover:text-ink',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 transition-colors',
                    selected ? 'border-accent-red bg-accent-red/30' : 'border-ink-3',
                  ].join(' ')}
                >
                  {selected && <span className="h-1.5 w-1.5 rounded-full bg-accent-red" />}
                </span>
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          Commentaire {isOther ? <span className="text-accent-red">(obligatoire)</span> : '(optionnel)'}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder={
            isOther
              ? 'Précisez le motif transmis au client'
              : 'Détails internes ou message complémentaire'
          }
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
            disabled={!canSubmit}
            className="flex-1 rounded-lg border border-accent-red/30 bg-accent-red/15 px-4 py-2.5 text-sm font-bold text-accent-red transition-colors hover:bg-accent-red/25 disabled:opacity-50"
          >
            {submitting ? 'Refus en cours…' : 'Confirmer le refus'}
          </button>
        </div>
      </div>
    </div>
  );
}
