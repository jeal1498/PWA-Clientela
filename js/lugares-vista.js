// Autocompletado de lugares, lugares con nombre, rutas frecuentes y cálculo de ruta entre A y B.
import { cleanPt } from './utilidades.js';
const STAR = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>';

export function createPlaceFields({ getData, client, tripsOf, byWhen, esc, icon, fold, searchPlaces, reverse, parseMapLink, route, directionsLink, mapSvg, money, suggestPrice, isAirport, priceMath, save }) {
  const cidOf = (clientId) => (typeof clientId === 'function' ? clientId() : clientId);
  // Lugares con nombre («Casa», «Trabajo»): los del cliente primero y luego los tuyos.
  // `label` es el nombre; `addr` la dirección real (la que ve el cliente en los mensajes).
  function savedFor(clientId) {
    const data = getData();
    const mine = (clientId && client(clientId)?.savedPlaces) || [];
    return [...mine, ...(data.settings.savedPlaces || [])].map((x) => ({ label: x.name, addr: x.addr, lat: x.lat, lon: x.lon, sub: x.addr }));
  }
  function knownPlaces(clientId) {
    const data = getData();
    const out = new Map();
    // Los puntos con nombre de un viaje viejo no se mezclan: cada cliente tiene su «Casa».
    const add = (p) => { if (p?.label && p.lat != null && !p.addr && !out.has(p.label)) out.set(p.label, p); };
    savedFor(clientId).forEach((p) => out.set(p.label, p));
    const cs = clientId ? [client(clientId)] : data.clients;
    cs.forEach((c) => (c?.services || []).forEach((sv) => { add(sv.a); add(sv.b); (sv.stops || []).forEach(add); }));
    data.trips.filter((t) => !clientId || t.clientId === clientId).forEach((t) => { add(t.fromPt); add(t.toPt); (t.stops || []).forEach(add); });
    if (clientId) knownPlaces().forEach((p) => { if (!out.has(p.label)) out.set(p.label, p); });
    return [...out.values()];
  }
  const nearPoint = () => knownPlaces()[0] || null;
  // Los que más usas (del cliente, o de todos si no hay uno elegido), sin nombre.
  function frequent(clientId, n = 4) {
    const data = getData();
    const seen = new Map();
    const bump = (p, w) => { if (p?.label && p.lat != null && !p.addr) { const e = seen.get(p.label) || { p, n: 0, last: 0 }; e.n += w; e.last = ++tick; seen.set(p.label, e); } };
    let tick = 0;
    const cs = clientId ? [client(clientId)] : data.clients;
    cs.forEach((c) => (c?.services || []).forEach((sv) => { bump(sv.a, 1); bump(sv.b, 1); }));
    data.trips.filter((t) => !clientId || t.clientId === clientId).filter((t) => t.status !== 'cancelado').sort(byWhen).forEach((t) => { bump(t.fromPt, 1); bump(t.toPt, 1); (t.stops || []).forEach((x) => bump(x, 1)); });
    return [...seen.values()].sort((a, b) => b.n - a.n || b.last - a.last).slice(0, n).map((e) => e.p);
  }

  function placeInput(pt, which, placeholder, locate = false) {
    return `<div class="stop ${locate ? 'has-loc' : ''}"><span class="dot ${which}"></span><input data-pt="${which}" value="${esc(pt?.label || '')}" placeholder="${placeholder}" autocomplete="off" enterkeyhint="search">${locate ? `<button type="button" class="loc" data-loc aria-label="Usar mi ubicación">${icon('pin')}</button>` : ''}</div>`;
  }
  // Origen habitual del cliente: el que más usa; si no hay viajes, el de su primer servicio.
  function usualFrom(id) {
    const c = client(id);
    if (!c) return null;
    const n = new Map();
    tripsOf(id).filter((x) => x.status !== 'cancelado' && x.fromPt?.label).sort(byWhen).forEach((x) => {
      const e = n.get(x.fromPt.label) || { p: x.fromPt, n: 0 };
      e.n++; e.p = x.fromPt; n.set(x.fromPt.label, e);
    });
    const best = [...n.values()].sort((a, b) => b.n - a.n)[0];
    return best?.p || (c.services || []).find((sv) => sv.a)?.a || null;
  }
  // El punto elegido vive en `input._pt` (y `input._onPick` avisa al formulario): así la estrella,
  // los botones de lugares y el ⇄ pueden cambiarlo desde fuera con setPlace().
  function setPlace(input, p) {
    input._pt = p || null;
    if (p) input.value = p.label;
    input._sync?.();
  }
  // Sugerencias al escribir; al elegir una, guarda el punto con sus coordenadas.
  function wirePlace(input, clientId, onPick, initial = null) {
    let timer, box, namer;
    const row = input.parentElement;
    input._pt = initial || null;
    input._onPick = onPick;
    const close = () => { box?.remove(); box = null; };
    const show = (items, note) => {
      close();
      if (!items.length && !note) return;
      box = document.createElement('div');
      box.className = 'sugg';
      box.innerHTML = items.map((p, i) => `<button type="button" data-i="${i}"><span>${esc(p.label)}</span><small>${esc(p.sub || 'Usado antes')}</small></button>`).join('') + (note ? `<div class="g">${note}</div>` : '');
      box.onpointerdown = (e) => e.preventDefault();
      box.onclick = (e) => {
        const b = e.target.closest('[data-i]');
        if (!b) return;
        const p = cleanPt(items[+b.dataset.i]);
        close();
        setPlace(input, p);
        onPick(p);
      };
      row.append(box);
    };
    // ☆ Ponerle nombre: «Casa», «Trabajo»… se guarda en el cliente (o en tus lugares si no hay cliente).
    const star = document.createElement('button');
    star.type = 'button'; star.className = 'star'; star.hidden = true;
    star.setAttribute('aria-label', 'Ponerle nombre a este lugar');
    star.innerHTML = STAR;
    row.append(star);
    const closeNamer = () => { namer?.remove(); namer = null; };
    input._sync = () => {
      const ok = !!(input._pt && input._pt.lat != null && !input._pt.addr);
      star.hidden = !ok;
      row.classList.toggle('has-star', ok);
      if (!ok) closeNamer();
    };
    const nameIt = (name) => {
      name = name.trim();
      const pt = input._pt;
      if (!name || !pt) return;
      const c = cidOf(clientId) ? client(cidOf(clientId)) : null;
      const list = c ? (c.savedPlaces ||= []) : (getData().settings.savedPlaces ||= []);
      const rec = { name, addr: pt.label, lat: pt.lat, lon: pt.lon };
      const i = list.findIndex((x) => fold(x.name) === fold(name));
      if (i >= 0) list[i] = rec; else list.push(rec);
      if (c) c.updatedAt = Date.now();
      save();
      const named = cleanPt({ label: name, addr: pt.label, lat: pt.lat, lon: pt.lon });
      closeNamer();
      setPlace(input, named);
      onPick(named);
      document.dispatchEvent(new CustomEvent('lugares-cambio'));
    };
    star.onclick = () => {
      if (namer) return closeNamer();
      const used = new Set(savedFor(cidOf(clientId)).map((x) => fold(x.label)));
      namer = document.createElement('div');
      namer.className = 'namer';
      namer.innerHTML = `<div class="chips">${['Casa', 'Trabajo', 'Escuela'].filter((n) => !used.has(fold(n))).map((n) => `<button type="button" data-n="${n}">${n}</button>`).join('')}<button type="button" data-otro aria-expanded="false">Otro</button></div>
        <div class="namerow" hidden><input placeholder="Nombre del lugar" maxlength="30" aria-label="Nombre del lugar" autocomplete="off"><button type="button" class="primary" data-ok>Guardar</button></div>`;
      row.append(namer);
      const ti = namer.querySelector('input');
      // El campo para escribir un nombre aparece solo al tocar «Otro».
      namer.onclick = (e) => {
        const b = e.target.closest('[data-n]');
        if (b) return nameIt(b.dataset.n);
        const o = e.target.closest('[data-otro]');
        if (!o) return;
        const row2 = namer.querySelector('.namerow');
        row2.hidden = false;
        o.classList.add('on'); o.setAttribute('aria-expanded', 'true');
        ti.focus();
      };
      namer.querySelector('[data-ok]').onclick = () => nameIt(ti.value);
      ti.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); nameIt(ti.value); } });
    };
    input._sync();
    input.addEventListener('input', () => {
      input._pt = null; input._sync();
      onPick(null, true);
      clearTimeout(timer);
      const q = input.value.trim();
      if (!q) return close();
      const link = parseMapLink(q);
      if (link) {
        if (link.unreadable) return show([], 'Ese enlace no trae la ubicación. Los cortos (maps.app.goo.gl) no se pueden leer: ábrelo en el navegador y pega el enlace largo, o pega las coordenadas.');
        const fallback = `Ubicación ${link.lat.toFixed(5)}, ${link.lon.toFixed(5)}`;
        const one = (label) => [{ label, sub: 'Del enlace pegado', lat: link.lat, lon: link.lon }];
        show(one(link.name || fallback), '');
        if (!link.name) reverse(link.lat, link.lon).then((r) => {
          if (input.value.trim() === q && document.activeElement === input) show(one(r.label || fallback), '');
        }).catch(() => {});
        return;
      }
      const words = fold(q).split(/\s+/);
      const local = knownPlaces(cidOf(clientId)).filter((p) => words.every((w) => fold(p.label + ' ' + (p.sub || '')).includes(w))).slice(0, 3);
      show(local, q.length >= 3 ? 'Buscando en el mapa…' : '');
      if (q.length < 3) return;
      timer = setTimeout(async () => {
        try {
          const city = (getData().settings.city || '').trim();
          const found = (await searchPlaces(q, nearPoint(), city)).filter((r) => !local.some((l) => l.label === r.label));
          if (input.value.trim() !== q || document.activeElement !== input) return;
          show([...local, ...found].slice(0, 6), found.length ? 'Mapa: OpenStreetMap' : `No lo encuentro en el mapa. Prueba otra parte del nombre o la calle, o pega un enlace de Google Maps${city ? '' : '. Pon tu ciudad en Yo → Mis datos para buscar mejor'}.`);
        } catch {
          if (input.value.trim() === q) show(local, 'Sin conexión: puedes escribir la dirección y el precio a mano.');
        }
      }, 650);
    });
    input.addEventListener('blur', () => setTimeout(close, 150));
  }
  // Botones de lugares bajo la ruta: los que tienen nombre (★) y los que más usas. Un toque llena
  // el campo enfocado o, si no hay, el primero vacío (o B).
  function placeBar(box, clientId) {
    const bar = document.createElement('div');
    bar.className = 'chips placebar wide';
    box.after(bar);
    let items = [];
    const draw = () => {
      const cid = cidOf(clientId);
      const named = savedFor(cid);
      const addrs = new Set(named.map((p) => p.addr));
      items = [...named.map((p) => ({ p, named: true })), ...frequent(cid).filter((p) => !addrs.has(p.label)).map((p) => ({ p, named: false }))].slice(0, 8);
      bar.hidden = !items.length;
      bar.innerHTML = items.map((x, i) => `<button type="button" data-i="${i}" class="${x.named ? 'named' : ''}">${x.named ? '★ ' : ''}${esc(x.named ? x.p.label : x.p.label.split(',')[0])}</button>`).join('');
    };
    bar.onpointerdown = (e) => e.preventDefault();
    bar.onclick = (e) => {
      const b = e.target.closest('[data-i]');
      if (!b) return;
      const p = cleanPt(items[+b.dataset.i].p);
      const ins = [...box.querySelectorAll('input[data-pt]')];
      const target = ins.includes(document.activeElement) ? document.activeElement : ins.find((i) => !i.value.trim()) || ins[ins.length - 1];
      setPlace(target, p);
      target._onPick?.(p);
      target.blur();
    };
    // Al nombrar un lugar se redibujan todas las barras abiertas; las que ya no están en pantalla se sueltan.
    const onChange = () => { if (!bar.isConnected) document.removeEventListener('lugares-cambio', onChange); else draw(); };
    document.addEventListener('lugares-cambio', onChange);
    draw();
    return { draw };
  }
  // Distancia, tiempo, mapa y precio sugerido de A a B.
  async function fillRoute(el, a, b, via = []) {
    if (!a || !b) { el.innerHTML = '<div class="empty-route">Elige el punto A y el punto B de la lista para ver distancia, tiempo y precio.</div>'; return null; }
    el.innerHTML = '<div class="empty-route">Calculando ruta…</div>';
    try {
      const r = await route(a, b, via);
      el.innerHTML = `${mapSvg(r.path, `Ruta de ${esc(a.label)} a ${esc(b.label)}${via.length ? ` con ${via.length} parada${via.length > 1 ? 's' : ''}` : ''}`, via)}
        <div class="stats"><div><small>Distancia</small><b>${r.km} km</b></div><div><small>Tiempo</small><b>${r.min} min</b></div><div class="price"><small>Sugerido</small><b>${money(suggestPrice(r.km, r.min, { airport: isAirport(a.label, b.label) }))}</b></div></div>
        <div class="how">${priceMath(r.km, r.min, { airport: isAirport(a.label, b.label) })} · <a href="${directionsLink(a, b, via)}" target="_blank" rel="noopener">Ver en Google Maps</a></div>`;
      return r;
    } catch {
      el.innerHTML = '<div class="empty-route">No se pudo calcular la ruta (¿sin internet?). Pon el precio a mano.</div>';
      return null;
    }
  }
  // Paradas entre A y B: el «+» queda justo arriba de B y cada parada nueva se agrega antes de él.
  // Cada parada se elige igual que A y B (lista, enlace de Google Maps o coordenadas).
  // El ⇄ invierte la ruta completa (ida ↔ vuelta, con las paradas al revés).
  function stopsField(box, { clientId, onChange, initial = [] }) {
    const bRow = box.querySelector('[data-pt=b]').parentElement;
    const tools = document.createElement('div');
    tools.className = 'routetools';
    tools.innerHTML = '<button type="button" class="addstop"><span class="plus" aria-hidden="true">+</span><span>Agregar parada</span></button><button type="button" class="swap" aria-label="Invertir ida y vuelta" title="Invertir">⇄</button>';
    box.insertBefore(tools, bRow);
    const rows = [];
    const inputOf = (r) => r.querySelector('input');
    const addRow = (pt) => {
      const row = document.createElement('div');
      row.className = 'stop has-x';
      row.innerHTML = `<span class="dot s"></span><input data-pt="s" value="${esc(pt?.label || '')}" placeholder="Parada ${rows.length + 1}" autocomplete="off" enterkeyhint="search"><button type="button" class="loc rm" aria-label="Quitar parada">×</button>`;
      box.insertBefore(row, tools);
      rows.push(row);
      const input = inputOf(row);
      wirePlace(input, clientId, (p, typing) => { if (!typing || !p) onChange(); }, cleanPt(pt));
      row.querySelector('.rm').onclick = () => { row.remove(); rows.splice(rows.indexOf(row), 1); rows.forEach((r, i) => { inputOf(r).placeholder = `Parada ${i + 1}`; }); onChange(); };
      return input;
    };
    tools.querySelector('.addstop').onclick = () => addRow(null).focus();
    tools.querySelector('.swap').onclick = () => {
      const a = box.querySelector('[data-pt=a]'), b = box.querySelector('[data-pt=b]');
      const snap = (i) => ({ text: i.value, pt: i._pt || null });
      const put = (i, x) => { i.value = x.text; i._pt = x.pt; i._sync?.(); };
      const A = snap(a), B = snap(b), mid = rows.map((r) => snap(inputOf(r))).reverse();
      put(a, B); put(b, A);
      rows.forEach((r, k) => put(inputOf(r), mid[k]));
      a._onPick?.(B.pt, true);
      b._onPick?.(A.pt);
    };
    initial.forEach((p) => addRow(p));
    return {
      get: () => rows.map((r) => inputOf(r)._pt).filter(Boolean).map(cleanPt),
      // Hay una parada escrita a medias (sin elegir de la lista): la ruta aún no se puede calcular.
      bad: () => rows.some((r) => inputOf(r).value.trim() && !inputOf(r)._pt),
      set: (list) => { rows.splice(0).forEach((r) => r.remove()); (list || []).forEach((p) => addRow(p)); },
    };
  }
  return { knownPlaces, nearPoint, placeInput, usualFrom, wirePlace, setPlace, placeBar, fillRoute, stopsField };
}
