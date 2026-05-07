// KaïKaï Admin — Service Worker
// Gère : installation PWA, notifications push.
//
// IMPORTANT — politique de cache (v3) :
// Ce SW NE CACHE PLUS le HTML ni les bundles JS/CSS. Vite produit des bundles
// avec hash dans le nom de fichier (ex: index-D-AL4z4I.js) — ils sont déjà
// cache-bustés naturellement et l'index.html référence toujours les derniers.
// Mettre ces fichiers dans le cache du SW créait une 2ᵉ couche de cache qui
// pouvait servir un bundle périmé pendant des heures aux PWA installées,
// ce qui s'est manifesté par des écrans incohérents (ex: page Commandes
// avec un ancien TopBar alors que Paramètres avait le nouveau).
// Désormais : seuls les assets statiques immuables (manifest, favicon) sont
// cachés. HTML/JS/CSS passent en network-only via le HTTP cache du navigateur.

const CACHE_NAME = 'kaikai-admin-v3';
const STATIC_ASSETS = ['/manifest.json', '/favicon.png'];

// ─── Installation ───────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {})
    )
  );
});

// ─── Activation ─────────────────────────────────────────────
// Purge tous les caches dont le nom ≠ CACHE_NAME courant.
// Sur la mise à jour v2 → v3, ça vide les anciens bundles JS/CSS cachés.
self.addEventListener('activate', (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
});

// ─── Fetch — cache uniquement les assets statiques listés ───
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Hors origine (Supabase, fonts, …) → laisse passer
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  // Static immutable : cache-first
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // Tout le reste (HTML, JS, CSS, etc.) : pas d'event.respondWith()
  // → le navigateur gère via son HTTP cache. Aucun cache SW persistant
  //   ne peut servir un bundle périmé.
});

// ─── Push Notifications ──────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: '🍜 Nouvelle commande !', body: 'KaïKaï — vérifiez le tableau de bord' };
  try {
    data = event.data?.json() ?? data;
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: 'kaikai-new-order',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { url: '/admin' },
    })
  );
});

// ─── Clic sur notification ───────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/admin') && 'focus' in client) return client.focus();
        }
        return clients.openWindow('/admin');
      })
  );
});
