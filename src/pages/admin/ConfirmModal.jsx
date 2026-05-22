// src/pages/admin/ConfirmModal.jsx — Modale de confirmation générique
//
// Réutilisée pour la mise à la corbeille et la suppression définitive.
// `onConfirm` peut être async : la modale gère l'état "en cours" + erreur,
// et se ferme automatiquement en cas de succès.

import { useState } from 'react';

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'default', // 'default' | 'danger'
  onConfirm,
  onClose,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err?.message || 'Une erreur est survenue');
      setSubmitting(false);
    }
  };

  const confirmClass =
    tone === 'danger'
      ? 'border border-accent-red/30 bg-accent-red/15 text-accent-red hover:bg-accent-red/25'
      : 'bg-accent text-black hover:bg-accent-soft';

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

        <h2 className="mb-3 font-display text-2xl italic tracking-[-0.02em]">
          {title}
        </h2>

        <p className="mb-5 text-[14px] leading-relaxed text-ink-2">
          {message}
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-accent-red/30 bg-accent-red/10 p-2.5 text-[12px] text-accent-red">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-lg border border-line bg-transparent px-4 py-2.5 text-sm text-ink-2 transition-colors hover:text-ink disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={[
              'flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60',
              confirmClass,
            ].join(' ')}
          >
            {submitting ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
