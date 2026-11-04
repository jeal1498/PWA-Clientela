// Cuenta de Google y nube (Supabase compartido con Checa, proyecto gqsadclvftkzwrihfipz). Sin SDK: solo fetch.
// La clave «anon» es pública a propósito: la seguridad la pone RLS (cada fila lleva user_id = auth.uid()).
// Entrar: botón de Google (GIS) → id_token → /auth/v1/token?grant_type=id_token, igual que Cuenta.kt en Checa.
// Sincronizar: primero trae lo nuevo de la nube, luego sube lo que cambió aquí (por huella de cada cliente y viaje).
const BASE = 'https://gqsadclvftkzwrihfipz.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxc2FkY2x2ZnRrendyaWhmaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NDY5NTEsImV4cCI6MjEwNzMyMjk1MX0.yLcJBXuE8kz_PXiUpCL_7ArDoINhce6NbbsBo2NMQTc';
const WEB_ID = '280542529955-bk79hqpgjs2ddgsfllaol0cdeu60i4nt.apps.googleusercontent.com';
const KEY = 'clientela_nube';

// ---------- Estado en el teléfono ----------
function leer() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function escribir(st) {
  try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* sin almacenamiento */ }
  return st;
}
const parche = (p) => escribir({ ...leer(), ...p });
export const sesion = () => leer().ses || null;
export const estado = () => { const s = leer(); return { email: s.ses?.email || '', nombre: s.ses?.nombre || '', ultima: s.ultima || 0, error: s.error || '' }; };

// ---------- Peticiones ----------
async function renovar(st) {
  const r = await fetch(`${BASE}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: st.ses.refresh }),
  });
  if (r.status === 400 || r.status === 401) { const e = new Error('sesion'); e.sesion = true; throw e; }
  if (!r.ok) throw new Error('No se pudo renovar la sesión');
  return guardarSesion(await r.json(), st);
}
function guardarSesion(j, prev = leer()) {
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
  let st = leer();
  if (!st.ses) throw new Error('Sin sesión');
  if (st.ses.exp - Date.now() < 60000) st = await renovar(st);
  const r = await fetch(BASE + ruta, {
    method: metodo,
    headers: { apikey: ANON, Authorization: `Bearer ${st.ses.access}`, 'Content-Type': 'application/json', ...extra },
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
  guardarSesion(await r.json(), leer());
}
export function cerrarSesion() {
  const st = leer();
  escribir({ uid: st.uid }); // conserva el dueño para no mezclar cuentas; borra sesión y huellas
}

// ---------- Sincronizar ----------
const hash = (o) => {
  const s = JSON.stringify(o); let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h);
};
const enc = encodeURIComponent;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const PAGOS = ['', 'efectivo', 'transferencia', 'tarjeta'];
const ESTADOS = ['agendado', 'hecho', 'cancelado'];
const filaCliente = (c) => ({ id: c.id, nombre: String(c.name || '').slice(0, 120) || null, telefono: String(c.phone || '').slice(0, 20) || null, datos: c, borrado: false });
const filaViaje = (t) => ({
  id: t.id, cliente_id: t.clientId ? String(t.clientId).slice(0, 40) : null, fecha: FECHA.test(t.date || '') ? t.date : null,
  hora: t.time ? String(t.time).slice(0, 8) : null, precio: Number.isFinite(+t.price) && t.price !== '' && t.price != null ? +t.price : null,
  estado: ESTADOS.includes(t.status) ? t.status : null, pago: PAGOS.includes(t.pay) ? t.pay : null, datos: t, borrado: false,
});
function filaPerfil(s) {
  let tel = String(s.phone || '').replace(/\D/g, '');
  if (tel.length === 10) tel = (String(s.lada || '52').replace(/\D/g, '') || '52') + tel;
  return {
    nombre: String(s.driver || '').slice(0, 80) || null, telefono: /^\d{10,15}$/.test(tel) ? tel : null,
    ciudad: String(s.city || '').slice(0, 80) || null,
    tarifas: { perKm: s.perKm, perHour: s.perHour, extra: s.extra }, ajustes: s,
  };
}

// Trae filas nuevas y las mezcla en la lista local. Devuelve true si algo cambió.
function mezclar(lista, filas, conocidos) {
  let cambio = false;
  for (const f of filas) {
    const i = lista.findIndex((x) => x.id === f.id);
    if (f.borrado) {
      if (i >= 0) { lista.splice(i, 1); cambio = true; }
      delete conocidos[f.id];
      continue;
    }
    if (i < 0) {
      if (f.id in conocidos) continue; // ya lo tenía y lo borré aquí: se avisa a la nube al subir
      lista.push(f.datos); conocidos[f.id] = hash(f.datos); cambio = true;
      continue;
    }
    const local = lista[i];
    const sinCambios = conocidos[f.id] === hash(local);
    if (sinCambios || (f.datos.updatedAt || 0) >= (local.updatedAt || 0)) {
      if (hash(local) !== hash(f.datos)) { lista[i] = f.datos; cambio = true; }
      conocidos[f.id] = hash(f.datos);
    }
  }
  return cambio;
}
const masNuevo = (filas, desde) => filas.reduce((m, f) => (f.actualizado > m ? f.actualizado : m), desde);

async function subir(tabla, filas) {
  for (let i = 0; i < filas.length; i += 200) {
    await pedir('POST', `/rest/v1/${tabla}?on_conflict=${tabla === 'perfil_conductor' ? 'user_id' : 'user_id,id'}`, filas.slice(i, i + 200),
      { Prefer: 'resolution=merge-duplicates,return=minimal' });
  }
}
async function subirLista(tabla, lista, conocidos, aFila) {
  const filas = [], marcas = {};
  for (const x of lista) { const h = hash(x); if (conocidos[x.id] !== h) { filas.push(aFila(x)); marcas[x.id] = h; } }
  const vivos = new Set(lista.map((x) => x.id)), borrar = [];
  for (const id of Object.keys(conocidos)) if (!vivos.has(id)) borrar.push({ id, datos: {}, borrado: true });
  if (filas.length || borrar.length) await subir(tabla, [...filas, ...borrar]);
  Object.assign(conocidos, marcas);
  for (const b of borrar) delete conocidos[b.id];
}

let corriendo = null;
/** Sincroniza todo. `getData()` da los datos vivos; `onCambio()` se llama si la nube trajo cambios. */
export function sincronizar(getData, onCambio) {
  if (!sesion()) return Promise.resolve(false);
  corriendo ||= (async () => {
    try {
      const data = getData();
      const st = leer();
      const c = st.c || {}, t = st.t || {};
      const desde = st.pc ? `&actualizado=gt.${enc(st.pc)}` : '', desdeV = st.pt ? `&actualizado=gt.${enc(st.pt)}` : '';
      const [cs, vs, pf] = await Promise.all([
        pedir('GET', `/rest/v1/clientes?select=id,datos,borrado,actualizado&order=actualizado${desde}`),
        pedir('GET', `/rest/v1/viajes_privados?select=id,datos,borrado,actualizado&order=actualizado${desdeV}`),
        pedir('GET', '/rest/v1/perfil_conductor?select=ajustes,actualizado'),
      ]);
      let cambio = mezclar(data.clients, cs, c);
      cambio = mezclar(data.trips, vs, t) || cambio;
      const remoto = pf?.[0];
      const sh = hash(data.settings);
      if (remoto?.ajustes?.onboarded && (!data.settings.onboarded || (remoto.actualizado > (st.pp || '') && sh === st.ps))) {
        const nuevos = { ...data.settings, ...remoto.ajustes };
        if (hash(nuevos) !== sh) { data.settings = nuevos; cambio = true; }
      }
      // Subir lo que cambió aquí.
      await subirLista('clientes', data.clients, c, filaCliente);
      await subirLista('viajes_privados', data.trips, t, filaViaje);
      const ph = hash(data.settings);
      if (ph !== st.ps && data.settings.onboarded) await subir('perfil_conductor', [filaPerfil(data.settings)]);
      parche({ c, t, pc: masNuevo(cs, st.pc || ''), pt: masNuevo(vs, st.pt || ''), pp: remoto?.actualizado || st.pp || '', ps: data.settings.onboarded ? ph : st.ps, ultima: Date.now(), error: '' });
      if (cambio) onCambio?.();
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
export function programar(getData, onCambio, ms = 3000) {
  if (!sesion()) return;
  clearTimeout(timer);
  timer = setTimeout(() => sincronizar(getData, onCambio).catch(() => {}), ms);
}

// ---------- Pantalla de acceso ----------
const LOGO = '<svg class="logo" viewBox="0 0 112 72" aria-hidden="true"><rect x="2" y="2" width="108" height="68" rx="20" fill="#222826" stroke="#3A423F" stroke-width="1.6"/><circle cx="32" cy="36" r="15" fill="#22C55E"/><path d="M25 36.6l5 5L39.5 31" fill="none" stroke="#04210F" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="56" y="25" width="40" height="8" rx="4" fill="#F4F4EF"/><rect x="56" y="40" width="26" height="8" rx="4" fill="#5A625F"/></svg>';
function pantalla(html) {
  let el = document.getElementById('acceso');
  if (!el) { el = document.createElement('div'); el.id = 'acceso'; el.className = 'acceso'; document.body.append(el); }
  el.innerHTML = html;
  return el;
}
const cerrarPantalla = () => document.getElementById('acceso')?.remove();

function pedirAcceso({ cuenta, onEntro }) {
  const el = pantalla(`<div class="centro">${LOGO}<h1>Tus clientes, en orden</h1>
    <p>Entra con la cuenta de Google que usas en Checa.</p><div id="gbtn" class="gbtn" aria-live="polite"></div>
    <p class="aviso" id="gerr" role="status" hidden></p></div>
    <p class="pie">Tus datos son solo tuyos. Nadie más los ve.</p>`);
  const err = el.querySelector('#gerr');
  const falla = (m) => { err.textContent = m; err.hidden = false; };
  cargarGoogle().then((g) => {
    g.accounts.id.initialize({
      client_id: WEB_ID, auto_select: false, cancel_on_tap_outside: false,
      callback: async (r) => {
        err.hidden = true;
        try { await entrarConToken(r.credential); onEntro(); } catch (e) { falla(e.message); }
      },
    });
    g.accounts.id.renderButton(el.querySelector('#gbtn'), { theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', locale: 'es', width: 280 });
  }).catch(() => {
    falla(navigator.onLine === false ? 'Sin conexión. Conéctate a internet para entrar la primera vez.' : 'No se pudo cargar el acceso de Google.');
    const b = document.createElement('button'); b.className = 'primary'; b.textContent = 'Reintentar';
    b.onclick = () => pedirAcceso({ cuenta, onEntro });
    el.querySelector('.centro').append(b);
  });
}

/**
 * Arranque de la app. Sin sesión pide entrar con Google (obligatorio); con sesión abre directo y sincroniza al fondo.
 * hayDatos(): ¿hay datos en este teléfono que subir? empezar(): pinta la app. aplicar(): la nube trajo cambios.
 */
export function arrancar({ getData, hayDatos, empezar, aplicar }) {
  const sync = () => sincronizar(getData, aplicar).catch(() => {});
  if (sesion()) {
    empezar();
    sync();
  } else {
    pedirAcceso({
      onEntro: async () => {
        const d = getData();
        if (hayDatos()) {
          pantalla(`<div class="centro">${LOGO}<h1>Subiendo tus datos</h1><p>Encontré datos en este teléfono. Los paso a tu cuenta para no perderlos.</p>
            <div class="lista"><div><span>Clientes</span><b>${d.clients.length}</b></div><div><span>Viajes</span><b>${d.trips.length}</b></div></div>
            <div class="barra"><i></i></div></div><p class="pie">No cierres la app unos segundos.</p>`);
        }
        try { await sincronizar(getData, aplicar); } catch { /* sin internet: se sube después */ }
        cerrarPantalla();
        empezar();
      },
    });
  }
  addEventListener('online', sync);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
}
