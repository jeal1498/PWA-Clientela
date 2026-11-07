// Cuenta de Google y nube de Clientela 2.0 (Supabase compartido con Checa, proyecto gqsadclvftkzwrihfipz). Sin SDK: solo fetch.
// La clave «anon» es pública a propósito: la seguridad la pone RLS (cada fila lleva user_id = auth.uid()).
// Entrar: botón de Google (GIS) → id_token → /auth/v1/token?grant_type=id_token, igual que v1 y Checa.
// Sincronizar: trae lo nuevo de la nube y luego sube lo que cambió aquí. Tabla: clientela2_datos (supabase/clientela2.sql).
import { COLECCIONES, CFG, hash, mezclarColeccion, aplicarOps, mezclarConfig, planSubida } from './nube-sync.js';

const BASE = 'https://gqsadclvftkzwrihfipz.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxc2FkY2x2ZnRrendyaWhmaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NDY5NTEsImV4cCI6MjEwNzMyMjk1MX0.yLcJBXuE8kz_PXiUpCL_7ArDoINhce6NbbsBo2NMQTc';
const WEB_ID = '280542529955-bk79hqpgjs2ddgsfllaol0cdeu60i4nt.apps.googleusercontent.com';
export const KEY = 'clientela2_nube'; // aparte de v1 (clientela_nube): no comparten sesión

// ---------- Estado en el teléfono (con aviso a la pantalla) ----------
const parse = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
let st = parse();
const oyentes = new Set();
const avisar = () => oyentes.forEach((f) => f());
const leer = () => st;
function escribir(nuevo) {
  st = nuevo;
  try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* sin almacenamiento */ }
  avisar();
  return st;
}
const parche = (p) => escribir({ ...st, ...p });
addEventListener('storage', (e) => { if (e.key === KEY) { st = parse(); avisar(); } });

export const suscribir = (f) => { oyentes.add(f); return () => oyentes.delete(f); };
export const haySesion = () => !!st.ses;
export const instantanea = () => st;
export const estado = () => ({ email: st.ses?.email || '', nombre: st.ses?.nombre || '', ultima: st.ultima || 0, error: st.error || '' });

// ---------- Peticiones ----------
async function renovar(actual) {
  const r = await fetch(`${BASE}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: actual.ses.refresh }),
  });
  if (r.status === 400 || r.status === 401) { const e = new Error('sesion'); e.sesion = true; throw e; }
  if (!r.ok) throw new Error('No se pudo renovar la sesión');
  return guardarSesion(await r.json(), actual);
}
function guardarSesion(j, prev = st) {
  const u = j.user || {};
  const ses = {
    access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000,
    id: u.id || prev.ses?.id, email: u.email || prev.ses?.email || '',
    nombre: u.user_metadata?.full_name || u.user_metadata?.name || prev.ses?.nombre || '',
  };
  // Otra cuenta en este teléfono: la huella de lo ya subido no vale.
  const mismo = !prev.uid || prev.uid === ses.id;
  return escribir({ ...(mismo ? prev : {}), ses, uid: ses.id });
}
async function pedir(metodo, ruta, cuerpo, extra = {}) {
  let actual = st;
  if (!actual.ses) throw new Error('Sin sesión');
  if (actual.ses.exp - Date.now() < 60000) actual = await renovar(actual);
  const r = await fetch(BASE + ruta, {
    method: metodo,
    headers: { apikey: ANON, Authorization: `Bearer ${actual.ses.access}`, 'Content-Type': 'application/json', ...extra },
    body: cuerpo == null ? undefined : JSON.stringify(cuerpo),
  });
  if (!r.ok) throw new Error(`nube_${r.status}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

// ---------- Entrar con Google ----------
let gsi;
function cargarGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  gsi ||= new Promise((ok, no) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => (window.google?.accounts?.id ? ok(window.google) : no(new Error('gsi')));
    s.onerror = () => { gsi = null; no(new Error('gsi')); };
    document.head.append(s);
  });
  return gsi;
}
async function entrarConToken(idToken) {
  const r = await fetch(`${BASE}/auth/v1/token?grant_type=id_token`, {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'google', id_token: idToken }),
  });
  if (!r.ok) throw new Error('No se pudo entrar. Intenta de nuevo.');
  guardarSesion(await r.json(), st);
}
/** Pinta el botón de Google en `el`. `onEntro()` cuando ya hay sesión; `onError(msg)` si algo falla. Devuelve una promesa que falla si Google no carga. */
export async function pintarBotonGoogle(el, { onEntro, onError }) {
  const g = await cargarGoogle();
  g.accounts.id.initialize({
    client_id: WEB_ID, auto_select: false, cancel_on_tap_outside: false,
    callback: async (r) => {
      try { await entrarConToken(r.credential); onEntro(); } catch (e) { onError(e.message); }
    },
  });
  g.accounts.id.renderButton(el, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', locale: 'es', width: 280 });
}
/** Cierra la sesión pero conserva el dueño (`uid`) para no mezclar cuentas; borra sesión y huellas. */
export function cerrarSesion() { escribir({ uid: st.uid }); }
/** Borra todo rastro de la nube en este teléfono (después de cerrar sesión con los datos ya subidos). */
export function olvidarNube() { escribir({}); }

// ---------- Sincronizar ----------
const enc = encodeURIComponent;
const masNuevo = (filas, desde) => filas.reduce((m, f) => (f.actualizado > m ? f.actualizado : m), desde);

async function traer(desde) {
  const filtro = desde ? `&actualizado=gt.${enc(desde)}` : '';
  const out = [];
  for (let off = 0; ; off += 1000) {
    const p = await pedir('GET', `/rest/v1/clientela2_datos?select=coleccion,id,datos,borrado,actualizado&order=actualizado,coleccion,id&limit=1000&offset=${off}${filtro}`);
    out.push(...p);
    if (p.length < 1000) break;
  }
  return out;
}
async function subir(filas) {
  for (let i = 0; i < filas.length; i += 200) {
    await pedir('POST', '/rest/v1/clientela2_datos?on_conflict=user_id,coleccion,id', filas.slice(i, i + 200), { Prefer: 'resolution=merge-duplicates,return=minimal' });
  }
}

let corriendo = null;
/**
 * Sincroniza todo. `getData()` da los datos vivos {config, history, clients, trips, expenses, places};
 * `aplicar({config, ops})` se llama si la nube trajo cambios (ops por colección: {upsert, remove}).
 * Devuelve true si la nube trajo cambios.
 */
export function sincronizar(getData, aplicar) {
  if (!st.ses) return Promise.resolve(false);
  corriendo ||= (async () => {
    try {
      const data = getData();
      const k = { ...(st.k || {}) };
      const filas = await traer(st.pc);
      const ops = {}, post = {};
      for (const c of COLECCIONES) {
        ops[c] = mezclarColeccion(c, data[c] || [], filas.filter((f) => f.coleccion === c), k);
        post[c] = aplicarOps(data[c] || [], ops[c]);
      }
      const vacio = COLECCIONES.every((c) => !(data[c] || []).length) && !data.config?.driver?.name;
      const cfgNube = mezclarConfig(data.config, filas.filter((f) => f.coleccion === 'config' && f.id === 'config').pop(), k, vacio);
      const cambio = !!cfgNube || COLECCIONES.some((c) => ops[c].upsert.length || ops[c].remove.length);
      if (cambio) aplicar({ config: cfgNube, ops });

      // Subir lo que cambió aquí.
      const subirFilas = [], marcas = {}, borrados = [];
      for (const c of COLECCIONES) {
        const p = planSubida(c, post[c], k);
        subirFilas.push(...p.filas, ...p.borrar); Object.assign(marcas, p.marcas); borrados.push(...p.borrar.map((b) => `${c}/${b.id}`));
      }
      const cfg = cfgNube || data.config, hc = hash(cfg);
      if (k[CFG] !== hc) { subirFilas.push({ coleccion: 'config', id: 'config', datos: cfg, borrado: false }); marcas[CFG] = hc; }
      if (subirFilas.length) await subir(subirFilas);
      Object.assign(k, marcas);
      for (const b of borrados) delete k[b];
      parche({ k, pc: masNuevo(filas, st.pc || ''), ultima: Date.now(), error: '' });
      return cambio;
    } catch (e) {
      if (e.sesion) cerrarSesion(); else parche({ error: navigator.onLine === false ? 'Sin conexión' : 'No se pudo sincronizar' });
      throw e;
    } finally { corriendo = null; }
  })();
  return corriendo;
}

let timer;
/** Sincroniza unos segundos después del último cambio. */
export function programar(getData, aplicar, ms = 3000) {
  if (!st.ses) return;
  clearTimeout(timer);
  timer = setTimeout(() => sincronizar(getData, aplicar).catch(() => {}), ms);
}
