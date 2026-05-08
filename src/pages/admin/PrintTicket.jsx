import { Component, useEffect, useRef } from 'react';
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
// caractères Unicode étendus.
const COMBINING_MARKS = /[̀-ͯ]/g;
const printText = (s) => {
  try {
    return String(s ?? '').toUpperCase().normalize('NFD').replace(COMBINING_MARKS, '');
  } catch {
    return '';
  }
};

// Error Boundary inline : si le rendu détaillé du ticket plante, on imprime
// quand même un fallback minimal (ID, client, total) pour que le ticket
// cuisine ne sorte JAMAIS totalement blanc.
class PrintErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('PrintTicket render error:', error, info);
  }
  render() {
    if (this.state.error) {
      const o = this.props.order || {};
      return (
        <>
          <div className="kk-print-h1">KaïKaï</div>
          <hr className="kk-print-sep-strong" />
          <div><strong>#{orderNumber(o.id)}</strong></div>
          <div>CLIENT : {printText(o.customer_name)}</div>
          <div>TEL : {o.customer_phone || ''}</div>
          <div className="kk-print-total" style={{ marginTop: 8 }}>
            TOTAL : {fmt(o.total ?? 0)}
          </div>
          <hr className="kk-print-sep-strong" />
          <div className="kk-print-foot">
            [Erreur d'affichage des détails — vérifier l'écran]
          </div>
        </>
      );
    }
    return this.props.children;
  }
}

function PrintTicketBody({ order }) {
  const items = Array.isArray(order.items) ? order.items : [];

  return (
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
        <div><strong>TEL :</strong> {order.customer_phone || ''}</div>
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
          const safeIt = it || {};
          const variants = renderVariantLines(safeIt.variants);
          const qty = safeIt.qty ?? 1;
          const subtotal = safeIt.subtotal ?? (Number(safeIt.price) || 0) * qty;
          return (
            <div key={i} style={{ marginTop: 4 }}>
              <div className="kk-print-row">
                <span>
                  {qty}x {printText(safeIt.name)}
                </span>
                <span>{fmtAmount(subtotal)}</span>
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
      <div className="kk-print-total">TOTAL : {fmt(order.total ?? 0)}</div>
      <hr className="kk-print-sep-strong" />

      <div className="kk-print-foot">Merci de votre commande !</div>
    </>
  );
}

export default function PrintTicket({ order, onComplete }) {
  // onComplete est souvent une arrow function inline côté parent (nouvelle ref
  // à chaque render). Si on la met dans les deps du useEffect, chaque re-render
  // d'AdminApp (useNow tick, push Realtime…) annule et reschedule le timeout
  // 150 ms — risque de race où window.print() s'exécute pendant un commit
  // React, capturant un portal vide → ticket imprimé blanc.
  // Solution : ref stable, useEffect uniquement dépendant de `order`.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  // Crée / récupère le conteneur portal
  let mount = typeof document !== 'undefined' ? document.getElementById('kk-print-root') : null;
  if (typeof document !== 'undefined' && !mount) {
    mount = document.createElement('div');
    mount.id = 'kk-print-root';
    document.body.appendChild(mount);
  }

  useEffect(() => {
    if (!order) return;
    const t = setTimeout(() => {
      window.print();
      setTimeout(() => onCompleteRef.current?.(), 200);
    }, 150);
    return () => clearTimeout(t);
  }, [order]);

  if (!order || !mount) return null;

  return createPortal(
    <PrintErrorBoundary order={order}>
      <PrintTicketBody order={order} />
    </PrintErrorBoundary>,
    mount,
  );
}
