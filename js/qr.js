// Utilidades para crear el enlace comprimido y los recursos QR de la página del conductor.
const b64u = (bytes) => { let b = ''; for (const x of bytes) b += String.fromCharCode(x); return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
// Los datos viajan dentro del enlace (sin servidor); se comprimen cuando el navegador puede.
export async function encodePage(obj) {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  let best = 'j' + b64u(raw);
  if ('CompressionStream' in window) {
    try {
      const z = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
      const c = 'z' + b64u(z);
      if (c.length < best.length) best = c;
    } catch {}
  }
  return best;
}

export function qrSvg(qr) {
  const n = qr.getModuleCount(), m = 4;
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 2 * m} ${n + 2 * m}" shape-rendering="crispEdges" role="img" aria-label="Código QR de mi página"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}


// Serializa únicamente los datos que el conductor eligió compartir en su página pública.
export function buildPagePayload(s, phoneIntl) {
  const o = s.share;
  const p = { n: s.driver.trim(), c: (s.city || '').trim(), w: phoneIntl(s.phone) };
  if (o.auto && s.car) p.a = [s.car, s.year, s.color, s.seats, s.extras];
  const routes = o.routes.filter((r) => r.label.trim() && +r.price > 0);
  if (o.routesOn && routes.length) p.r = routes.map((r) => [r.label.trim(), Math.round(+r.price)]);
  p.p = s.pays;
  if (o.clabe && s.pays.includes('Transferencia') && s.clabe && s.holder.trim()) p.b = [s.bank, s.holder.trim(), s.clabe.replace(/\s/g, '')];
  if (o.hours.trim()) p.h = o.hours.trim();
  return p;
}
