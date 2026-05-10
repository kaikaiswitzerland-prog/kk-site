// src/pages/AdminApp.jsx
// KaïKaï — PWA Admin : tableau de bord des commandes en temps réel
// Route : /admin · Protégé par auth Supabase
//
// Orchestrateur uniquement : auth, navigation entre pages, modale, impression.
// Le rendu des sections vit dans src/pages/admin/*.

import { useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import './admin/admin.css';

import { useAdminAuth } from '../hooks/useAdminAuth.js';
import { useOrders } from '../hooks/useOrders.js';
import { TAB_FILTERS, isAdminVisible } from '../lib/admin/orderHelpers.js';
import { supabase } from '../lib/supabase.js';

import LoadingScreen from './admin/LoadingScreen.jsx';
import LoginScreen from './admin/LoginScreen.jsx';
import Sidebar from './admin/Sidebar.jsx';
import TopBar from './admin/TopBar.jsx';
import OrdersView from './admin/OrdersView.jsx';
import OrderModal from './admin/OrderModal.jsx';
import PrintTicket from './admin/PrintTicket.jsx';
import RefundModal from './admin/RefundModal.jsx';
import ComptaView from './admin/ComptaView.jsx';
import SettingsView from './admin/SettingsView.jsx';
import Toast from './admin/Toast.jsx';

const PAGE_TITLES = {
  orders: 'Commandes',
  compta: 'Compta',
  settings: 'Paramètres',
};

export default function AdminApp() {
  const { user, loading, signOut } = useAdminAuth();
  const {
    orders,
    recentlyAddedIds,
    toast,
    updateStatus,
    soundEnabled,
    setSoundEnabled,
  } = useOrders({ enabled: !!user });

  const [page, setPage] = useState('orders');
  const [activeTab, setActiveTab] = useState('todo');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);
  const [refundOrder, setRefundOrder] = useState(null);
  const printTimerRef = useRef(null);

  // Compte les commandes "à traiter" (pending + paid, hors pending_payment)
  const pendingCount = useMemo(() => {
    const todoStatuses = TAB_FILTERS.find((t) => t.id === 'todo').statuses;
    return orders.filter((o) => isAdminVisible(o) && todoStatuses.includes(o.status)).length;
  }, [orders]);

  // Synchronise selectedOrder avec les updates Realtime
  const liveSelectedOrder = useMemo(() => {
    if (!selectedOrder) return null;
    return orders.find((o) => o.id === selectedOrder.id) || selectedOrder;
  }, [selectedOrder, orders]);

  if (loading) return <LoadingScreen />;
  if (!user) return <LoginScreen />;

  // Safari iOS bloque window.print() hors user gesture. Pour rester dans le
  // gesture du clic, on commit synchronement le ticket via flushSync, puis
  // on appelle window.print() dans le même call stack que le onClick. Le
  // composant PrintTicket est pré-monté en permanence dans l'arbre (avec
  // order=null par défaut) ; flushSync ne fait qu'un update de prop.
  const handlePrint = (order) => {
    // Si une impression précédente est encore en flight (timer pas
    // encore expiré), on annule son cleanup pour éviter de vider le
    // portal pendant la capture de la nouvelle impression.
    if (printTimerRef.current) {
      clearTimeout(printTimerRef.current);
      printTimerRef.current = null;
    }
    flushSync(() => setPrintOrder(order));
    window.print();
    // iOS Safari : window.print() retourne immédiatement, AirPrint
    // capture le DOM en arrière-plan. On laisse 2s avant de vider
    // le portal pour garantir que la capture est terminée.
    printTimerRef.current = setTimeout(() => {
      setPrintOrder(null);
      printTimerRef.current = null;
    }, 2000);
  };
  // Refund : appelle /api/sumup-refund avec le JWT admin courant. Throw si
  // échec pour que la modale affiche le message d'erreur.
  const handleRefund = async (order, reason) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Session expirée — reconnectez-vous');
    }
    const res = await fetch('/api/sumup-refund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ order_id: order.id, reason }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || `Échec (HTTP ${res.status})`);
    }
    return body;
  };

  const toggleSound = () => setSoundEnabled(!soundEnabled);

  return (
    <div className="kk-admin grid min-h-screen md:grid-cols-[240px_1fr]">
      <Sidebar
        page={page}
        setPage={setPage}
        pendingCount={pendingCount}
        user={user}
        onSignOut={signOut}
      />

      <main className="px-5 pb-32 pt-6 md:px-10 md:pb-20 md:pt-8">
        <TopBar
          title={PAGE_TITLES[page]}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />

        {page === 'orders' && (
          <OrdersView
            orders={orders}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            recentlyAddedIds={recentlyAddedIds}
            onSelect={setSelectedOrder}
            onUpdateStatus={updateStatus}
            onPrint={handlePrint}
            onRequestRefund={setRefundOrder}
          />
        )}

        {page === 'compta' && (
          <ComptaView
            orders={orders}
            onSelectOrder={setSelectedOrder}
          />
        )}

        {page === 'settings' && (
          <SettingsView
            user={user}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onSignOut={signOut}
          />
        )}
      </main>

      {toast && <Toast order={toast} />}

      {liveSelectedOrder && (
        <OrderModal
          order={liveSelectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateStatus}
          onPrint={handlePrint}
          onRequestRefund={setRefundOrder}
        />
      )}

      {refundOrder && (
        <RefundModal
          order={refundOrder}
          onClose={() => setRefundOrder(null)}
          onConfirm={handleRefund}
        />
      )}

      {/* PrintTicket est rendu en permanence (portal masqué hors @media print)
          pour que window.print() puisse être appelé synchronement dans le
          user gesture du clic Ticket — voir handlePrint. */}
      <PrintTicket order={printOrder} />
    </div>
  );
}
