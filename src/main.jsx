import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { isLegalRoute } from './pages/LegalPages.jsx'
import NotFound from './pages/NotFound.jsx'
import { IslandModeProvider } from './context/IslandModeContext.jsx'

// Chargés à la demande : la PWA admin et les pages légales ne doivent pas
// peser sur le bundle de la page d'accueil (l'admin en représentait une bonne
// part). Leurs polices (JetBrains Mono, Instrument Serif, Inter Tight) ne sont
// demandées que sur /admin, ci-dessous.
const AdminApp = lazy(() => import('./pages/AdminApp.jsx'))
const LegalRouter = lazy(() => import('./pages/LegalPages.jsx'))

// Détection de route — les trois versions du site sont conservées :
//   /admin…       → PWA admin
//   pages légales → LegalRouter
//   /classique…   → v1, peau historique   (peau par défaut d'App, « legacy »)
//   /refonte…     → v2, peau refonte      (skin="refonte", src/refonte/)
//   /v2…          → redirigée vers / : c'était l'adresse de test de la v3.
//                   La redirection serveur vit dans vercel.json ; celle-ci
//                   sert en dev (npm run dev) et en secours.
//   / et /payment-success (retour de SumUp) → v3, nouvelle page d'accueil
//                   (skin="v2", src/accueil-v2/)
//   tout autre chemin → page introuvable (noindex), au lieu de servir
//                   l'accueil sous une mauvaise adresse.
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
const isHome = pathname === '/' || pathname === '/index.html' || pathname === '/payment-success';
// Tout chemin qui n'est ni l'accueil, ni une peau, ni une page connue : page
// introuvable (le serveur renvoie index.html pour tout, cf. vercel.json, on
// ne peut donc pas répondre 404 ; on l'indique aux moteurs par noindex).
const isNotFound = !isHome && !isAdminRoute && !isLegal && !isClassicRoute && !isRefonteRoute && !isV2Route;

// Ancienne adresse de test → accueil, recherche et ancre conservées.
if (isV2Route) {
  window.location.replace('/' + window.location.search + window.location.hash);
}

// Canonical : /classique et /refonte sont des variantes de la page d'accueil,
// seule / fait foi (index.html). Les pages légales pointent vers elles-mêmes ;
// la page introuvable n'a pas de canonical et porte noindex.
if (isLegal) {
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = 'https://www.kaikaifood.com' + pathname.replace(/\/+$/, '');
}
if (isNotFound) {
  document.querySelector('link[rel="canonical"]')?.remove();
  const robots = document.createElement('meta');
  robots.name = 'robots'; robots.content = 'noindex';
  document.head.appendChild(robots);
  document.title = 'Page introuvable — KaïKaï';
}


// Polices de l'admin, uniquement sur /admin (elles étaient dans index.html,
// donc téléchargées et bloquantes sur la page d'accueil).
if (isAdminRoute) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(link);
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
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0b0f0d' }} />}>
        <AdminApp />
      </Suspense>
    ) : isLegal ? (
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F5F5F1' }} />}>
        <LegalRouter />
      </Suspense>
    ) : isV2Route ? (
      null
    ) : isNotFound ? (
      <NotFound />
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
