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
//
// printText() : transforme tout texte affichable en CASSE HAUTE + sans accents
// pour les imprimantes thermiques qui ne supportent pas correctement les
// caractères Unicode étendus. Appliqué aux noms d'items, aux sous-lignes
// variants, et aux labels du ticket.
//   "Velouté koko" → "VELOUTE KOKO"
//   "Po'e Banane"  → "PO'E BANANE"
//   "Tartare Hawaï" → "TARTARE HAWAI"
const COMBINING_MARKS = /[̀-ͯ]/g;
const printText = (s) =>
  String(s ?? '').toUpperCase().normalize('NFD').replace(COMBINING_MARKS, '');

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
        <div className="kk-print-mode">
          {order.delivery_mode === 'pickup'
            ? '>>> A EMPORTER <<<'
            : `>>> LIVRAISON <<<`}
        </div>
        {order.delivery_mode !== 'pickup' && order.customer_address && (
          <div style={{ marginTop: 2, fontWeight: 700 }}>
            {printText(order.customer_address)}
          </div>
        )}
      </div>

      <hr className="kk-print-sep" />

      <div>
        <div><strong>CLIENT :</strong> {printText(order.customer_name)}</div>
        <div><strong>TEL :</strong> {order.customer_phone}</div>
        <div>
          <strong>PAIEMENT :</strong> {printText(PAYMENT_LABELS[order.payment_method] || order.payment_method)}
          {order.status === 'paid' && ' (ENCAISSEE)'}
        </div>
        {order.notes && <div><strong>NOTES :</strong> {printText(order.notes)}</div>}
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
                  {it.qty}x {printText(it.name)}
                </span>
                <span>{fmtAmount(it.subtotal ?? it.price * it.qty)}</span>
              </div>
              {variants.length > 0 && (
                <div className="kk-print-variants">
                  {variants.map((line, j) => (
                    <div key={j}>&gt; {printText(line)}</div>
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
