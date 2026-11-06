// Service worker: guarda o app para abrir offline e mostra os lembretes.
const CACHE = 'planner-v2';
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co') || url.hostname.includes('facebook') || url.hostname.includes('google-analytics') || url.hostname.includes('googletagmanager')) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok && (url.origin === location.origin || url.hostname.includes('fonts.g'))) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data.json(); } catch (_) { d = { title: 'Planner do Criador', body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Planner do Criador', {
    body: d.body || '', icon: './icon-192.png', badge: './icon-192.png', data: { url: d.url || './#/app' },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data.url, self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    for (const c of cs) { if ('focus' in c) { c.navigate(url); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
