import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminApp from './pages/AdminApp.jsx'
import LegalRouter, { isLegalRoute } from './pages/LegalPages.jsx'
import { IslandModeProvider } from './context/IslandModeContext.jsx'

// Détection de route :
//   /admin…      → PWA admin
//   pages légales → LegalRouter
//   /classique…  → ANCIEN site (peau historique), conservé accessible
//   /v2          → TEST de la nouvelle page d'accueil (peau v2, branche
//                  test/accueil-v2) — même panier, même paiement
//   tout le reste → NOUVEAU site (peau refonte), y compris / et /refonte
//
// C'est ici que se joue la bascule : la peau refonte est désormais la peau
// PAR DÉFAUT. L'ancien site n'a pas disparu, il a changé d'adresse — utile
// pour comparer les deux en ligne, et pour ne rien perdre si un détail de la
// refonte devait être revu.
//
// /refonte reste volontairement valide : c'est l'URL utilisée pendant toute
// la mise au point, elle tombe dans le cas par défaut et sert donc le nouveau
// site, comme /.
const pathname = window.location.pathname;
const isAdminRoute = pathname.startsWith('/admin');
const isLegal = isLegalRoute(pathname);
const isClassicRoute = pathname.startsWith('/classique');
const isV2Route = pathname === '/v2' || pathname.startsWith('/v2/');

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
    ) : isClassicRoute ? (
      <IslandModeProvider>
        <App />
      </IslandModeProvider>
    ) : isV2Route ? (
      <IslandModeProvider>
        <App skin="v2" />
      </IslandModeProvider>
    ) : (
      <IslandModeProvider>
        <App skin="refonte" />
      </IslandModeProvider>
    )}
  </StrictMode>,
)
