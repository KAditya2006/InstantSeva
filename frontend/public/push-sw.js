/* global clients */

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'InstantSeva';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/logo.png',
    badge: '/favicon.svg',
    data: {
      url: data.url || '/',
      notificationId: data.notificationId
    },
    tag: data.notificationId || data.url || 'instantseva-notification'
  };

  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const hasVisibleClient = windows.some((client) => client.visibilityState === 'visible' && client.focused);
    if (hasVisibleClient) return;

    await self.registration.showNotification(title, options);
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const matchingWindow = windows.find((client) => client.url === targetUrl);

    if (matchingWindow) {
      return matchingWindow.focus();
    }

    return clients.openWindow(targetUrl);
  })());
});
