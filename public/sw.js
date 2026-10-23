// Service Worker untuk Push Notification PesanBotol
// Daftarkan di layout.tsx dengan navigator.serviceWorker.register('/sw.js')

const VAPID_PUBLIC_KEY = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  ? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  : '';

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'PesanBotol';
  const options = {
    body: data.body || 'Ada balasan baru untuk pesanmu.',
    icon: '/images/favicon.svg',
    badge: '/images/favicon.svg',
    tag: 'pesanbotol-reply',
    data: {
      bottleId: data.bottleId || null,
      url: data.url || '/',
    },
    requireInteraction: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const focusedClient = clients.find((c) => c.url === self.location.origin + url);
      if (focusedClient) {
        return focusedClient.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  // Tidak perlu aksi khusus saat notifikasi ditutup
});
