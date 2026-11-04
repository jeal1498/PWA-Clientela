// Lugares y rutas con OpenStreetMap (gratis, sin clave): Photon/Nominatim para buscar y OSRM para la ruta.
// Si no hay red o la ruta falla, se estima en línea recta × 1.35 (30 km/h en ciudad, 60 km/h en carretera).
// Para cambiar a Google Maps basta con reemplazar searchPlaces() y route() aquí.

const cache = new Map();
const cached = (key, fn) => {
  if (!cache.has(key)) cache.set(key, fn().catch((e) => { cache.delete(key); throw e; }));
  return cache.get(key);
};

const MX_BBOX = '-118.5,14.4,-86.6,32.8';

async function photon(q, near) {
  const p = new URLSearchParams({ q, limit: '6', bbox: MX_BBOX, lang: 'default' });
  if (near) { p.set('lat', near.lat); p.set('lon', near.lon); }
  const res = await fetch(`https://photon.komoot.io/api/?${p}`);
  if (!res.ok) throw new Error('photon');
  return ((await res.json()).features || []).map((f) => {
    const a = f.properties || {};
    const name = a.name || [a.street, a.housenumber].filter(Boolean).join(' ');
    const area = a.district || a.locality || (a.name ? a.street : '') || '';
    const [lon, lat] = f.geometry.coordinates;
    return { label: [name, area !== name && area].filter(Boolean).join(', '), sub: [a.city || a.county, a.state].filter(Boolean).join(', '), lat, lon };
  }).filter((r) => r.label);
}

async function nominatim(q) {
  const p = new URLSearchParams({ q, format: 'jsonv2', limit: '5', countrycodes: 'mx', 'accept-language': 'es' });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${p}`);
  if (!res.ok) throw new Error('nominatim');
  return (await res.json()).map((r) => {
    const parts = r.display_name.split(',');
    return { label: parts.slice(0, 2).join(',').trim(), sub: parts.slice(2, 4).join(',').trim(), lat: +r.lat, lon: +r.lon };
  });
}

/** Centro aproximado de la ciudad del conductor (para ordenar resultados por cercanía). */
function cityCenter(city) {
  if (!city) return Promise.resolve(null);
  return cached(`c:${city}`, async () => (await photon(city, null))[0] || null).catch(() => null);
}

/** Autocompletado. `city` sesga los resultados hacia la ciudad del conductor sin forzarla en el texto. */
export function searchPlaces(q, { city = '', near = null } = {}) {
  q = q.trim();
  if (q.length < 3) return Promise.resolve([]);
  return cached(`s:${q}|${city}`, async () => {
    const bias = near || (await cityCenter(city));
    try {
      const r = await photon(q, bias);
      if (r.length) return r;
    } catch { /* cae a Nominatim */ }
    return nominatim(city ? `${q}, ${city}` : q);
  });
}

/** Distancia en línea recta (km). */
export function haversine(a, b) {
  const R = 6371, rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Ruta en auto: { km, min, estimated }. `estimated` = true si no hubo OSRM. */
export function route(a, b) {
  const k = `${a.lon.toFixed(5)},${a.lat.toFixed(5)};${b.lon.toFixed(5)},${b.lat.toFixed(5)}`;
  return cached(`r:${k}`, async () => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${k}?overview=false`);
      const d = await res.json();
      if (d.code !== 'Ok') throw new Error('route');
      const r = d.routes[0];
      // OSRM no conoce el tráfico: +25 % al tiempo para acercarse a lo real en ciudad.
      return { km: Math.round(r.distance / 100) / 10, min: Math.max(1, Math.round((r.duration / 60) * 1.25)), estimated: false };
    } catch {
      const km = Math.round(haversine(a, b) * 1.35 * 10) / 10;
      const speed = km < 15 ? 30 : 60;
      return { km, min: Math.max(1, Math.round((km / speed) * 60)), estimated: true };
    }
  });
}

/** Ubicación actual del teléfono. */
export function myLocation() {
  return new Promise((ok, fail) => {
    if (!navigator.geolocation) return fail(new Error('geo'));
    navigator.geolocation.getCurrentPosition(
      (p) => ok({ label: 'Mi ubicación', sub: `${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`, lat: p.coords.latitude, lon: p.coords.longitude }),
      fail,
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}
