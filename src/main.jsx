import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminApp from './pages/AdminApp.jsx'
import LegalRouter, { isLegalRoute } from './pages/LegalPages.jsx'
import { IslandModeProvider } from './context/IslandModeContext.jsx'

// Aperçu de la refonte (branche refonte-goiko). Chargé en lazy : son CSS et
// ses polices ne partent PAS dans le bundle du site live, seulement dans le
// chunk servi sur /refonte.
const RefontePreview = lazy(() => import('./refonte/RefontePreview.jsx'))

// Détection de route : /admin → PWA admin, pages légales → LegalRouter,
// /refonte → aperçu de la refonte, tout autre chemin → site principal.
const pathname = window.location.pathname;
const isAdminRoute = pathname.startsWith('/admin');
const isLegal = isLegalRoute(pathname);
const isRefonteRoute = pathname.startsWith('/refonte');

// Enregistrement du service worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('[KaïKaï] SW non enregistré :', err));
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdminRoute ? (
      <AdminApp />
    ) : isLegal ? (
      <LegalRouter />
    ) : isRefonteRoute ? (
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#060a07' }} />}>
        <RefontePreview />
      </Suspense>
    ) : (
      <IslandModeProvider>
        <App />
      </IslandModeProvider>
    )}
  </StrictMode>,
)
