// KaïKaï Admin — Service Worker
// Gère : installation PWA, cache offline, notifications push

const CACHE_NAME = 'kaikai-admin-v1';

// ─── Installation ───────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/', '/admin', '/manifest.json', '/favicon.png']).catch(() => {})
    )
  );
});

// ─── Activation ─────────────────────────────────────────────
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

// ─── Fetch — Network first, fallback sur cache ───────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ne pas intercepter les requêtes vers Supabase ou autres API externes
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache les ressources statiques
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
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
