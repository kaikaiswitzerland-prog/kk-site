// src/pages/OrderSuccessPage.jsx — Page /payment-success
//
// Vérifie le VRAI statut de l'order côté Supabase et adapte l'affichage.
// Pour les paiements carte (asynchrones via webhook SumUp), polling court
// tant que l'order est en pending_payment, jusqu'à 10 essais × 2s = 20s.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, Info, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 10;

const fmtCHF = (n) =>
  new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(n);

// Statuts considérés comme "commande validée et reçue" du point de vue client.
// 'pending' = cash/twint, paiement à effectuer plus tard mais commande prise.
// 'paid' et au-delà = paiement carte confirmé par webhook.
const SUCCESS_STATUSES = ['pending', 'paid', 'accepted', 'ready', 'delivered'];

export default function OrderSuccessPage({ onBackToMenu }) {
  const orderId = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('order_id');
    } catch {
      return null;
    }
  }, []);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pollAttempt, setPollAttempt] = useState(0);
  const [pollExhausted, setPollExhausted] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState(null);
  const pollTimerRef = useRef(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return null;
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, payment_method, total, customer_name, customer_email, items, delivery_mode')
      .eq('id', orderId)
      .single();
    if (error) {
      console.warn('[KaïKaï] OrderSuccessPage fetchOrder error', error);
      return null;
    }
    return data;
  }, [orderId]);

  // Initial fetch + démarrage du polling si pending_payment
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const initial = await fetchOrder();
      if (cancelled) return;
      setOrder(initial);
      setLoading(false);

      if (initial?.status !== 'pending_payment') return;

      // Polling : on relit l'order toutes les 2 s, max 10 essais.
      // Dès que le statut change, on arrête. Si on atteint le max sans
      // changement, on bascule en mode "paiement non confirmé".
      let attempts = 0;
      pollTimerRef.current = setInterval(async () => {
        attempts++;
        setPollAttempt(attempts);
        const next = await fetchOrder();
        if (cancelled) return;
        if (next && next.status !== 'pending_payment') {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
          setOrder(next);
          return;
        }
        if (attempts >= POLL_MAX_ATTEMPTS) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
          setOrder(next || initial);
          setPollExhausted(true);
        }
      }, POLL_INTERVAL_MS);
    })();

    return () => {
      cancelled = true;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [fetchOrder]);

  // Reprise du paiement : on refait un POST /api/create-checkout pour le
  // même order_id. Le serveur refuse si status !== 'pending_payment', donc
  // on ne peut pas créer un 2e checkout pour une commande déjà payée.
  const handleRetryPayment = async () => {
    if (!order || order.status !== 'pending_payment') return;
    setRetrying(true);
    setRetryError(null);
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          redirect_url: `${window.location.origin}/payment-success?order_id=${order.id}`,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.checkout_url) {
        throw new Error(body?.error || 'Impossible de relancer le paiement');
      }
      window.location.href = body.checkout_url;
    } catch (err) {
      setRetryError(err.message || 'Erreur');
      setRetrying(false);
    }
  };

  // ── Rendu ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Section>
        <SpinnerIcon />
        <Title>Vérification de votre commande…</Title>
      </Section>
    );
  }

  if (!orderId || !order) {
    return (
      <Section>
        <WarningIcon />
        <Title>Commande introuvable</Title>
        <Lead>Ce lien ne correspond à aucune commande.</Lead>
        <BackButton onClick={onBackToMenu} />
      </Section>
    );
  }

  const status = order.status;
  const orderShortId = String(order.id).slice(0, 8).toUpperCase();
  const modeLabel = order.delivery_mode === 'pickup' ? 'À emporter' : 'Livraison';

  // Cas succès — commande validée (paid pour carte, pending pour cash/twint)
  if (SUCCESS_STATUSES.includes(status)) {
    return (
      <Section>
        <SuccessIcon />
        <Title>Merci ! Votre commande a été reçue.</Title>
        <Lead>Préparation en cours.</Lead>
        <Recap
          orderShortId={orderShortId}
          total={order.total}
          modeLabel={modeLabel}
          email={order.customer_email}
        />
        <BackButton onClick={onBackToMenu} />
      </Section>
    );
  }

  // Polling en cours (paiement carte, webhook pas encore arrivé)
  if (status === 'pending_payment' && !pollExhausted) {
    return (
      <Section>
        <SpinnerIcon />
        <Title>Paiement en cours de validation…</Title>
        <Lead>
          Vérification auprès de SumUp ({pollAttempt}/{POLL_MAX_ATTEMPTS})
        </Lead>
      </Section>
    );
  }

  // Polling épuisé : webhook jamais arrivé en 20 s
  if (status === 'pending_payment' && pollExhausted) {
    return (
      <Section>
        <WarningIcon />
        <Title>Paiement non confirmé</Title>
        <Lead>
          Si vous n'avez pas été débité, votre commande n'est pas validée.
          Vous pouvez relancer le paiement ci-dessous.
        </Lead>
        <RetryError message={retryError} />
        <ActionRow>
          <RetryButton onClick={handleRetryPayment} loading={retrying} />
          <BackButton onClick={onBackToMenu} secondary />
        </ActionRow>
      </Section>
    );
  }

  if (status === 'failed') {
    return (
      <Section>
        <WarningIcon />
        <Title>Le paiement a été refusé</Title>
        <Lead>Vous pouvez réessayer avec une autre carte.</Lead>
        <RetryError message={retryError} />
        <ActionRow>
          <RetryButton onClick={handleRetryPayment} loading={retrying} />
          <BackButton onClick={onBackToMenu} secondary />
        </ActionRow>
      </Section>
    );
  }

  if (status === 'expired') {
    return (
      <Section>
        <WarningIcon />
        <Title>La session de paiement a expiré</Title>
        <Lead>Relancez le paiement pour finaliser votre commande.</Lead>
        <RetryError message={retryError} />
        <ActionRow>
          <RetryButton onClick={handleRetryPayment} loading={retrying} />
          <BackButton onClick={onBackToMenu} secondary />
        </ActionRow>
      </Section>
    );
  }

  if (status === 'refused') {
    return (
      <Section>
        <WarningIcon />
        <Title>Cette commande a été refusée</Title>
        <Lead>N'hésitez pas à passer une nouvelle commande.</Lead>
        <BackButton onClick={onBackToMenu} />
      </Section>
    );
  }

  if (status === 'refunded') {
    return (
      <Section>
        <InfoIcon />
        <Title>Cette commande a été remboursée</Title>
        <Lead>Le montant a été crédité sur votre moyen de paiement.</Lead>
        <BackButton onClick={onBackToMenu} />
      </Section>
    );
  }

  // Fallback — statut inattendu
  return (
    <Section>
      <WarningIcon />
      <Title>Statut inattendu</Title>
      <Lead>Statut courant : {status}. Contactez-nous si nécessaire.</Lead>
      <BackButton onClick={onBackToMenu} />
    </Section>
  );
}

// ─── Sous-composants présentation ────────────────────────────────────────

function Section({ children }) {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center">
      {children}
    </section>
  );
}

function Title({ children }) {
  return <h2 className="mt-4 text-2xl font-semibold">{children}</h2>;
}

function Lead({ children }) {
  return <p className="mt-2 text-white/70">{children}</p>;
}

function SuccessIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-black">
      <Check className="h-6 w-6" />
    </div>
  );
}

function WarningIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 border border-red-500/30 text-red-400">
      <AlertCircle className="h-6 w-6" />
    </div>
  );
}

function InfoIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white">
      <Info className="h-6 w-6" />
    </div>
  );
}

function SpinnerIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 border border-white/15 text-white">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

function Recap({ orderShortId, total, modeLabel, email }) {
  return (
    <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm">
      <Row label="Numéro" value={`#${orderShortId}`} />
      <Row label="Mode" value={modeLabel} />
      <Row label="Total" value={fmtCHF(total)} bold />
      {email && (
        <Row
          label="Confirmation"
          value={
            <span className="break-all">
              <span aria-hidden>📧 </span>
              {email}
            </span>
          }
        />
      )}
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/10 py-2 last:border-b-0">
      <span className="text-xs uppercase tracking-wider text-white/50">{label}</span>
      <span className={bold ? 'font-semibold text-white' : 'text-white/90'}>{value}</span>
    </div>
  );
}

function ActionRow({ children }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      {children}
    </div>
  );
}

function BackButton({ onClick, secondary }) {
  if (secondary) {
    return (
      <button
        onClick={onClick}
        className="rounded-2xl border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
      >
        Retour au menu
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="mt-6 rounded-2xl bg-white px-4 py-2 text-black hover:bg-white/90 transition-colors"
    >
      Retour au menu
    </button>
  );
}

function RetryButton({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition-colors disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      {loading ? 'Redirection…' : 'Reprendre le paiement'}
    </button>
  );
}

function RetryError({ message }) {
  if (!message) return null;
  return (
    <div className="mx-auto mt-4 max-w-sm rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
      {message}
    </div>
  );
}
