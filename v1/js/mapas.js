// Lugares y rutas. Por ahora con OpenStreetMap (gratis, sin clave):
// Nominatim para buscar direcciones y OSRM para distancia y tiempo.
// Cuando haya clave de Google Maps, se cambia aquí sin tocar el resto.

const cache = new Map();
const cached = async (key, fn) => {
  if (!cache.has(key)) cache.set(key, fn().catch((e) => { cache.delete(key); throw e; }));
  return cache.get(key);
};

// Nombre corto y legible a partir del resultado de Nominatim.
function labelOf(r) {
  const a = r.address || {};
  const name = r.name || [a.road, a.house_number].filter(Boolean).join(' ') || r.display_name.split(',')[0];
  const area = a.suburb || a.neighbourhood || a.quarter || a.road || '';
  const city = a.city || a.town || a.village || a.county || '';
  return { label: [name, area && area !== name ? area : ''].filter(Boolean).join(', '), sub: [city, a.state].filter(Boolean).join(', ') };
}

// Nominatim pide no pasar de 1 consulta por segundo: se espacian las que sí salen a la red.
let nextAt = 0;
async function pace() {
  const now = Date.now();
  const at = Math.max(now, nextAt);
  nextAt = at + 1100;
  if (at > now) await new Promise((r) => setTimeout(r, at - now));
}

const fold = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function nominatim(q, near) {
  const p = new URLSearchParams({ q, format: 'jsonv2', addressdetails: '1', limit: '5', 'accept-language': 'es', countrycodes: 'mx' });
  if (near) {
    const d = 0.6;
    p.set('viewbox', [near.lon - d, near.lat + d, near.lon + d, near.lat - d].join(','));
  }
  return cached('s:' + p, async () => {
    await pace();
    const res = await fetch('https://nominatim.openstreetmap.org/search?' + p);
    if (!res.ok) throw new Error('search');
    return (await res.json()).map((r) => ({ ...labelOf(r), lat: +r.lat, lon: +r.lon }));
  });
}

// Photon (también OpenStreetMap) tolera palabras a medias y errores al escribir, y prefiere lo cercano.
function photon(q, near) {
  const p = new URLSearchParams({ q, limit: '8', bbox: '-118.5,14.4,-86.6,32.8' });
  if (near) { p.set('lat', near.lat); p.set('lon', near.lon); }
  return cached('p:' + p, async () => {
    const res = await fetch('https://photon.komoot.io/api/?' + p);
    if (!res.ok) throw new Error('search');
    const out = [];
    for (const f of (await res.json()).features || []) {
      const a = f.properties || {};
      if (a.countrycode && a.countrycode !== 'MX') continue;
      const name = a.name || [a.street, a.housenumber].filter(Boolean).join(' ');
      if (!name) continue;
      const area = a.district || a.locality || (a.name ? a.street : '') || '';
      const [lon, lat] = f.geometry.coordinates;
      out.push({ label: [name, area && area !== name ? area : ''].filter(Boolean).join(', '), sub: [a.city || a.county, a.state].filter(Boolean).join(', '), lat, lon });
    }
    return out;
  });
}

// Busca con la ciudad del conductor (si la puso), luego sin ella y al final con Photon.
// Si ninguna fuente responde, falla (sin conexión); si responden y no hay nada, regresa [].
async function searchPlaces(q, near, city) {
  city = (city || '').trim();
  let ok = 0;
  const attempt = async (fn) => { try { const r = await fn(); ok++; return r; } catch { return []; } };
  const bias = near || (city ? (await attempt(() => nominatim(city, null)))[0] : null);
  let out = [];
  if (city && !fold(q).includes(fold(city))) out = await attempt(() => nominatim(`${q}, ${city}`, bias));
  if (!out.length) out = await attempt(() => nominatim(q, bias));
  if (!out.length) out = await attempt(() => photon(q, bias));
  if (!ok) throw new Error('search');
  const km = (a, b) => Math.hypot(a.lat - b.lat, (a.lon - b.lon) * Math.cos((b.lat * Math.PI) / 180)) * 111;
  if (bias) out = [...out].sort((x, y) => km(x, bias) - km(y, bias));
  const seen = new Set();
  return out.filter((r) => { const k = r.label + r.lat.toFixed(3) + r.lon.toFixed(3); return seen.has(k) ? false : seen.add(k); });
}

// Lee un enlace de Google Maps (o Apple Maps / Waze) o unas coordenadas sueltas y regresa
// { lat, lon, name? }. Si es un enlace de mapa pero no trae la ubicación (por ejemplo los
// cortos maps.app.goo.gl, que el navegador no puede abrir desde aquí) regresa { unreadable: true }.
// Si no parece enlace ni coordenadas, regresa null y se busca como texto normal.
const COORD = '(-?\\d{1,3}\\.\\d+)';
const okPt = (lat, lon, name) => (Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon, ...(name ? { name } : {}) } : null);
const dec = (x) => { try { return decodeURIComponent(x); } catch { return x; } };
function parseMapLink(text) {
  const t = String(text || '').trim();
  const bare = t.match(new RegExp(`^\\(?\\s*${COORD}\\s*[,;\\s]\\s*${COORD}\\s*\\)?$`));
  if (bare) return okPt(+bare[1], +bare[2]) || null;
  const m = t.match(/https?:\/\/[^\s]+/i);
  if (!m) return null;
  let u;
  try { u = new URL(m[0]); } catch { return null; }
  const host = u.hostname.toLowerCase();
  const isMap = /(^|\.)google\.[a-z.]+$/.test(host) && /^\/maps/.test(u.pathname) || /^maps\.google\./.test(host)
    || /(^|\.)goo\.gl$/.test(host) || /^maps\.apple\.com$/.test(host) || /(^|\.)waze\.com$/.test(host);
  if (!isMap) return null;
  const raw = dec(u.pathname + u.search + u.hash);
  const place = u.pathname.match(/\/place\/([^/@]+)/);
  let name = place ? dec(place[1]).replace(/\+/g, ' ').trim() : '';
  if (new RegExp(`^${COORD}[,\\s]+${COORD}$`).test(name)) name = '';
  // 1) el pin exacto (!3d..!4d..), 2) parámetros ll/q/query/destination, 3) el centro del mapa (@lat,lon).
  const pin = raw.match(new RegExp(`!3d${COORD}!4d${COORD}`));
  if (pin) return okPt(+pin[1], +pin[2], name) || { unreadable: true };
  for (const k of ['ll', 'q', 'query', 'destination', 'daddr', 'center']) {
    const v = (u.searchParams.get(k) || '').match(new RegExp(`${COORD}[,\\s+]+${COORD}\\s*$`));
    if (v) return okPt(+v[1], +v[2], name) || { unreadable: true };
  }
  const at = raw.match(new RegExp(`@${COORD},${COORD}`));
  if (at) return okPt(+at[1], +at[2], name) || { unreadable: true };
  return { unreadable: true };
}

// Dirección a partir de coordenadas (para «Mi ubicación»).
function reverse(lat, lon) {
  return cached(`v:${lat.toFixed(4)},${lon.toFixed(4)}`, async () => {
    await pace();
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1&accept-language=es`);
    if (!res.ok) throw new Error('reverse');
    const r = await res.json();
    if (!r || r.error) throw new Error('reverse');
    return { ...labelOf(r), lat, lon };
  });
}

// a → paradas (via) → b. OSRM acepta todos los puntos en orden; distancia y tiempo son del recorrido completo.
function route(a, b, via = []) {
  const k = 'r:' + [a, ...via, b].map((p) => `${p.lon.toFixed(5)},${p.lat.toFixed(5)}`).join(';');
  return cached(k, async () => {
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${k.slice(2)}?overview=simplified&geometries=geojson`);
    const d = await res.json();
    if (d.code !== 'Ok' || !d.routes?.length) throw new Error('route');
    const r = d.routes[0];
    // OSRM no conoce el tráfico: se agrega un 25 % para acercarse a lo real en ciudad.
    return { km: Math.round(r.distance / 100) / 10, min: Math.max(1, Math.round((r.duration / 60) * 1.25)), path: r.geometry.coordinates };
  });
}

const directionsLink = (a, b, via = []) => `https://www.google.com/maps/dir/?api=1&origin=${a.lat},${a.lon}&destination=${b.lat},${b.lon}${via.length ? `&waypoints=${via.map((p) => `${p.lat},${p.lon}`).join('%7C')}` : ''}&travelmode=driving`;

// Mini mapa: el trazo de la ruta sobre un fondo neutro (sin mosaicos externos).
function mapSvg(path, label = 'Ruta', stops = []) {
  if (!path?.length) return '';
  const W = 360, H = 120, pad = 16;
  const xs = path.map((p) => p[0]), ys = path.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const k = Math.min((W - 2 * pad) / (x1 - x0 || 1e-6), (H - 2 * pad) / (y1 - y0 || 1e-6));
  const ox = (W - (x1 - x0) * k) / 2, oy = (H - (y1 - y0) * k) / 2;
  const pt = ([x, y]) => [ox + (x - x0) * k, H - (oy + (y - y0) * k)].map((n) => n.toFixed(1));
  const pts = path.map(pt);
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  const via = (stops || []).filter((s) => s && s.lat != null).map((s) => pt([s.lon, s.lat]))
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="var(--surface)" stroke="var(--accent)" stroke-width="3"/>`).join('');
  return `<svg class="map" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    <rect width="${W}" height="${H}" fill="var(--map)"/>
    <g stroke="var(--road)" stroke-width="5" fill="none"><path d="M0 38H${W}M0 86H${W}M80 0V${H}M190 0V${H}M290 0V${H}"/></g>
    <polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    ${via}
    <circle cx="${ax}" cy="${ay}" r="7" fill="var(--pin-a)" stroke="var(--surface)" stroke-width="3"/>
    <rect x="${bx - 7}" y="${by - 7}" width="14" height="14" rx="3" fill="var(--pin-b)" stroke="var(--surface)" stroke-width="3"/>
  </svg>`;
}
export { searchPlaces, reverse, route, directionsLink, mapSvg, parseMapLink };
