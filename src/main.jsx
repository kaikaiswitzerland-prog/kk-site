import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminApp from './pages/AdminApp.jsx'
import LegalRouter, { isLegalRoute } from './pages/LegalPages.jsx'
import { IslandModeProvider } from './context/IslandModeContext.jsx'

// Détection de route — les trois versions du site sont conservées :
//   /admin…       → PWA admin
//   pages légales → LegalRouter
//   /classique…   → v1, peau historique   (peau par défaut d'App, « legacy »)
//   /refonte…     → v2, peau refonte      (skin="refonte", src/refonte/)
//   /v2…          → redirigée vers / : c'était l'adresse de test de la v3.
//                   La redirection serveur vit dans vercel.json ; celle-ci
//                   sert en dev (npm run dev) et en secours.
//   tout le reste → v3, nouvelle page d'accueil (skin="v2", src/accueil-v2/),
//                   y compris / et /payment-success (retour de SumUp).
//
// ⚠ Nommage : dans le code, la v3 s'appelle encore skin="v2" (dossier
// src/accueil-v2/, data-skin="v2", bloc [data-skin="v2"] du CSS), le nom
// qu'elle portait pendant le test sur /v2. Les numéros de version du site
// (v1, v2, v3) et les noms de peau du code ne coïncident donc pas ; on n'a
// pas renommé pour garder le diff de mise en ligne minimal.
const pathname = window.location.pathname;
const isAdminRoute = pathname.startsWith('/admin');
const isLegal = isLegalRoute(pathname);
const isClassicRoute = pathname.startsWith('/classique');
const isRefonteRoute = pathname === '/refonte' || pathname.startsWith('/refonte/');
const isV2Route = pathname === '/v2' || pathname.startsWith('/v2/');

// Ancienne adresse de test → accueil, recherche et ancre conservées.
if (isV2Route) {
  window.location.replace('/' + window.location.search + window.location.hash);
}

// Canonical : /classique et /refonte sont des variantes de la page d'accueil,
// seule / fait foi (index.html). Les pages légales pointent vers elles-mêmes.
if (isLegal) {
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = 'https://www.kaikaifood.com' + pathname.replace(/\/+$/, '');
}

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
    ) : isV2Route ? (
      null
    ) : isClassicRoute ? (
      <IslandModeProvider>
        <App />
      </IslandModeProvider>
    ) : isRefonteRoute ? (
      <IslandModeProvider>
        <App skin="refonte" />
      </IslandModeProvider>
    ) : (
      <IslandModeProvider>
        <App skin="v2" />
      </IslandModeProvider>
    )}
  </StrictMode>,
)
