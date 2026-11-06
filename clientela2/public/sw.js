// Service worker de Clientela (raíz). Red primero para la página; caché primero solo para los archivos con hash de Vite,
// las fuentes y los íconos de ESTA app. La app anterior (/v1/), la tarjeta y /cotiza/ pasan directo a la red.
const CACHE = 'clientela-v28';
const ROOT = new URL('./', self.registration.scope).pathname; // p. ej. /PWA-Clientela/
const MINE = [ROOT + 'assets/', ROOT + 'fonts/', ROOT + 'icon'];
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html']))); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // mapas y rutas van directo a la red
  if (req.mode === 'navigate') {
    if (url.pathname !== ROOT && url.pathname !== ROOT + 'index.html') return; // /v1/, /cotiza/, tarjeta.html…
    e.respondWith(fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put('./index.html', cp)); } return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  if (!MINE.some((p) => url.pathname.startsWith(p))) return;
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return r; })));
});
