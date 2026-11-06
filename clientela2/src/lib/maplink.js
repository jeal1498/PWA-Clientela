// Lee enlaces de Google Maps / Apple / Waze o coordenadas sueltas. Copia de parseMapLink de Clientela (js/mapas.js).
// Regresa { lat, lon, name? }, { unreadable: true } si es un enlace que no se puede leer (p. ej. cortos
// maps.app.goo.gl, que el navegador no puede abrir desde aquí) o null si no parece enlace ni coordenadas.
const COORD = '(-?\\d{1,3}\\.\\d+)';
const okPt = (lat, lon, name) => (Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon, ...(name ? { name } : {}) } : null);
const dec = (x) => { try { return decodeURIComponent(x); } catch { return x; } };
export function parseMapLink(text) {
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

/** Enlace para abrir la ruta en Google Maps, con paradas. */
export const directionsLink = (a, b, via = []) => `https://www.google.com/maps/dir/?api=1&origin=${a.lat},${a.lon}&destination=${b.lat},${b.lon}${via.length ? `&waypoints=${via.map((p) => `${p.lat},${p.lon}`).join('%7C')}` : ''}&travelmode=driving`;
