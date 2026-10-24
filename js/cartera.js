import { createPaymentHandlers } from './acciones-pago.js';
import { createTripActions } from './acciones-viaje.js';
import { createServiceCard } from './servicio-vista.js';
import { createPlaceFields } from './lugares-vista.js';
import { createServiceHelpers } from './servicios.js';
import { createOnboardingView } from './inicio-rapido-vista.js';
import { createStepHandlers } from './inicio-rapido-campos.js';
import { createShell } from './interfaz.js';
import { createMeView } from './yo-vista.js';
import { createCardView } from './tarjeta-vista.js';
import { createClientDetailView } from './cliente-detalle-vista.js';
import { createClientsView } from './clientes-vista.js';
import { createChargesView } from './cobros-vista.js';
import { createAgendaView } from './agenda-vista.js';
import { createTripCard } from './viaje-vistas.js';
import { createSummaryView } from './resumen.js';
import { PAYS, PAY_LABEL, seg, payGrid } from './vistas-pago.js';
import { PROFILE_STEPS, CAR_EXTRAS, PAY_OPTS, ONB, stepHtml } from './perfil-vistas.js';
import { uid, esc, money, today, addDays, daysBetween, fdate, cap, dayLabel, hour12, initials, firstName, byWhen, mondayOf, shortRoute, fold, cleanPt, clashes, clashLine } from './utilidades.js';
import { encodePage, qrSvg, buildPagePayload } from './qr.js';
import { icon } from './iconos.js';
import { createMessaging } from './mensajes.js';
import { searchPlaces, reverse, route, directionsLink, mapSvg, parseMapLink } from './mapas.js';
import { numOr, PRESETS, isAirport, isNight, calculateQuote } from './calculos.js';
import { loadData, saveData } from './almacenamiento.js';


// Clientela: clientes privados del conductor (agenda, cotizaciones, viajes, cobros y WhatsApp).
// Todo se guarda en este teléfono (localStorage, clave «cartera» de la versión anterior). Sin build ni dependencias.


// ---------- Datos ----------
const KEY = 'cartera';
const EXTRA_DEF = { base: { on: false, v: 30 }, minimum: { on: true, v: 100 }, airport: { on: false, v: 50 }, night: { on: false, v: 20 }, wait: { on: false, v: 3 } };
const DEFAULTS = { clients: [], trips: [], settings: {
  onboarded: false, driver: '', phone: '', city: '', lada: '52',
  car: '', year: '', color: '', plates: '', seats: 4, extras: [],
  perKm: 12, perHour: 240, extra: EXTRA_DEF,
  pays: ['Efectivo'], bank: '', clabe: '', holder: '',
  share: { auto: true, routesOn: true, routes: [], clabe: true, hours: '' },
} };
let data = loadData(KEY, DEFAULTS, EXTRA_DEF);
// La tarifa por hora siempre equivale a 20 veces la tarifa por kilómetro.
data.settings.perHour = numOr(data.settings.perKm, 12) * 20;
function save() { saveData(KEY, data, () => toast('No se pudo guardar')); }
navigator.storage?.persist?.();

const $ = (s, el = document) => el.querySelector(s);

const client = (id) => data.clients.find((c) => c.id === id);
const tripsOf = (id) => data.trips.filter((t) => t.clientId === id);
const owed = (t) => t.status === 'hecho' && !t.pay;
// Te debe desde hace 15 días o más: se pinta en rojo (atrasado); antes, en amarillo.
const LATE_DAYS = 15;
const lateDebt = (t) => owed(t) && daysBetween(t.date, today()) >= LATE_DAYS;
const debtOf = (id) => tripsOf(id).filter(owed).reduce((s, t) => s + +t.price, 0);
const lastTrip = (id) => tripsOf(id).filter((t) => t.status === 'hecho').sort((a, b) => b.date.localeCompare(a.date))[0];
const DAYS = [[1, 'L'], [2, 'M'], [3, 'M'], [4, 'J'], [5, 'V'], [6, 'S'], [0, 'D']];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const weekSummary = (c) => `${daysLabel(c.week?.days || [])} · ${c.week?.items?.length || 0} viaje${c.week?.items?.length === 1 ? '' : 's'} al día`;

// ---------- WhatsApp y llamadas ----------
// Las plantillas y los enlaces viven en mensajes.js; la aplicación les pasa sus formatos y estado.
const { phoneIntl, waLink, sign, MSG } = createMessaging({
  getSettings: () => data.settings,
  firstName, dayLabel, hour12, money, fdate, cap, byWhen,
});

// ---------- Tarifa (como CHECA: meta por km y por hora; se usa la que deje más) ----------
function quote(km, min, ctx = {}, s = data.settings) { return calculateQuote(km, min, ctx, s, EXTRA_DEF); }
const suggestPrice = (km, min, ctx) => quote(km, min, ctx).total;
const { autoName, svcCtx, svcPrice, fromService } = createServiceHelpers({ suggestPrice, isAirport });
const priceMath = (km, min, ctx) => quote(km, min, ctx).lines.filter((l) => l[2]).map(([l, v]) => `${l}: ${money(v)}`).join(' · ');
const calcTable = (q) => `<dl class="calc">${q.lines.map(([l, v, used]) => `<dt class="${used ? '' : 'off'}">${esc(l)}</dt><dd class="${used ? '' : 'off'}">${money(v)}</dd>`).join('')}</dl>`;

// ---------- Estructura ----------
const view = $('#view');
const top = $('#top');
const tabs = $('#tabs');
const sheet = $('#sheet');

const { header, setTabs, toast } = createShell({
  getData: () => data, top, tabs, icon, esc, initials, owed, lateDebt, $,
  onCard: () => { location.hash = '#/tarjeta'; }, onPlus: () => plusMenu(),
});

function render() {
  const [, mod = '', id = ''] = (location.hash || '#/').slice(1).split('/');
  if (mod === 'nuevo') { history.replaceState(null, '', '#/'); render(); tripForm(); return; }
  window.scrollTo(0, 0);
  document.body.classList.toggle('onboarding', !data.settings.onboarded);
  document.body.classList.toggle('full', data.settings.onboarded && mod === 'tarjeta');
  if (!data.settings.onboarded) renderOnboarding();
  else if (mod === 'yo' || mod === 'perfil' || mod === 'ajustes') renderMe();
  else if (mod === 'tarjeta') renderCard();
  else if (mod === 'clientes') renderClients();
  else if (mod === 'cliente' && client(id)) renderClient(id);
  else if (mod === 'cobros') renderCharges();
  else if (mod === 'resumen') renderSummary();
  else renderAgenda();
}
window.addEventListener('hashchange', render);
function refresh() { save(); render(); }

// ---------- Tarjeta de viaje ----------
const tripCard = createTripCard({
  client, today, owed, lateDebt, cap, waLink, MSG, icon, hour12, dayLabel, esc, money, payLabel: PAY_LABEL,
});

// Repetir un viaje en un toque: mismo cliente, ruta, paradas y precio, para hoy. Se ajusta tocando la tarjeta.
function repeatTrip(src) {
  if (!src) return;
  const now = Date.now();
  const x = {
    id: uid(), createdAt: now, updatedAt: now, clientId: src.clientId, date: today(), time: '',
    from: src.from, to: src.to, fromPt: src.fromPt, toPt: src.toPt, stops: src.stops || [], km: src.km, min: src.min, path: src.path,
    price: src.price, wait: '', status: 'agendado', pay: '', notes: '',
  };
  data.trips.push(x);
  refresh();
  toast('Viaje repetido para hoy', { label: 'Deshacer', fn: () => { data.trips = data.trips.filter((t) => t.id !== x.id); refresh(); } });
}

function bindTrips() {
  view.querySelectorAll('[data-trip]').forEach((el) => {
    const open = () => tripForm(data.trips.find((t) => t.id === el.dataset.trip));
    el.onclick = (e) => { if (!e.target.closest('a,button')) open(); };
    el.onkeydown = (e) => { if (e.key === 'Enter' && e.target === el) open(); };
  });
  view.querySelectorAll('[data-finish]').forEach((b) => (b.onclick = () => finishForm(data.trips.find((t) => t.id === b.dataset.finish))));
  view.querySelectorAll('[data-paid]').forEach((b) => (b.onclick = () => payForm([data.trips.find((t) => t.id === b.dataset.paid)])));
  // Terminar con la forma de pago habitual del cliente: un toque.
  view.querySelectorAll('[data-fpay]').forEach((b) => (b.onclick = () => finishTrip(data.trips.find((t) => t.id === b.dataset.fpay), b.dataset.method)));
  view.querySelectorAll('[data-again]').forEach((b) => (b.onclick = () => repeatTrip(data.trips.find((t) => t.id === b.dataset.again))));
  // Confirmar abre WhatsApp y deja el viaje como «Confirmado».
  view.querySelectorAll('[data-confirm]').forEach((a) => (a.onclick = () => {
    const t = data.trips.find((x) => x.id === a.dataset.confirm);
    t.confirmedAt = Date.now();
    setTimeout(refresh, 50);
  }));
  view.querySelectorAll('[data-notdone]').forEach((b) => (b.onclick = () => {
    const t = data.trips.find((x) => x.id === b.dataset.notdone);
    t.status = 'cancelado';
    t.updatedAt = Date.now();
    refresh();
    toast('Marcado como no hecho', { label: 'Deshacer', fn: () => { t.status = 'agendado'; refresh(); } });
  }));
}

// ---------- Agenda ----------
const renderAgenda = createAgendaView({
  getData: () => data, view, header, setTabs, today, owed, lateDebt, byWhen, money, icon,
  firstName, esc, cap, fdate, dayLabel, hour12, weekSummary, weekNudges, addDays, tripCard, bindTrips, $, client,
  weekForm, refresh, clientForm, importContacts,
});

// ---------- Clientes ----------
const renderClients = createClientsView({
  getData: () => data, header, setTabs, view, icon, esc, clientForm, $, sleeping,
  debtOf, lateDebt, lastTrip, tripsOf, dayLabel, hour12, today, byWhen, initials, money,
});

function sleeping(c) {
  const last = lastTrip(c.id);
  return daysBetween(last ? last.date : new Date(c.createdAt).toLocaleDateString('en-CA'), today()) > 30;
}
// ---------- Cobros ----------
// ---------- Resumen ----------
const renderSummary = createSummaryView({
  getData: () => data, view, header, setTabs, today, lastTrip, sleeping,
  icon, money, esc, cap, fdate, initials, dayLabel, waLink, MSG, client,
});

// ---------- Yo (perfil y ajustes) ----------
const renderMe = createMeView({
  getData: () => data, header, setTabs, view, icon, esc, initials, $, today, daysBetween, editProfile,
  openCard: () => { location.hash = '#/tarjeta'; }, exportBackup, pickBackup, importContacts, ladaForm, placesForm,
  resetOnboarding: () => { data.settings.onboarded = false; obStep = 0; refresh(); },
});
function exportBackup() {
  const blob = new Blob([JSON.stringify({ app: 'cartera', exportedAt: new Date().toISOString(), ...data }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `clientela-${today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  data.settings.lastBackup = today();
  refresh();
  toast('Copia descargada');
}
// Lugares con nombre: los tuyos y los de cada cliente. Se crean con la ☆ al elegir un lugar.
function placesForm() {
  openSheet(`<h2>Mis lugares</h2>
    <p class="field wide muted" style="font-weight:400">Al elegir un lugar en un viaje, toca la ☆ para ponerle nombre.</p>
    <div class="wide" id="plist"></div>
    <div class="buttons"><button type="button" data-close>Cerrar</button></div>`, (form) => {
    $('[data-close]', form).onclick = () => sheet.close();
    const box = $('#plist', form);
    const draw = () => {
      const rows = [
        ...(data.settings.savedPlaces || []).map((p) => ({ p, from: data.settings.savedPlaces, who: 'Tuyo' })),
        ...data.clients.flatMap((c) => (c.savedPlaces || []).map((p) => ({ p, from: c.savedPlaces, who: c.name }))),
      ];
      box.innerHTML = rows.length
        ? rows.map((r, k) => `<div class="prow"><span><b>${esc(r.p.name)}</b><small>${esc(r.who)} · ${esc(r.p.addr)}</small></span><button type="button" data-rm="${k}">Quitar</button></div>`).join('')
        : '<p class="muted">Aún no tienes lugares con nombre.</p>';
      box.onclick = (e) => {
        const b = e.target.closest('[data-rm]');
        if (!b) return;
        const r = rows[+b.dataset.rm];
        r.from.splice(r.from.indexOf(r.p), 1);
        refresh();
        draw();
      };
    };
    draw();
  });
}
function ladaForm() {
  openSheet(`<h2>Lada para WhatsApp</h2>
    ${field('Lada del país', `<input name="lada" inputmode="numeric" value="${esc(data.settings.lada)}" placeholder="52">`, true)}
    <small class="field wide muted">Se agrega a los números de 10 dígitos.</small>
    <div class="buttons"><button type="button" data-close>Cancelar</button><button class="primary">Guardar</button></div>`, (form) => {
    $('[data-close]', form).onclick = () => sheet.close();
    form.onsubmit = () => { data.settings.lada = form.elements.lada.value.replace(/\D/g, '') || '52'; refresh(); toast('Guardado'); };
  });
}
function pickBackup() {
  const file = document.createElement('input');
  file.type = 'file';
  file.accept = 'application/json,.json';
  file.onchange = async () => {
    try {
      const d = JSON.parse(await file.files[0].text());
      if (d.app !== 'cartera') throw new Error();
      // Suma sin borrar: lo que trae el archivo reemplaza solo los mismos ids.
      for (const k of ['clients', 'trips']) {
        const m = new Map(data[k].map((x) => [x.id, x]));
        for (const x of d[k] || []) m.set(x.id, x);
        data[k] = [...m.values()];
      }
      if (d.settings) data.settings = { ...data.settings, ...d.settings, onboarded: true };
      save();
      data = loadData(KEY, DEFAULTS, EXTRA_DEF);
      refresh();
      toast('Copia cargada');
    } catch { toast('Ese archivo no es una copia de Clientela'); }
  };
  file.click();
}
// Contactos del teléfono (Chrome en Android).
async function importContacts() {
  try {
    const list = await navigator.contacts.select(['name', 'tel'], { multiple: true });
    let n = 0;
    for (const c of list) {
      const name = (c.name?.[0] || '').trim();
      const phone = (c.tel?.[0] || '').trim();
      if (!name || data.clients.some((x) => x.name === name || (phone && x.phone.replace(/\D/g, '').slice(-10) === phone.replace(/\D/g, '').slice(-10)))) continue;
      data.clients.push({ id: uid(), name, phone, notes: '', services: [], createdAt: Date.now(), updatedAt: Date.now() });
      n++;
    }
    data.settings.onboarded = true;
    location.hash = '#/clientes';
    refresh();
    toast(n ? `${n} cliente${n === 1 ? '' : 's'} agregado${n === 1 ? '' : 's'}` : 'No se agregó nadie nuevo');
  } catch { toast('No se pudieron leer los contactos'); }
}

// ---------- Perfil del conductor e inicio rápido ----------
let obStep = 0;
const { liveStep, wireStep } = createStepHandlers({ quote, money, calcTable, $, numOr, PRESETS });

let obDraft = null;
const renderOnboarding = createOnboardingView({
  getData: () => data, getObStep: () => obStep, setObStep: (value) => { obStep = value; },
  getObDraft: () => obDraft, setObDraft: (value) => { obDraft = value; },
  top, tabs, view, icon, ONB, PROFILE_STEPS, stepHtml, wireStep, $, esc, toast, save,
  render, pickBackup, importContacts, clientForm,
});


function editProfile(n) {
  const D = structuredClone(data.settings);
  const draw = () => {
    const box = $('.pstep', sheet);
    box.innerHTML = stepHtml(n, D);
    liveStep(box, D);
  };
  openSheet(`<div class="pstep wide">${stepHtml(n, D)}</div><div class="buttons"><button type="button" data-close>Cancelar</button><button class="primary">Guardar</button></div>`, (form) => {
    wireStep($('.pstep', form), D, draw);
    $('[data-close]', form).onclick = () => sheet.close();
    form.onsubmit = () => {
      if (!String(D.driver).trim()) { toast('Escribe tu nombre'); return false; }
      data.settings = D;
      sheet.close();
      refresh();
      toast('Perfil guardado');
    };
  });
}

// ---------- Botón + ----------
// Cotizar, agendar o agregar cliente. En la ficha de un cliente, ya viene elegido.
// El + abre Cotizar directo (un toque menos); desde ahí se manda el precio, se agenda o se crea un cliente.
function plusMenu() {
  const [, mod = '', id = ''] = (location.hash || '#/').slice(1).split('/');
  quoteForm(mod === 'cliente' && client(id) ? { clientId: id } : {});
}

// ---------- Formularios ----------
function openSheet(html, bind) {
  sheet.innerHTML = `<form method="dialog">${html}</form>`;
  const form = $('form', sheet);
  bind(form);
  sheet.showModal();
}
const field = (label, input, wide = false) => `<label class="field ${wide ? 'wide' : ''}">${label}${input}</label>`;
const buttons = (canDelete) => `<div class="buttons">${canDelete ? '<button type="button" class="left" data-del>Eliminar</button>' : ''}<button type="button" data-close>Cancelar</button><button class="primary">Guardar</button></div>`;
function wireCommon(form, onDelete) {
  $('[data-close]', form).onclick = () => sheet.close();
  const del = $('[data-del]', form);
  if (del) del.onclick = () => { if (confirm('¿Eliminar?')) { onDelete(); sheet.close(); refresh(); } };
}

function clientForm(c = null, { onSaved } = {}) {
  const chain = !c && !onSaved;
  const openMore = !!(c && ((c.services || []).length || c.notes));
  openSheet(`<h2>${c ? 'Editar cliente' : 'Nuevo cliente'}</h2>
    ${!c && 'contacts' in navigator ? '<button type="button" class="add wide" data-pick>Elegir de mis contactos</button>' : ''}
    ${field('Nombre', `<input name="name" required value="${esc(c?.name)}" placeholder="Ej. Sra. Laura">`, true)}
    ${field('Teléfono (WhatsApp)', `<input name="phone" type="tel" inputmode="tel" value="${esc(c?.phone)}" placeholder="10 dígitos">`, true)}
    <details class="opts" ${openMore ? 'open' : ''}><summary>Servicios frecuentes y notas <small>opcional · se aprenden solos con los viajes</small></summary><div>
      <div class="sec wide"><b>Servicios frecuentes</b><small>precio con tu tarifa</small></div>
      <div class="wide svcs" id="svcs"></div>
      <button type="button" class="add wide" data-addsvc>＋ Agregar servicio frecuente</button>
      ${field('Notas', `<textarea name="notes" rows="2" placeholder="Ej. Viaja con su perrito, paga por transferencia">${esc(c?.notes)}</textarea>`, true)}
    </div></details>
    <div class="buttons">${c ? '<button type="button" class="left" data-del>Eliminar</button>' : ''}<button type="button" data-close>Cancelar</button>${chain ? '<button>Solo guardar</button><button type="button" class="primary" data-savego>Guardar y agendar viaje</button>' : '<button class="primary">Guardar</button>'}</div>`, (form) => {
    wireCommon(form, () => {
      data.clients = data.clients.filter((x) => x.id !== c.id);
      data.trips = data.trips.filter((t) => t.clientId !== c.id);
      location.hash = '#/clientes';
    });
    if (c && tripsOf(c.id).length) $('[data-del]', form).onclick = () => {
      if (!confirm(`¿Eliminar a ${c.name} y sus ${tripsOf(c.id).length} viajes?`)) return;
      data.clients = data.clients.filter((x) => x.id !== c.id);
      data.trips = data.trips.filter((t) => t.clientId !== c.id);
      sheet.close();
      location.hash = '#/clientes';
      refresh();
    };
    $('[data-pick]', form)?.addEventListener('click', async () => {
      try {
        const [p] = await navigator.contacts.select(['name', 'tel'], { multiple: false });
        if (!p) return;
        if (p.name?.[0]) form.elements.name.value = p.name[0].trim();
        if (p.tel?.[0]) form.elements.phone.value = p.tel[0].trim();
      } catch { toast('No se pudieron leer los contactos'); }
    });
    const svcs = structuredClone(c?.services || []);
    const box = $('#svcs', form);
    const drawSvcs = () => {
      box.innerHTML = '';
      svcs.forEach((sv) => box.append(serviceCard(sv, () => { svcs.splice(svcs.indexOf(sv), 1); drawSvcs(); }, () => client(c?.id))));
    };
    drawSvcs();
    $('[data-addsvc]', form).onclick = () => {
      const home = svcs[0]?.a || null;
      svcs.push({ id: uid(), name: '', a: home, b: null, price: null });
      drawSvcs();
      box.lastElementChild.querySelector(home ? '[data-pt=b]' : '[data-pt=a]').focus();
    };
    const doSave = (thenTrip) => {
      const f = new FormData(form);
      const x = { ...(c || { id: uid(), createdAt: Date.now() }), updatedAt: Date.now() };
      for (const k of ['name', 'phone', 'notes']) x[k] = f.get(k).trim();
      x.services = svcs.filter((sv) => sv.b || sv.name).map((sv) => ({ ...sv, name: sv.name || autoName(sv) }));
      if (c) Object.assign(c, x);
      else data.clients.push(x);
      sheet.close();
      if (onSaved) onSaved(x);
      else if (!c) location.hash = `#/cliente/${x.id}`;
      refresh();
      if (thenTrip) tripForm(null, { clientId: x.id });
      else toast('Guardado');
    };
    form.onsubmit = () => doSave(false);
    const go = $('[data-savego]', form);
    if (go) go.onclick = () => { if (form.reportValidity()) doSave(true); };
  });
}


// ---------- Punto A y punto B ----------
// Lugares ya usados (servicios y viajes) aparecen primero, sin internet.
const { knownPlaces, nearPoint, placeInput, usualFrom, wirePlace, setPlace, placeBar, fillRoute, stopsField } = createPlaceFields({
  getData: () => data, client, tripsOf, byWhen, esc, icon, fold, searchPlaces, reverse, parseMapLink, route,
  directionsLink, mapSvg, money, suggestPrice, isAirport, priceMath, save,
});

const serviceCard = createServiceCard({
  placeInput, wirePlace, fillRoute, stopsField, placeBar, $, esc, suggestPrice, svcCtx, autoName, mapSvg, money, priceMath, directionsLink,
});

// Atajos de fecha y hora (Ahora · Hoy · Mañana).
const whenHtml = '<div class="chips wide" data-when><button type="button" data-w="now">Ahora</button><button type="button" data-w="0">Hoy</button><button type="button" data-w="1">Mañana</button></div>';
const { wireWhen, lastUse, tripToast, learnOffer, quickTrip } = createTripActions({
  getData: () => data, today, addDays, tripsOf, client, toast, waLink, MSG, uid, autoName, refresh,
  firstName, tripForm, openSheet, esc, money, field, whenHtml, $, sheet,
});

function tripForm(t = null, preset = {}) {
  const v = { date: today(), status: 'agendado', pay: '', ...preset, ...(t || {}) };
  if (!v.clientId && data.clients.length === 1) v.clientId = data.clients[0].id;
  openSheet(`<h2>${t ? 'Editar viaje' : 'Nuevo viaje'}</h2>
    <div class="field wide">Cliente<div class="chips wrap" id="cchips"></div>${data.clients.length > 5 ? '<input data-cq type="search" placeholder="Buscar otro cliente" autocomplete="off" aria-label="Buscar cliente">' : ''}</div>
    <input type="hidden" name="clientId" value="${esc(v.clientId)}">
    ${field('Fecha', `<input name="date" type="date" required value="${esc(v.date)}">`)}
    ${field('Hora', `<input name="time" type="time" value="${esc(v.time)}">`)}
    ${whenHtml}
    <small class="wide clash" id="clash" hidden></small>
    <div class="chips wide" id="svcchips"></div>
    <div class="route wide">${placeInput(v.fromPt || (v.from ? { label: v.from } : null), 'a', 'Punto A · origen', true)}${placeInput(v.toPt || (v.to ? { label: v.to } : null), 'b', 'Punto B · destino')}</div>
    <small class="field wide muted" id="pnote"></small>
    <div class="wide svc" id="troute" hidden></div>
    ${field('Precio', `<input name="price" type="number" inputmode="decimal" step="1" min="0" required value="${esc(v.price)}">`, true)}
    <small class="field wide muted" id="hint"></small>
    <details class="opts" ${t ? 'open' : ''}><summary>Más opciones <small>km, espera, estado, notas</small></summary><div>
      ${field('Km', `<input name="km" type="number" inputmode="decimal" step="0.1" min="0" value="${esc(v.km)}">`)}
      ${data.settings.extra?.wait?.on ? field('Espera (min)', `<input name="wait" type="number" inputmode="numeric" min="0" step="5" value="${esc(v.wait)}">`) : ''}
      <span class="field wide">Estado</span>${seg('status', [['agendado', 'Agendado'], ['hecho', 'Hecho'], ['cancelado', 'Cancelado']], v.status)}
      <div class="wide" id="paybox" style="grid-column:1/-1;display:grid;gap:6px"><span class="field">Pago</span>${seg('pay', PAYS, v.pay || '')}</div>
      ${field('Notas', `<textarea name="notes" rows="2">${esc(v.notes)}</textarea>`, true)}
    </div></details>
    ${buttons(!!t)}`, (form) => {
    wireCommon(form, () => { data.trips = data.trips.filter((x) => x.id !== t.id); });
    const els = form.elements;
    const idIn = els.clientId;
    const hint = $('#hint', form);
    const paybox = $('#paybox', form);
    let priceTyped = !!t;
    els.price.addEventListener('input', () => { priceTyped = true; });
    const fromIn = $('[data-pt=a]', form);
    const toIn = $('[data-pt=b]', form);
    const rt = { fromPt: v.fromPt || null, toPt: v.toPt || null, min: v.min || '', path: v.path || null };
    const routeEl = $('#troute', form);
    const suggest = () => {
      const same = data.trips.filter((x) => x.clientId === idIn.value && x.id !== t?.id && x.status !== 'cancelado' && x.from === fromIn.value.trim() && x.to === toIn.value.trim() && (x.from || x.to)).sort(byWhen).pop();
      const km = +els.km.value;
      const min = +rt.min || Math.round(km * 2);
      const ctx = { airport: isAirport(fromIn.value, toIn.value), night: isNight(els.time.value), wait: +(els.wait?.value || 0) };
      const tips = [];
      if (same) tips.push(`La última vez: ${money(same.price)}`);
      if (km) tips.push(`Con tu tarifa: ${money(suggestPrice(km, min, ctx))} (${priceMath(km, min, ctx)})`);
      hint.textContent = tips.join(' · ');
      if (!priceTyped && (same || km)) els.price.value = same ? same.price : suggestPrice(km, min, ctx);
      checkClash();
    };
    // Dos viajes a la misma hora: avisa y pide confirmar (el segundo toque en «Agendar igual» lo guarda).
    const clashBox = $('#clash', form);
    const saveBtn = form.querySelector('button.primary');
    let clashSig = '', clashAck = false;
    const clashList = () => { const x = { id: t?.id, ...readForm() }; return clashes(data.trips, x); };
    const checkClash = () => {
      const list = clashList();
      const sig = list.map((o) => o.id).join();
      if (sig !== clashSig) { clashSig = sig; clashAck = false; saveBtn.textContent = 'Guardar'; }
      clashBox.hidden = !list.length;
      clashBox.textContent = list.length ? `⚠ ${clashLine(list, (id) => client(id)?.name || 'otro cliente')} Cambia la hora o agéndalo igual.` : '';
    };
    form.querySelectorAll('[name=status]').forEach((r) => r.addEventListener('change', checkClash));
    const checkPlaces = () => {
      const bad = (fromIn.value.trim() && !rt.fromPt) || (toIn.value.trim() && !rt.toPt) || st.bad();
      $('#pnote', form).textContent = bad ? 'Toca una opción de la lista para calcular ruta y precio, o escribe el precio a mano.' : '';
    };
    [fromIn, toIn].forEach((i) => i.addEventListener('blur', () => setTimeout(checkPlaces, 300)));
    const recalc = async () => {
      routeEl.hidden = !(rt.fromPt && rt.toPt) || st.bad();
      if (routeEl.hidden) { rt.min = ''; rt.path = null; return; }
      const r = await fillRoute(routeEl, rt.fromPt, rt.toPt, st.get());
      if (r) { els.km.value = r.km; rt.min = r.min; rt.path = r.path; suggest(); }
    };
    const cid = () => idIn.value;
    const st = stopsField($('.route', form), { clientId: cid, initial: v.stops || [], onChange: () => { recalc(); suggest(); checkPlaces(); } });
    wirePlace(fromIn, cid, (p, typing) => { rt.fromPt = p; if (!typing || !p) { recalc(); suggest(); checkPlaces(); } }, rt.fromPt);
    wirePlace(toIn, cid, (p, typing) => { rt.toPt = p; if (!typing || !p) { recalc(); suggest(); checkPlaces(); } }, rt.toPt);
    placeBar($('.route', form), cid);
    if (rt.fromPt && rt.toPt) {
      routeEl.hidden = false;
      if (rt.path) routeEl.innerHTML = `${mapSvg(rt.path, 'Ruta', st.get())}<div class="how">${els.km.value} km · ${rt.min} min · <a href="${directionsLink(rt.fromPt, rt.toPt, st.get())}" target="_blank" rel="noopener">Ver en Google Maps</a></div>`;
      else recalc();
    }
    // Origen: el habitual del cliente, mientras no lo cambies a mano.
    let autoFrom = '';
    const prefillFrom = () => {
      if (t || (fromIn.value.trim() && fromIn.value !== autoFrom)) return;
      const p = usualFrom(idIn.value);
      if (!p) return;
      fromIn.value = autoFrom = p.label;
      rt.fromPt = cleanPt(p);
      setPlace(fromIn, rt.fromPt);
      recalc(); suggest();
    };
    // Mi ubicación como punto A.
    $('[data-loc]', form).onclick = () => {
      if (!navigator.geolocation) return toast('Tu teléfono no comparte la ubicación');
      toast('Buscando tu ubicación…');
      navigator.geolocation.getCurrentPosition(async ({ coords: { latitude: lat, longitude: lon } }) => {
        let p;
        try { const r = await reverse(lat, lon); p = { label: r.label, lat, lon }; } catch { p = { label: 'Mi ubicación', lat, lon }; }
        autoFrom = ''; rt.fromPt = p; setPlace(fromIn, p);
        recalc(); suggest(); checkPlaces();
      }, () => toast('No se pudo obtener tu ubicación'), { enableHighAccuracy: true, timeout: 10000 });
    };
    // Servicios frecuentes del cliente: un toque llena A, B y precio.
    const fillPlaces = () => {
      const svs = client(idIn.value)?.services || [];
      const chips = $('#svcchips', form);
      chips.innerHTML = svs.map((sv) => `<button type="button" data-sv="${sv.id}">${esc(sv.name || autoName(sv))}</button>`).join('');
      chips.hidden = !svs.length;
      chips.querySelectorAll('[data-sv]').forEach((b) => (b.onclick = () => {
        const sv = svs.find((x) => x.id === b.dataset.sv);
        const f = fromService(client(idIn.value), sv);
        fromIn.value = f.from; toIn.value = f.to; autoFrom = '';
        Object.assign(rt, { fromPt: f.fromPt, toPt: f.toPt, min: f.min, path: f.path });
        setPlace(fromIn, f.fromPt); setPlace(toIn, f.toPt);
        st.set(f.stops);
        els.km.value = f.km; els.price.value = f.price; priceTyped = true;
        chips.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
        routeEl.hidden = !(f.fromPt && f.toPt);
        if (f.path) routeEl.innerHTML = `${mapSvg(f.path, 'Ruta', f.stops)}<div class="how">${f.km} km · ${f.min} min · <a href="${directionsLink(f.fromPt, f.toPt, f.stops)}" target="_blank" rel="noopener">Ver en Google Maps</a></div>`;
        hint.textContent = `Servicio frecuente: ${money(f.price)}`;
        checkPlaces();
      }));
    };
    // Cliente: los más recientes a un toque; con muchos clientes, buscador.
    const cchips = $('#cchips', form);
    const cq = $('[data-cq]', form);
    const drawClients = () => {
      const q = fold(cq?.value || '').trim();
      let list = q
        ? data.clients.filter((c) => fold(c.name + ' ' + (c.phone || '')).includes(q)).slice(0, 8)
        : [...data.clients].sort((a, b) => lastUse(b.id) - lastUse(a.id) || a.name.localeCompare(b.name, 'es')).slice(0, 5);
      const cur = client(idIn.value);
      if (cur && !q && !list.includes(cur)) list = [cur, ...list];
      cchips.innerHTML = list.map((c) => `<button type="button" data-c="${c.id}" class="${c.id === idIn.value ? 'on' : ''}">${esc(c.name)}</button>`).join('') + '<button type="button" data-newc>＋ Nuevo</button>';
    };
    const setClient = (id) => {
      idIn.value = id;
      if (cq) cq.value = '';
      drawClients(); fillPlaces(); prefillFrom(); suggest();
    };
    cchips.onclick = (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.newc) clientForm(null, { onSaved: (c) => tripForm(null, { ...readForm(), clientId: c.id }) });
      else setClient(b.dataset.c);
    };
    cq?.addEventListener('input', drawClients);
    const showPay = () => { paybox.hidden = form.querySelector('[name=status]:checked').value !== 'hecho'; };
    form.querySelectorAll('[name=status]').forEach((r) => (r.onchange = showPay));
    els.km.addEventListener('input', () => { rt.min = ''; suggest(); });
    els.time.addEventListener('input', suggest);
    els.wait?.addEventListener('input', suggest);
    wireWhen(form, suggest);
    drawClients(); fillPlaces(); prefillFrom(); suggest(); showPay();
    function readForm() {
      const f = new FormData(form);
      return {
        clientId: f.get('clientId'), date: f.get('date'), time: f.get('time') || '',
        from: fromIn.value.trim(), to: toIn.value.trim(), fromPt: rt.fromPt, toPt: rt.toPt, stops: st.get(), km: f.get('km'), min: rt.min, path: rt.path, wait: f.get('wait') || '',
        price: +f.get('price') || 0,
        status: f.get('status'), pay: f.get('status') === 'hecho' ? f.get('pay') || '' : '', notes: f.get('notes').trim(),
      };
    }
    form.onsubmit = (e) => {
      const x = { ...(t || { id: uid(), createdAt: Date.now() }), ...readForm(), updatedAt: Date.now() };
      if (!client(x.clientId)) { e.preventDefault(); toast('Elige un cliente'); return; }
      if (clashList().length && !clashAck) { e.preventDefault(); clashAck = true; saveBtn.textContent = 'Agendar igual'; clashBox.scrollIntoView({ block: 'nearest' }); return; }
      if (t) Object.assign(t, x);
      else data.trips.push(x);
      sheet.close();
      refresh();
      tripToast(x, !t);
    };
  });
  // Sin clientes: primero se crea uno y luego se agenda su viaje.
  if (!data.clients.length) { sheet.close(); clientForm(null, { onSaved: (c) => tripForm(null, { ...preset, clientId: c.id }) }); }
}

// ---------- Cotizar ----------
// Te escriben manejando: de, a y listo. El precio sale con tu tarifa y se manda por WhatsApp sin agendar.
function quoteForm(preset = {}) {
  openSheet(`<h2>Cotizar</h2>
    <div class="wide para"><span class="eti">Para · opcional</span><div class="chips wrap" id="qchips"></div><div class="chips wrap" id="qsvc" hidden></div></div>
    <input type="hidden" name="clientId" value="${esc(preset.clientId || '')}">
    <div class="route wide">${placeInput(null, 'a', 'De dónde', true)}${placeInput(null, 'b', 'A dónde')}</div>
    <small class="field wide muted" id="pnote"></small>
    <div class="wide svc" id="troute" hidden></div>
    <input type="hidden" name="date" value="${today()}">
    <div class="wide cuando">${whenHtml}<input name="time" type="time" aria-label="Hora"></div>
    <div class="cotiza wide"><span class="eti">Precio con tu tarifa</span>
      <label class="precio"><span>$</span><input name="price" type="number" inputmode="numeric" min="0" step="10" placeholder="0" aria-label="Precio"></label>
      <div id="qcalc" class="muted"></div></div>
    <button type="button" class="primary wide grande" data-send>${icon('wa')} Mandar precio por WhatsApp</button>
    <button type="button" class="wide grande" data-book>Agendar este viaje</button>
    <button type="button" class="wide ghost" data-close>Cerrar</button>`, (form) => {
    form.classList.add('qform');
    const els = form.elements;
    const fromIn = $('[data-pt=a]', form);
    const toIn = $('[data-pt=b]', form);
    const routeEl = $('#troute', form);
    const rt = { fromPt: null, toPt: null, km: '', min: '', path: null };
    let typed = false;
    els.price.addEventListener('input', () => { typed = true; });
    $('[data-close]', form).onclick = () => sheet.close();
    const cur = () => client(els.clientId.value);
    const read = () => ({ clientId: els.clientId.value, from: fromIn.value.trim(), to: toIn.value.trim(), fromPt: rt.fromPt, toPt: rt.toPt, stops: st.get(), km: rt.km, min: rt.min, path: rt.path, price: +els.price.value || 0, date: els.date.value || today(), time: els.time.value || '' });
    const suggest = () => {
      const ctx = { airport: isAirport(fromIn.value, toIn.value), night: isNight(els.time.value) };
      const same = cur() && data.trips.filter((x) => x.clientId === cur().id && x.status !== 'cancelado' && x.from === fromIn.value.trim() && x.to === toIn.value.trim() && (x.from || x.to)).sort(byWhen).pop();
      const q = rt.km ? quote(+rt.km, +rt.min || Math.round(rt.km * 2), ctx) : null;
      $('#qcalc', form).innerHTML = (q ? calcTable(q) : '<small>Elige de dónde y a dónde para calcular, o escribe el precio.</small>') + (same ? `<small>La última vez le cobraste ${money(same.price)}.</small>` : '');
      if (!typed && q) els.price.value = q.total;
    };
    const recalc = async () => {
      routeEl.hidden = !(rt.fromPt && rt.toPt) || st.bad();
      if (routeEl.hidden) { Object.assign(rt, { km: '', min: '', path: null }); suggest(); return; }
      const r = await fillRoute(routeEl, rt.fromPt, rt.toPt, st.get());
      if (r) Object.assign(rt, { km: r.km, min: r.min, path: r.path });
      suggest();
    };
    const checkPlaces = () => {
      const bad = (fromIn.value.trim() && !rt.fromPt) || (toIn.value.trim() && !rt.toPt) || st.bad();
      $('#pnote', form).textContent = bad ? 'Toca una opción de la lista para calcular, o escribe el precio a mano.' : '';
    };
    [fromIn, toIn].forEach((i) => i.addEventListener('blur', () => setTimeout(checkPlaces, 300)));
    const st = stopsField($('.route', form), { clientId: () => els.clientId.value, onChange: () => { recalc(); checkPlaces(); } });
    wirePlace(fromIn, () => els.clientId.value, (p, typing) => { rt.fromPt = p; if (!typing || !p) { recalc(); checkPlaces(); } });
    wirePlace(toIn, () => els.clientId.value, (p, typing) => { rt.toPt = p; if (!typing || !p) { recalc(); checkPlaces(); } });
    placeBar($('.route', form), () => els.clientId.value);
    $('[data-loc]', form).onclick = () => {
      if (!navigator.geolocation) return toast('Tu teléfono no comparte la ubicación');
      toast('Buscando tu ubicación…');
      navigator.geolocation.getCurrentPosition(async ({ coords: { latitude: lat, longitude: lon } }) => {
        let p;
        try { const r = await reverse(lat, lon); p = { label: r.label, lat, lon }; } catch { p = { label: 'Mi ubicación', lat, lon }; }
        rt.fromPt = p; setPlace(fromIn, p);
        recalc(); checkPlaces();
      }, () => toast('No se pudo obtener tu ubicación'), { enableHighAccuracy: true, timeout: 10000 });
    };
    // Clientes recientes (opcional). Al elegir uno sale su origen de siempre.
    const qchips = $('#qchips', form);
    const drawClients = () => {
      const list = [...data.clients].sort((a, b) => lastUse(b.id) - lastUse(a.id) || a.name.localeCompare(b.name, 'es')).slice(0, 5);
      if (cur() && !list.includes(cur())) list.unshift(cur());
      const chips = list.map((c) => `<button type="button" data-c="${c.id}" class="${c.id === els.clientId.value ? 'on' : ''}">${esc(c.name)}</button>`).join('');
      qchips.innerHTML = (chips || '<small class="muted">Aún no tienes clientes: igual puedes cotizar.</small>') + '<button type="button" data-newc>＋ Nuevo</button>';
    };
    qchips.onclick = (e) => {
      if (e.target.closest('[data-newc]')) { clientForm(null, { onSaved: (c) => quoteForm({ clientId: c.id }) }); return; }
      const b = e.target.closest('[data-c]');
      if (!b) return;
      els.clientId.value = els.clientId.value === b.dataset.c ? '' : b.dataset.c;
      drawClients();
      drawServices();
      prefillFrom();
    };
    // Sus viajes de siempre: un toque llena de dónde, a dónde y el precio.
    const qsvc = $('#qsvc', form);
    function drawServices() {
      const svs = cur()?.services || [];
      qsvc.hidden = !svs.length;
      qsvc.innerHTML = svs.map((sv) => `<button type="button" data-sv="${sv.id}">${esc(sv.name || autoName(sv))} · ${money(svcPrice(sv))}</button>`).join('');
    }
    qsvc.onclick = (e) => {
      const b = e.target.closest('[data-sv]');
      if (!b) return;
      const f = fromService(cur(), cur().services.find((x) => x.id === b.dataset.sv));
      fromIn.value = f.from; toIn.value = f.to;
      Object.assign(rt, { fromPt: f.fromPt, toPt: f.toPt, km: f.km, min: f.min, path: f.path });
      setPlace(fromIn, f.fromPt); setPlace(toIn, f.toPt);
      st.set(f.stops);
      els.price.value = f.price; typed = true;
      qsvc.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      routeEl.hidden = !(f.fromPt && f.toPt && f.path);
      if (!routeEl.hidden) routeEl.innerHTML = `${mapSvg(f.path, 'Ruta', f.stops)}<div class="stats"><div><small>Distancia</small><b>${f.km} km</b></div><div><small>Tiempo</small><b>${f.min} min</b></div></div>`;
      $('#qcalc', form).innerHTML = '<small>Precio de su viaje de siempre.</small>';
      checkPlaces();
    };
    function prefillFrom() {
      const p = cur() && usualFrom(cur().id);
      if (p && !fromIn.value.trim()) { rt.fromPt = cleanPt(p); setPlace(fromIn, rt.fromPt); fromIn.value = p.label; recalc(); }
      else suggest();
    }
    els.time.addEventListener('input', suggest);
    wireWhen(form, suggest);
    $('[data-send]', form).onclick = () => {
      const t = read();
      if (!t.price) { toast('Pon el precio'); els.price.focus(); return; }
      const c = cur();
      const text = MSG.quote(c, t);
      window.open(c?.phone ? waLink(c, text) : `https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    };
    $('[data-book]', form).onclick = () => { const t = read(); sheet.close(); tripForm(null, { ...t, price: t.price || '' }); };
    drawClients();
    drawServices();
    prefillFrom();
  });
}

// ---------- Cobro en un toque ----------
// Terminar un viaje: un toque en cómo te pagó y listo.
const { finishTrip, finishForm, payForm, collectForm } = createPaymentHandlers({
  client, openSheet, esc, money, payGrid, $, sheet, refresh, learnOffer, toast, today,
  tripsOf, owed, byWhen, firstName, cap, fdate, hour12, shortRoute, field, debtOf,
});

const renderCharges = createChargesView({
  getData: () => data, view, header, setTabs, tripsOf, owed, lateDebt, byWhen, money, icon,
  esc, waLink, MSG, cap, fdate, dayLabel, daysBetween, today, bindTrips, $, collectForm, client, shortRoute,
});

const renderClient = createClientDetailView({
  client, header, top, icon, esc, $, clientForm, setTabs, tripsOf, byWhen, debtOf, lateDebt, owed, tripForm,
  view, initials, firstName, phoneIntl, waLink, MSG, weekSummary, money, dayLabel, hour12, cap, autoName,
  svcPrice, sleeping, weekForm, collectForm, quickTrip, repeatTrip, fromService, bindTrips,
});

// ---------- Inicio ----------
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

// ---------- Semana completa ----------
function daysLabel(days) {
  const set = WEEK_ORDER.filter((d) => days.includes(d));
  if (set.length === 7) return 'todos los días';
  if (set.join() === '1,2,3,4,5') return 'L–V';
  if (set.join() === '1,2,3,4,5,6') return 'L–S';
  return set.map((d) => DAYS.find((x) => x[0] === d)[1]).join(' ');
}
// Clientes con rutina semanal cuya próxima semana aún no está agendada (se avisa de jueves a domingo).
function weekNudges() {
  const dn = new Date().getDay();
  if (!(dn === 0 || dn >= 4)) return [];
  const next = addDays(mondayOf(today()), 7);
  return data.clients
    .filter((c) => c.week?.items?.length && c.weekSnooze !== next && !tripsOf(c.id).some((t) => t.status !== 'cancelado' && t.date >= next && t.date <= addDays(next, 6)))
    .map((c) => ({ c, next }));
}
// Viajes que se pueden poner en la rutina: sus servicios o, si no tiene, las rutas que ya hizo.
function weekCandidates(c) {
  if ((c.services || []).length) return c.services.map((sv) => ({ key: sv.id, label: sv.name || autoName(sv), time: '', ...fromService(c, sv) }));
  const seen = new Map();
  tripsOf(c.id).filter((t) => t.status === 'hecho' && (t.from || t.to)).sort(byWhen).reverse().forEach((t) => {
    const key = `${t.from}|${t.to}`;
    if (!seen.has(key) && seen.size < 6) seen.set(key, { key, label: shortRoute(t.from, t.to), time: t.time || '', clientId: c.id, from: t.from, to: t.to, fromPt: t.fromPt, toPt: t.toPt, stops: t.stops || [], km: t.km, min: t.min, path: t.path, price: t.price });
  });
  return [...seen.values()];
}
function weekForm(c, { start } = {}) {
  const cands = weekCandidates(c);
  if (!cands.length) { toast('Primero agrega un servicio frecuente'); clientForm(c); return; }
  const saved = c.week || {};
  const dn = new Date().getDay();
  const defStart = start || (dn === 0 || dn >= 4 ? 'next' : 'this');
  const days = new Set(saved.days || [1, 2, 3, 4, 5, 6]);
  const pick = (x) => (saved.items ? saved.items.find((i) => i.key === x.key) : { time: x.time });
  openSheet(`<h2>Agendar semana · ${esc(firstName(c))}</h2>
    <span class="field wide">Viajes de cada día <small>marca y pon la hora</small></span>
    <div class="wide picks">${cands.map((x, i) => `<div class="pick"><label><input type="checkbox" data-i="${i}" ${pick(x) ? 'checked' : ''}><span><b>${esc(x.label)}</b><small>${money(x.price)}</small></span></label><input type="time" data-t="${i}" value="${esc(pick(x)?.time || '')}" aria-label="Hora"></div>`).join('')}</div>
    <span class="field wide">Días</span>
    <div class="chips wide" id="wdays">${DAYS.map(([d, l]) => `<button type="button" data-day="${d}" class="${days.has(d) ? 'on' : ''}">${l}</button>`).join('')}</div>
    <span class="field wide">Empezar</span>${seg('start', [['this', 'Esta semana'], ['next', 'La próxima']], defStart)}
    <span class="field wide">Semanas</span>${seg('weeks', [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']], '1')}
    <p class="wide total" id="wsum"></p>
    <div class="buttons"><button type="button" data-close>Cancelar</button><button class="primary">Agendar</button></div>`, (form) => {
    $('[data-close]', form).onclick = () => sheet.close();
    const checks = [...form.querySelectorAll('[data-i]')];
    const times = [...form.querySelectorAll('[data-t]')];
    const plan = () => {
      const items = cands.map((x, i) => ({ x, on: checks[i].checked, time: times[i].value })).filter((i) => i.on);
      const mon = mondayOf(today());
      const base = form.querySelector('[name=start]:checked').value === 'next' ? addDays(mon, 7) : mon;
      const weeks = +form.querySelector('[name=weeks]:checked').value;
      const all = [];
      for (let w = 0; w < weeks; w++) {
        for (const d of WEEK_ORDER) {
          if (!days.has(d)) continue;
          const date = addDays(base, w * 7 + ((d + 6) % 7));
          if (date < today()) continue;
          for (const { x, time } of items) all.push({ clientId: c.id, date, time, from: x.from, to: x.to, fromPt: x.fromPt, toPt: x.toPt, stops: x.stops || [], km: x.km, min: x.min, path: x.path, price: x.price });
        }
      }
      const exists = (o) => data.trips.some((t) => t.clientId === c.id && t.status !== 'cancelado' && t.date === o.date && (t.time || '') === (o.time || '') && t.from === o.from && t.to === o.to);
      const fresh = all.filter((o) => !exists(o));
      return { items, fresh, dup: all.length - fresh.length };
    };
    const sum = () => {
      const { fresh, dup } = plan();
      const hit = fresh.filter((o) => clashes(data.trips, o).length).length;
      $('#wsum', form).textContent = fresh.length
        ? `${fresh.length} viaje${fresh.length === 1 ? '' : 's'} · ${money(fresh.reduce((s, o) => s + +o.price, 0))}${dup ? ` · ${dup} ya estaban agendados` : ''}${hit ? ` · ⚠ ${hit} chocan con otro viaje` : ''}`
        : dup ? 'Todo eso ya está agendado' : 'Marca al menos un viaje y un día';
    };
    form.querySelectorAll('#wdays button').forEach((b) => (b.onclick = () => {
      const d = +b.dataset.day;
      if (days.has(d)) days.delete(d); else days.add(d);
      b.classList.toggle('on', days.has(d));
      sum();
    }));
    form.addEventListener('input', sum);
    form.addEventListener('change', sum);
    sum();
    form.onsubmit = (e) => {
      const { items, fresh } = plan();
      if (!fresh.length) { e.preventDefault(); toast('No hay viajes nuevos que agendar'); return; }
      const made = fresh.sort(byWhen).map((o) => ({ id: uid(), createdAt: Date.now(), updatedAt: Date.now(), status: 'agendado', pay: '', notes: '', wait: '', ...o }));
      data.trips.push(...made);
      c.week = { days: WEEK_ORDER.filter((d) => days.has(d)), items: items.map((i) => ({ key: i.x.key, time: i.time })) };
      sheet.close();
      refresh();
      toast(`${made.length} viaje${made.length === 1 ? '' : 's'} agendados`, c.phone ? { label: 'Avisar por WhatsApp', fn: () => window.open(waLink(c, MSG.week(c, made)), '_blank', 'noopener') } : undefined);
    };
  });
}

// ---------- Cobrar a tu ritmo ----------
// Marcas qué viajes te pagó (o escribes cuánto te dio y se marcan los más antiguos).
// ---------- Mi tarjeta (QR) ----------
// El enlace lleva dentro solo lo que elegiste mostrar; tarjeta.html lo lee sin servidor.
async function cardUrl() {
  const u = new URL('tarjeta.html', location.href);
  u.hash = await encodePage(buildPagePayload(data.settings, phoneIntl));
  return u.href;
}
const renderCard = createCardView({
  getData: () => data, view, icon, esc, $, toast, cardUrl, qrSvg, openSettings: () => cardSettings(),
});
// Qué se ve en mi tarjeta: auto, precios de referencia, datos para transferencia y horario.
function cardSettings() {
  const s = data.settings;
  const o = s.share;
  const hasBank = s.pays.includes('Transferencia') && !!s.clabe;
  openSheet(`<h2>Qué se ve en mi tarjeta</h2>
    <p class="wide muted" style="margin:0;font-size:13px">Siempre: tu nombre y tu WhatsApp. Lo demás, solo si lo prendes. Las placas nunca.</p>
    ${s.car ? `<label class="sw wide"><input type="checkbox" data-o="auto" ${o.auto ? 'checked' : ''}><span>Mi auto<small>Modelo, año, color y pasajeros. Sin placas.</small></span></label>` : ''}
    <label class="sw wide"><input type="checkbox" data-o="routesOn" ${o.routesOn ? 'checked' : ''}><span>Precios de referencia<small>Tú escribes las rutas y el precio</small></span></label>
    <div class="wide" id="routes"></div>
    ${hasBank ? `<label class="sw wide"><input type="checkbox" data-o="clabe" ${o.clabe ? 'checked' : ''}><span>Datos para transferencia<small>${esc(s.bank || 'Banco')} · ${esc(s.clabe)}</small></span></label>
      <label class="field wide" id="holderbox">Nombre completo del titular<input class="plain" name="holder" value="${esc(s.holder)}" placeholder="Como aparece en tu cuenta" autocomplete="name"></label>`
      : '<p class="wide muted" style="margin:0;font-size:13px">Para mostrar tu CLABE, elige «Transferencia» y guárdala en <a href="#/yo" data-editpay>Cómo cobro</a>.</p>'}
    <label class="field wide">Horario <small>(opcional)</small><input class="plain" name="hours" value="${esc(o.hours)}" placeholder="Ej. Lun–Sáb, 6 am a 10 pm"></label>
    <div class="buttons"><button class="primary">Listo</button></div>`, (form) => {
    const routesBox = $('#routes', form);
    const drawRoutes = () => {
      if (o.routesOn && !o.routes.length) o.routes.push({ label: '', price: '' });
      routesBox.hidden = !o.routesOn;
      routesBox.innerHTML = o.routes.map((r, i) => `<div class="rrow"><input class="plain" data-rl="${i}" value="${esc(r.label)}" placeholder="Ej. Aeropuerto → Centro"><input class="plain" data-rp="${i}" type="number" inputmode="decimal" min="0" value="${esc(r.price)}" placeholder="$"><button type="button" data-rx="${i}" aria-label="Quitar">${icon('close')}</button></div>`).join('')
        + (o.routes.length < 8 ? '<button type="button" class="add" data-addroute>＋ Agregar ruta</button>' : '');
    };
    form.addEventListener('change', (e) => {
      const k = e.target.dataset.o;
      if (!k) return;
      o[k] = e.target.checked;
      if (k === 'routesOn') drawRoutes();
      save();
    });
    form.addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.rl != null) o.routes[+t.dataset.rl].label = t.value;
      else if (t.dataset.rp != null) o.routes[+t.dataset.rp].price = t.value;
      else if (t.name === 'holder') s.holder = t.value;
      else if (t.name === 'hours') o.hours = t.value;
      else return;
      save();
    });
    form.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.addroute != null) { o.routes.push({ label: '', price: '' }); drawRoutes(); routesBox.querySelector('.rrow:last-of-type input')?.focus(); }
      else if (b.dataset.rx != null) { o.routes.splice(+b.dataset.rx, 1); drawRoutes(); save(); }
    });
    $('[data-editpay]', form)?.addEventListener('click', (e) => { e.preventDefault(); sheet.close(); editProfile(4); });
    form.onsubmit = () => { save(); };
    sheet.addEventListener('close', () => { save(); refresh(); }, { once: true });
    drawRoutes();
  });
}

