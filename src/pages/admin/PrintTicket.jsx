import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  fmt,
  fmtAmount,
  fmtDate,
  fmtTime,
  orderNumber,
  PAYMENT_LABELS,
  renderVariantLines,
} from '../../lib/admin/orderHelpers.js';

// Ticket cuisine — déclenchement manuel via window.print().
// Layout optimisé pour imprimante thermique BT 58mm/80mm
// (largeur cible 72mm, monospace, séparateurs pointillés).
// Rendu via portal dans #kk-print-root pour isolation totale (cf admin.css @media print).

export default function PrintTicket({ order, onComplete }) {
  // Crée / récupère le conteneur portal
  let mount = typeof document !== 'undefined' ? document.getElementById('kk-print-root') : null;
  if (typeof document !== 'undefined' && !mount) {
    mount = document.createElement('div');
    mount.id = 'kk-print-root';
    document.body.appendChild(mount);
  }

  useEffect(() => {
    if (!order) return;
    // Petit délai pour laisser React rendre avant d'appeler print()
    const t = setTimeout(() => {
      window.print();
      // Nettoyage immédiat après le dialog de print (afterprint pas fiable partout)
      setTimeout(() => onComplete?.(), 200);
    }, 150);
    return () => clearTimeout(t);
  }, [order, onComplete]);

  if (!order || !mount) return null;

  const items = Array.isArray(order.items) ? order.items : [];

  return createPortal(
    <>
      <div className="kk-print-h1">KaïKaï</div>
      <div style={{ textAlign: 'center', fontSize: 10 }}>
        Bd de la Tour 1 · 1205 Genève
      </div>
      <hr className="kk-print-sep-strong" />

      <div>
        <div className="kk-print-row">
          <strong>#{orderNumber(order.id)}</strong>
          <span>{fmtTime(order.created_at)}</span>
        </div>
        <div style={{ fontSize: 11 }}>{fmtDate(order.created_at)}</div>
        <div style={{ marginTop: 2, fontWeight: 700 }}>
          {order.delivery_mode === 'pickup'
            ? '📦 À EMPORTER'
            : `🛵 LIVRAISON — ${order.customer_address}`}
        </div>
      </div>

      <hr className="kk-print-sep" />

      <div>
        <div><strong>Client :</strong> {order.customer_name}</div>
        <div><strong>Tél :</strong> {order.customer_phone}</div>
        <div>
          <strong>Paiement :</strong> {PAYMENT_LABELS[order.payment_method] || order.payment_method}
          {order.status === 'paid' && ' (encaissée)'}
        </div>
        {order.notes && <div><strong>Notes :</strong> {order.notes}</div>}
      </div>

      <hr className="kk-print-sep" />

      <div>
        <strong>ARTICLES</strong>
        {items.map((it, i) => {
          const variants = renderVariantLines(it.variants);
          return (
            <div key={i} style={{ marginTop: 4 }}>
              <div className="kk-print-row">
                <span>
                  {it.qty}× {it.name}
                </span>
                <span>{fmtAmount(it.subtotal ?? it.price * it.qty)}</span>
              </div>
              {variants.length > 0 && (
                <div className="kk-print-variants">
                  {variants.map((line, j) => (
                    <div key={j}>· {line}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <hr className="kk-print-sep-strong" />
      <div className="kk-print-total">TOTAL : {fmt(order.total)}</div>
      <hr className="kk-print-sep-strong" />

      <div className="kk-print-foot">Merci de votre commande !</div>
    </>,
    mount,
  );
}
