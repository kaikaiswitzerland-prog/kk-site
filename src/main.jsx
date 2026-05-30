import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminApp from './pages/AdminApp.jsx'
import LegalRouter, { isLegalRoute } from './pages/LegalPages.jsx'
import { IslandModeProvider } from './context/IslandModeContext.jsx'

// Détection de route : /admin → PWA admin, pages légales → LegalRouter,
// tout autre chemin → site principal.
const pathname = window.location.pathname;
const isAdminRoute = pathname.startsWith('/admin');
const isLegal = isLegalRoute(pathname);

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
    ) : (
      <IslandModeProvider>
        <App />
      </IslandModeProvider>
    )}
  </StrictMode>,
)
