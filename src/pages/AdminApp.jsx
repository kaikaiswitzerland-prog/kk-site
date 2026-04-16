// src/pages/AdminApp.jsx
// KaïKaï — PWA Admin : tableau de bord des commandes en temps réel
// Route : /admin  |  Protégé par auth Supabase

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

// ─── Palette ────────────────────────────────────────────────
const C = {
  bg: '#000',
  surface: '#0f1410',
  border: 'rgba(255,255,255,0.1)',
  green: '#1a2e1e',
  greenLight: '#2a5a2e',
  gold: '#C9A96E',
  white: '#ffffff',
  dim: 'rgba(255,255,255,0.55)',
  pending: { text: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  accepted: { text: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
  refused: { text: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
  delivered: { text: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)' },
};

const STATUS_LABELS = {
  pending: '⏳ En attente',
  accepted: '✅ Accepté',
  refused: '❌ Refusé',
  delivered: '🛵 Livré',
};

const PAYMENT_LABELS = { cash: '💵 Cash', twint: '📱 Twint' };

// ─── Helpers ────────────────────────────────────────────────
const fmt = (n) =>
  Number(n).toLocaleString('fr-CH', { style: 'currency', currency: 'CHF' });

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const fmtTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' });
};

const orderNumber = (id) => id.slice(0, 8).toUpperCase();

// ─── CSS global (print + scrollbar) ─────────────────────────
const printStyles = `
  @media print {
    body > * { display: none !important; }
    #print-ticket { display: block !important; }
    #print-ticket { position: fixed; top: 0; left: 0; width: 100%; background: #fff; color: #000; padding: 16px; font-family: monospace; font-size: 13px; }
  }
  @media screen {
    #print-ticket { display: none; }
  }
  .admin-scroll::-webkit-scrollbar { width: 4px; }
  .admin-scroll::-webkit-scrollbar-track { background: transparent; }
  .admin-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
  @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  .slide-up { animation: slideUp 0.25s ease both; }
  @keyframes pulse-dot { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  .pulse-dot { animation: pulse-dot 1.2s ease-in-out infinite; }
`;

// ════════════════════════════════════════════════════════════
// COMPOSANT RACINE
// ════════════════════════════════════════════════════════════
export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('orders');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);
  const [notification, setNotification] = useState(null);

  // ── Auth ─────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Chargement commandes + Realtime ──────────────────────
  useEffect(() => {
    if (!user) return;

    // Demander la permission de notifier
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Chargement initial : toutes les commandes
    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setOrders(data);
      });

    // Souscription Realtime
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const order = payload.new;
            setOrders((prev) => [order, ...prev]);
            // Notification dans le navigateur
            triggerNotification(order);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? payload.new : o))
            );
            setSelectedOrder((prev) =>
              prev?.id === payload.new.id ? payload.new : prev
            );
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const triggerNotification = (order) => {
    // Toast in-app
    setNotification(order);
    setTimeout(() => setNotification(null), 5000);
    // Notification navigateur
    if (Notification.permission === 'granted') {
      new Notification('🍜 Nouvelle commande KaïKaï !', {
        body: `${order.customer_name} — ${fmt(order.total)}`,
        icon: '/favicon.png',
        tag: 'kaikai-order',
      });
    }
  };

  const updateStatus = useCallback(async (id, status) => {
    await supabase.from('orders').update({ status }).eq('id', id);
  }, []);

  if (loading) return <LoadingScreen />;
  if (!user) return <LoginScreen />;

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <>
      <style>{printStyles}</style>

      {/* Ticket cuisine caché — visible uniquement à l'impression */}
      {printOrder && <PrintTicket order={printOrder} />}

      <div
        style={{ background: C.bg, color: C.white, minHeight: '100svh', fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: '600px', margin: '0 auto' }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <header
          style={{
            position: 'sticky', top: 0, zIndex: 50,
            background: C.green, borderBottom: `1px solid ${C.border}`,
            padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.05em', color: C.gold }}>KK</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Admin</div>
              <div style={{ fontSize: 11, color: C.dim }}>
                <span className="pulse-dot" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22c55e', marginRight: 4 }} />
                Temps réel
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {pendingCount > 0 && (
              <span style={{ background: '#f59e0b', color: '#000', fontWeight: 700, fontSize: 12, borderRadius: 99, padding: '2px 8px' }}>
                {pendingCount} en attente
              </span>
            )}
            <button
              onClick={() => supabase.auth.signOut()}
              style={{ fontSize: 12, color: C.dim, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
            >
              Déconnexion
            </button>
          </div>
        </header>

        {/* ── Toast notification nouvelle commande ─────────── */}
        {notification && (
          <div
            className="slide-up"
            style={{
              position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
              zIndex: 100, background: '#f59e0b', color: '#000',
              borderRadius: 12, padding: '10px 18px', fontWeight: 700, fontSize: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)', whiteSpace: 'nowrap',
            }}
          >
            🍜 Nouvelle commande — {notification.customer_name} · {fmt(notification.total)}
          </div>
        )}

        {/* ── Onglets ──────────────────────────────────────── */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
          {[
            { id: 'orders', label: 'Commandes' },
            { id: 'compta', label: 'Compta' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '12px 0', fontWeight: tab === t.id ? 700 : 400,
                color: tab === t.id ? C.gold : C.dim,
                borderBottom: tab === t.id ? `2px solid ${C.gold}` : '2px solid transparent',
                background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14,
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Contenu ──────────────────────────────────────── */}
        <div style={{ padding: '0 0 80px 0' }}>
          {tab === 'orders' && (
            <OrdersView
              orders={orders}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              onSelect={setSelectedOrder}
              onUpdateStatus={updateStatus}
              onPrint={setPrintOrder}
            />
          )}
          {tab === 'compta' && <ComptaView orders={orders} />}
        </div>

        {/* ── Modale détail commande ───────────────────────── */}
        {selectedOrder && (
          <OrderModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={updateStatus}
            onPrint={setPrintOrder}
          />
        )}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// ÉCRAN DE CHARGEMENT
// ════════════════════════════════════════════════════════════
function LoadingScreen() {
  return (
    <div style={{ background: C.bg, minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🍜</div>
        <div style={{ color: C.dim }}>Chargement…</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ÉCRAN DE CONNEXION
// ════════════════════════════════════════════════════════════
function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : err.message);
    setLoading(false);
  };

  return (
    <div style={{ background: C.bg, minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🍜</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.gold, letterSpacing: '0.05em' }}>KaïKaï Admin</div>
          <div style={{ color: C.dim, fontSize: 14, marginTop: 4 }}>Connexion au tableau de bord</div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          {error && (
            <div style={{ color: '#ef4444', fontSize: 13, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ background: C.gold, color: '#000', fontWeight: 700, border: 'none', borderRadius: 12, padding: '12px', fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
  padding: '12px 14px', color: C.white, fontSize: 15, outline: 'none', width: '100%',
};

// ════════════════════════════════════════════════════════════
// VUE COMMANDES
// ════════════════════════════════════════════════════════════
function OrdersView({ orders, filterStatus, setFilterStatus, onSelect, onUpdateStatus, onPrint }) {
  const FILTERS = [
    { id: 'all', label: 'Toutes' },
    { id: 'pending', label: '⏳ Attente' },
    { id: 'accepted', label: '✅ Acceptées' },
    { id: 'refused', label: '❌ Refusées' },
    { id: 'delivered', label: '🛵 Livrées' },
  ];

  const filtered = filterStatus === 'all' ? orders : orders.filter((o) => o.status === filterStatus);

  return (
    <div>
      {/* Filtres */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 16px', overflowX: 'auto' }} className="admin-scroll">
        {FILTERS.map((f) => {
          const count = f.id === 'all' ? orders.length : orders.filter((o) => o.status === f.id).length;
          return (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              style={{
                whiteSpace: 'nowrap', borderRadius: 99, padding: '5px 12px', fontSize: 13,
                fontWeight: filterStatus === f.id ? 700 : 400,
                background: filterStatus === f.id ? C.gold : 'transparent',
                color: filterStatus === f.id ? '#000' : C.dim,
                border: `1px solid ${filterStatus === f.id ? C.gold : C.border}`,
                cursor: 'pointer',
              }}
            >
              {f.label} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: C.dim, padding: '48px 16px', fontSize: 14 }}>
            Aucune commande
          </div>
        )}
        {filtered.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onSelect={onSelect}
            onUpdateStatus={onUpdateStatus}
            onPrint={onPrint}
          />
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CARTE COMMANDE
// ════════════════════════════════════════════════════════════
function OrderCard({ order, onSelect, onUpdateStatus, onPrint }) {
  const sc = C[order.status] ?? C.pending;
  const items = Array.isArray(order.items) ? order.items : [];
  const isPending = order.status === 'pending';

  return (
    <div
      className="slide-up"
      style={{
        margin: '0 16px 8px', borderRadius: 16, border: `1px solid ${isPending ? C.pending.border : C.border}`,
        background: isPending ? 'rgba(245,158,11,0.04)' : C.surface, padding: 14, cursor: 'pointer',
      }}
      onClick={() => onSelect(order)}
    >
      {/* Ligne 1 : heure + n° + statut */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: C.gold }}>#{orderNumber(order.id)}</span>
          <span style={{ fontSize: 12, color: C.dim }}>{fmtTime(order.created_at)} · {fmtDate(order.created_at)}</span>
        </div>
        <span
          style={{
            fontSize: 12, fontWeight: 600, borderRadius: 99, padding: '3px 10px',
            color: sc.text, background: sc.bg, border: `1px solid ${sc.border}`,
          }}
        >
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Ligne 2 : client + paiement + total */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{order.customer_name}</div>
          <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>
            {order.delivery_mode === 'pickup' ? '🏠 À emporter' : `🛵 ${order.customer_address}`}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.gold }}>{fmt(order.total)}</div>
          <div style={{ fontSize: 11, color: C.dim }}>{PAYMENT_LABELS[order.payment_method] ?? order.payment_method}</div>
        </div>
      </div>

      {/* Articles résumé */}
      <div style={{ marginTop: 8, fontSize: 12, color: C.dim }}>
        {items.slice(0, 3).map((it, i) => (
          <span key={i}>{it.qty}× {it.name}{i < Math.min(items.length, 3) - 1 ? ' · ' : ''}</span>
        ))}
        {items.length > 3 && <span> · +{items.length - 3} autre(s)</span>}
      </div>

      {/* Actions rapides si en attente */}
      {isPending && (
        <div
          style={{ display: 'flex', gap: 8, marginTop: 12 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onUpdateStatus(order.id, 'accepted')}
            style={{ flex: 1, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e', borderRadius: 10, padding: '8px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            ✅ Accepter
          </button>
          <button
            onClick={() => onUpdateStatus(order.id, 'refused')}
            style={{ flex: 1, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 10, padding: '8px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            ❌ Refuser
          </button>
          <button
            onClick={() => onPrint(order)}
            style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${C.border}`, color: C.white, borderRadius: 10, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
          >
            🖨
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MODALE DÉTAIL COMMANDE
// ════════════════════════════════════════════════════════════
function OrderModal({ order, onClose, onUpdateStatus, onPrint }) {
  const sc = C[order.status] ?? C.pending;
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}
    >
      <div
        className="slide-up admin-scroll"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 600, margin: '0 auto', background: C.surface, borderRadius: '20px 20px 0 0', borderTop: `1px solid ${C.border}`, maxHeight: '92svh', overflowY: 'auto', padding: 20 }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 4, background: C.border, margin: '0 auto 16px' }} />

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Commande #{orderNumber(order.id)}</div>
            <div style={{ color: C.dim, fontSize: 13, marginTop: 2 }}>{fmtDate(order.created_at)} à {fmtTime(order.created_at)}</div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, borderRadius: 99, padding: '4px 12px', color: sc.text, background: sc.bg, border: `1px solid ${sc.border}` }}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        {/* Infos client */}
        <Section title="Client">
          <Row label="Nom" value={order.customer_name} />
          <Row label="Téléphone">
            <a href={`tel:${order.customer_phone}`} style={{ color: C.gold }}>{order.customer_phone}</a>
          </Row>
          <Row label="Livraison" value={order.delivery_mode === 'pickup' ? 'À emporter' : order.customer_address} />
          <Row label="Paiement" value={PAYMENT_LABELS[order.payment_method] ?? order.payment_method} />
          {order.notes && <Row label="Notes" value={order.notes} />}
        </Section>

        {/* Articles */}
        <Section title="Articles">
          {items.map((it, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 10, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 600 }}>{it.qty}× {it.name}</div>
                <div style={{ color: C.gold, fontWeight: 600 }}>{fmt(it.subtotal ?? it.price * it.qty)}</div>
              </div>
              {Array.isArray(it.variants) && it.variants.length > 0 && (
                <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
                  {renderVariants(it.variants)}
                </div>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
            <span style={{ fontWeight: 700 }}>Total</span>
            <span style={{ fontWeight: 700, fontSize: 18, color: C.gold }}>{fmt(order.total)}</span>
          </div>
        </Section>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {order.status === 'pending' && (
            <>
              <button
                onClick={() => { onUpdateStatus(order.id, 'accepted'); onClose(); }}
                style={actionBtn('#22c55e', 'rgba(34,197,94,0.15)', 'rgba(34,197,94,0.4)')}
              >
                ✅ Accepter
              </button>
              <button
                onClick={() => { onUpdateStatus(order.id, 'refused'); onClose(); }}
                style={actionBtn('#ef4444', 'rgba(239,68,68,0.12)', 'rgba(239,68,68,0.3)')}
              >
                ❌ Refuser
              </button>
            </>
          )}
          {order.status === 'accepted' && (
            <button
              onClick={() => { onUpdateStatus(order.id, 'delivered'); onClose(); }}
              style={actionBtn('#6366f1', 'rgba(99,102,241,0.12)', 'rgba(99,102,241,0.3)')}
            >
              🛵 Marquer livré
            </button>
          )}
          <button
            onClick={() => onPrint(order)}
            style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: `1px solid ${C.border}`, color: C.white, borderRadius: 12, padding: '12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            🖨 Ticket cuisine
          </button>
        </div>

        <button
          onClick={onClose}
          style={{ width: '100%', marginTop: 10, background: 'transparent', border: `1px solid ${C.border}`, color: C.dim, borderRadius: 12, padding: '10px', cursor: 'pointer', fontSize: 14 }}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.dim, marginBottom: 10 }}>{title}</div>
      <div style={{ background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, padding: '4px 0', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 14px', borderBottom: `1px solid ${C.border}`, gap: 12 }}>
      <span style={{ color: C.dim, fontSize: 13, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, textAlign: 'right', wordBreak: 'break-word' }}>{children ?? value}</span>
    </div>
  );
}

const actionBtn = (color, bg, border) => ({
  flex: 1, background: bg, border: `1px solid ${border}`, color,
  borderRadius: 12, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
});

function renderVariants(variants) {
  if (!variants || variants.length === 0) return null;
  return variants.map((v, i) => {
    if (typeof v === 'string') return <div key={i}>• {v}</div>;
    if (v?.name) return <div key={i}>• {v.name}</div>;
    if (v?.type) {
      // Formule
      const lines = [];
      if (v.plat) lines.push(`• Plat : ${v.plat}${v.proteins?.[v.plat] ? ` (${v.proteins[v.plat]})` : ''}`);
      if (v.boisson) lines.push(`• Boisson : ${v.jus || v.eau || v.boisson}`);
      if (v.dessert) lines.push(`• Dessert : ${v.dessert}${v.coulisDessert ? ` (${v.coulisDessert})` : ''}`);
      return <div key={i}>{lines.map((l, li) => <div key={li}>{l}</div>)}</div>;
    }
    return null;
  });
}

// ════════════════════════════════════════════════════════════
// TICKET CUISINE (zone imprimable)
// ════════════════════════════════════════════════════════════
function PrintTicket({ order }) {
  const items = Array.isArray(order.items) ? order.items : [];

  useEffect(() => {
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, [order]);

  return (
    <div id="print-ticket">
      <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>KaïKaï</div>
        <div style={{ fontSize: 11 }}>Bd de la Tour 1, 1205 Genève</div>
      </div>

      <div style={{ borderBottom: '1px dashed #000', paddingBottom: 8, marginBottom: 8, fontSize: 13 }}>
        <div><strong>Commande #{orderNumber(order.id)}</strong></div>
        <div>{fmtDate(order.created_at)} à {fmtTime(order.created_at)}</div>
        <div>{order.delivery_mode === 'pickup' ? '🏠 À EMPORTER' : `🛵 LIVRAISON : ${order.customer_address}`}</div>
      </div>

      <div style={{ borderBottom: '1px dashed #000', paddingBottom: 8, marginBottom: 8, fontSize: 13 }}>
        <div><strong>Client :</strong> {order.customer_name}</div>
        <div><strong>Tél :</strong> {order.customer_phone}</div>
        <div><strong>Paiement :</strong> {order.payment_method?.toUpperCase()}</div>
        {order.notes && <div><strong>Notes :</strong> {order.notes}</div>}
      </div>

      <div style={{ borderBottom: '1px dashed #000', paddingBottom: 8, marginBottom: 8 }}>
        <strong style={{ fontSize: 13 }}>ARTICLES :</strong>
        {items.map((it, i) => (
          <div key={i} style={{ marginTop: 6, fontSize: 13 }}>
            <div>{it.qty}× {it.name} ............. {fmt(it.subtotal ?? it.price * it.qty)}</div>
            {Array.isArray(it.variants) && it.variants.length > 0 && (
              <div style={{ paddingLeft: 16, fontSize: 12 }}>
                {renderVariants(it.variants)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'right', fontSize: 16, fontWeight: 900 }}>
        TOTAL : {fmt(order.total)}
      </div>
      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, borderTop: '2px dashed #000', paddingTop: 8 }}>
        Merci de votre commande !
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// VUE COMPTABILITÉ
// ════════════════════════════════════════════════════════════
function ComptaView({ orders }) {
  // Uniquement les commandes acceptées ou livrées
  const valid = orders.filter((o) => o.status === 'accepted' || o.status === 'delivered');

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const inRange = (order, from) => new Date(order.created_at) >= from;

  const calc = (subset) => {
    const revenue = subset.reduce((s, o) => s + Number(o.total), 0);
    const count = subset.length;
    const avg = count > 0 ? revenue / count : 0;
    return { revenue, count, avg };
  };

  const day = calc(valid.filter((o) => inRange(o, startOfDay)));
  const week = calc(valid.filter((o) => inRange(o, startOfWeek)));
  const month = calc(valid.filter((o) => inRange(o, startOfMonth)));
  const total = calc(valid);

  const exportCSV = () => {
    const headers = ['Date', 'Heure', 'N° Commande', 'Client', 'Téléphone', 'Adresse', 'Mode', 'Articles', 'Total CHF', 'Paiement', 'Statut'];
    const rows = orders.map((o) => {
      const itemsStr = Array.isArray(o.items)
        ? o.items.map((it) => `${it.qty}x ${it.name}`).join(' | ')
        : '';
      return [
        fmtDate(o.created_at),
        fmtTime(o.created_at),
        orderNumber(o.id),
        o.customer_name,
        o.customer_phone,
        o.customer_address,
        o.delivery_mode === 'pickup' ? 'À emporter' : 'Livraison',
        itemsStr,
        Number(o.total).toFixed(2),
        o.payment_method,
        o.status,
      ];
    });
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaikai-commandes-${now.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <StatCard title="Aujourd'hui" revenue={day.revenue} count={day.count} avg={day.avg} />
        <StatCard title="Cette semaine" revenue={week.revenue} count={week.count} avg={week.avg} />
        <StatCard title="Ce mois" revenue={month.revenue} count={month.count} avg={month.avg} />
        <StatCard title="Total" revenue={total.revenue} count={total.count} avg={total.avg} accent />
      </div>

      {/* Répartition paiements */}
      <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Répartition paiements</div>
        {['cash', 'twint'].map((method) => {
          const count = valid.filter((o) => o.payment_method === method).length;
          const pct = valid.length > 0 ? Math.round((count / valid.length) * 100) : 0;
          return (
            <div key={method} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{PAYMENT_LABELS[method]}</span>
                <span style={{ color: C.dim }}>{count} cmd · {pct}%</span>
              </div>
              <div style={{ height: 6, background: C.border, borderRadius: 4 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: C.gold, borderRadius: 4, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Export CSV */}
      <button
        onClick={exportCSV}
        style={{ width: '100%', background: C.green, border: `1px solid ${C.greenLight}`, color: C.white, borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        ⬇ Exporter CSV
      </button>

      {/* Dernières commandes mini-liste */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: C.dim }}>Historique récent</div>
        {orders.slice(0, 20).map((o) => {
          const sc = C[o.status] ?? C.pending;
          return (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <div>
                <span style={{ color: C.dim, marginRight: 6 }}>{fmtDate(o.created_at)}</span>
                <span>{o.customer_name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: C.gold, fontWeight: 600 }}>{fmt(o.total)}</span>
                <span style={{ fontSize: 11, color: sc.text, background: sc.bg, borderRadius: 99, padding: '2px 7px' }}>
                  {STATUS_LABELS[o.status]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ title, revenue, count, avg, accent }) {
  return (
    <div style={{ background: accent ? C.green : C.surface, border: `1px solid ${accent ? C.greenLight : C.border}`, borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 12, color: C.dim, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.gold }}>{fmt(revenue)}</div>
      <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>{count} cmd · moy. {fmt(avg)}</div>
    </div>
  );
}
