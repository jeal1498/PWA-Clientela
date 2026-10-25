// Service worker de Clientela: funciona sin internet. Sube CACHE al publicar cambios.
const CACHE = 'clientela-v18';
const ASSETS = [
  './',
  'index.html',
  'tarjeta.html',
  'manifest.webmanifest',
  'css/cartera.css',
  'js/acciones-pago.js',
  'js/acciones-viaje.js',
  'js/agenda-vista.js',
  'js/almacenamiento.js',
  'js/calculos.js',
  'js/cartera.js',
  'js/cliente-detalle-vista.js',
  'js/clientes-vista.js',
  'js/cobros-vista.js',
  'js/hoja.js',
  'js/iconos.js',
  'js/inicio-rapido-campos.js',
  'js/inicio-rapido-vista.js',
  'js/interfaz.js',
  'js/lugares-vista.js',
  'js/mapas.js',
  'js/mensajes.js',
  'js/perfil-vistas.js',
  'js/qr.js',
  'js/qrcode.js',
  'js/resumen.js',
  'js/servicio-vista.js',
  'js/servicios.js',
  'js/tabla.js',
  'js/tarjeta-vista.js',
  'js/utilidades.js',
  'js/viaje-vistas.js',
  'js/vistas-pago.js',
  'js/yo-vista.js',
  'marca/tokens.css',
  'marca/fonts/bricolage-800.woff2',
  'marca/fonts/dmsans.woff2',
  'marca/fonts/jetbrains.woff2',
  'marca/icono-app.svg',
  'marca/png/icono-app-192.png',
  'marca/png/icono-app-180.png',
];

// Las instalaciones y las respuestas piden siempre el archivo fresco al servidor (cache: 'reload' / 'no-cache'),
// porque GitHub Pages guarda 10 min en la caché del navegador y el teléfono se quedaba con la versión vieja.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

// Al actualizarse, borra las cachés viejas y recarga solas las pantallas abiertas para mostrar la versión nueva.
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const old = (await caches.keys()).filter((k) => k.startsWith('clientela-') && k !== CACHE);
    await Promise.all(old.map((k) => caches.delete(k)));
    await self.clients.claim();
    if (old.length) for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url).catch(() => {});
  })());
});

// Primero la red (con 4 s de espera); sin internet o muy lenta, responde lo guardado.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req, { cache: 'no-cache' }).then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    });
    if (!cached) return net.catch(() => (req.mode === 'navigate' ? cache.match('index.html') : Response.error()));
    return Promise.race([net, new Promise((_, no) => setTimeout(no, 4000))]).catch(() => cached);
  })());
});
