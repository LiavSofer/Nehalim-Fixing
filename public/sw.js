// Service Worker for Push Notifications

self.addEventListener('push', event => {
  if (!event.data) {
    console.log('Push notification received but no data');
    return;
  }

  try {
    const data = event.data.json();
    const { title, body, data: notificationData = {} } = data;

    const options = {
      body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%232563eb" width="192" height="192" rx="45"/><text x="50%" y="50%" font-size="80" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central" font-family="Arial">ת</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%232563eb" width="192" height="192" rx="45"/><text x="50%" y="50%" font-size="80" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central" font-family="Arial">ת</text></svg>',
      tag: 'notification',
      requireInteraction: false,
      data: notificationData,
      vibrate: [200, 100, 200]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Handle service worker activation
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// Handle service worker installation
self.addEventListener('install', event => {
  self.skipWaiting();
});
