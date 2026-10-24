// Respaldo de Clientela en una hoja de Google propia (Apps Script, ver apps-script/Code.gs).
// Escribe las pestañas «Clientela · Clientes» y «Clientela · Viajes» y una copia exacta oculta para restaurar.
// La conexión (URL y clave) vive en este teléfono; con «auto» se envía sola después de cada cambio.
const KEY = 'clientela_hoja';

export function getCfg() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
export function setCfg(patch) {
  const cfg = { ...getCfg(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch { /* sin almacenamiento */ }
  return cfg;
}
export function connection() {
  const { url, token } = getCfg();
  return url && token ? { url, token } : null;
}

/* Un texto que empieza con "=" Google lo tomaría como fórmula. */
const cell = (v) => (v == null ? '' : typeof v === 'string' && /^[=+@-]/.test(v) ? "'" + v : v);
const STATUS = { agendado: 'Agendado', hecho: 'Hecho', cancelado: 'Cancelado' };

export function tables(data) {
  const name = new Map(data.clients.map((c) => [c.id, c.name]));
  const byDate = (a, b) => `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`);
  return [
    {
      name: 'Clientela · Clientes',
      headers: ['Nombre', 'Teléfono', 'Servicios frecuentes', 'Notas'],
      rows: [...data.clients].sort((a, b) => String(a.name).localeCompare(String(b.name), 'es'))
        .map((c) => [c.name, c.phone, (c.services || []).map((s) => s.name).filter(Boolean).join(' · '), c.notes].map(cell)),
    },
    {
      name: 'Clientela · Viajes',
      headers: ['Fecha', 'Hora', 'Cliente', 'De', 'A', 'Km', 'Precio', 'Estado', 'Pago', 'Notas'],
      rows: [...data.trips].sort(byDate)
        .map((t) => [t.date, t.time, name.get(t.clientId) || '', t.from, t.to, t.km, t.price, STATUS[t.status] || t.status, t.pay, t.notes].map(cell)),
    },
  ];
}

const NET_HELP = 'Google no respondió. Revisa que la implementación tenga acceso «Cualquier persona», que la URL termine en /exec y que la clave sea la misma del script.';
async function call(url, opts) {
  let res;
  try { res = await fetch(url, opts); } catch { throw new Error(navigator.onLine === false ? 'Sin conexión a internet' : NET_HELP); }
  try { return await res.json(); } catch { throw new Error(NET_HELP); }
}

/* Envía clientes y viajes. Body como text/plain para que el navegador no haga preflight. */
export async function push(data) {
  const cfg = connection();
  if (!cfg) throw new Error('Primero conecta tu hoja');
  const raw = JSON.stringify({ app: 'cartera', ...data });
  const out = await call(cfg.url, { method: 'POST', body: JSON.stringify({ token: cfg.token, tables: tables(data), raw }) });
  if (!out.ok) throw new Error(out.error || 'Error en la hoja');
  setCfg({ last: Date.now(), error: '' });
}

/* Trae de la hoja la última copia exacta (o null si aún no hay). */
export async function pull() {
  const cfg = connection();
  if (!cfg) throw new Error('Primero conecta tu hoja');
  const out = await call(`${cfg.url}${cfg.url.includes('?') ? '&' : '?'}token=${encodeURIComponent(cfg.token)}`);
  if (!out.ok) throw new Error(out.error || 'Error en la hoja');
  return out.data;
}
