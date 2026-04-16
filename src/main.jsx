import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminApp from './pages/AdminApp.jsx'
import { IslandModeProvider } from './context/IslandModeContext.jsx'

// Détection de route : /admin → PWA admin, tout autre chemin → site principal
const isAdminRoute = window.location.pathname.startsWith('/admin');

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
    ) : (
      <IslandModeProvider>
        <App />
      </IslandModeProvider>
    )}
  </StrictMode>,
)
