// Service Worker - Push Notifications only, no app caching

self.addEventListener('install', (event) => {
  // Skip waiting so new SW activates immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Clear all caches on activation
    caches.keys().then(cacheNames =>
      Promise.all(cacheNames.map(name => caches.delete(name)))
    ).then(() => self.clients.claim())
  );
});

// Do NOT cache any fetch requests - always go to network
self.addEventListener('fetch', (event) => {
  // Let all requests pass through to the network
  return;
});

// Push notification handling
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'התראה חדשה', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'תחזוקה נחלים';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: data.data || {},
    dir: 'rtl',
    lang: 'he',
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
