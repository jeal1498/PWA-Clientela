// Service worker de Clientela: funciona sin internet. Sube CACHE al publicar cambios.
const CACHE = 'clientela-v16';
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

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('clientela-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Stale-while-revalidate: responde de caché al instante y actualiza en segundo plano.
// Mapas y rutas (otros dominios) no se tocan.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached || (req.mode === 'navigate' ? cache.match('index.html') : undefined));
      return cached || network;
    }),
  );
});
