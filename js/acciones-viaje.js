// Acciones compartidas para fechas, viajes rápidos y rutas frecuentes.
import { clashes, clashLine } from './utilidades.js';
export function createTripActions({ getData, today, addDays, tripsOf, client, toast, waLink, MSG, uid, autoName, refresh, firstName, tripForm, openSheet, esc, money, field, whenHtml, $, sheet }) {
  function wireWhen(form, onChange = () => {}) {
    const d = form.elements.date, tm = form.elements.time;
    const mark = () => form.querySelectorAll('[data-w]').forEach((b) => b.classList.toggle('on', (b.dataset.w === '0' && d.value === today()) || (b.dataset.w === '1' && d.value === addDays(today(), 1))));
    form.querySelectorAll('[data-w]').forEach((b) => (b.onclick = () => {
      if (b.dataset.w === 'now') { d.value = today(); tm.value = new Date().toTimeString().slice(0, 5); }
      else d.value = addDays(today(), +b.dataset.w);
      mark(); onChange();
    }));
    d.addEventListener('input', () => { mark(); onChange(); });
    mark();
  }
  const lastUse = (id) => Math.max(0, ...tripsOf(id).map((t) => t.updatedAt || t.createdAt || 0));
  
  // Después de guardar un viaje: ofrece confirmarlo por WhatsApp o guardar la ruta repetida.
  function tripToast(x, isNew) {
    const c = client(x.clientId);
    const learn = x.status === 'hecho' ? learnOffer(x) : null;
    if (learn) return toast('Guardado · ruta repetida', learn);
    if (isNew && x.status === 'agendado' && c?.phone) return toast('Viaje agendado', { label: 'Confirmar por WhatsApp', fn: () => window.open(waLink(c, MSG.confirm(c, x)), '_blank', 'noopener') });
    toast(isNew ? 'Viaje agendado' : 'Guardado');
  }
  // A la segunda vez que haces la misma ruta con un cliente, ofrece guardarla como servicio frecuente.
  function learnOffer(t) {
    const c = client(t.clientId);
    if (!c || !t.fromPt?.label || !t.toPt?.label || t.status !== 'hecho') return null;
    c.services ||= [];
    const sig = (s) => (s || []).map((p) => p.label).join('|');
    if (c.services.some((sv) => sv.a?.label === t.fromPt.label && sv.b?.label === t.toPt.label && sig(sv.stops) === sig(t.stops))) return null;
    const n = tripsOf(c.id).filter((x) => x.status === 'hecho' && x.fromPt?.label === t.fromPt.label && x.toPt?.label === t.toPt.label && sig(x.stops) === sig(t.stops)).length;
    if (n !== 2) return null;
    return { label: 'Guardar ruta frecuente', fn: () => {
      const sv = { id: uid(), a: t.fromPt, b: t.toPt, stops: t.stops || [], km: t.km || '', min: t.min || '', path: t.path || null, price: +t.price || null };
      sv.name = autoName(sv);
      c.services.push(sv);
      c.updatedAt = Date.now();
      refresh();
      toast(`Ruta guardada en ${firstName(c)}`);
    } };
  }
  
  // Agendar en un paso: ya sabemos cliente, ruta y precio; solo falta cuándo.
  function quickTrip(preset, title) {
    const data = getData();
    const c = client(preset.clientId);
    if (!c || !+preset.price) return tripForm(null, preset);
    const way = preset.from || preset.to ? `${preset.from || '…'} → ${preset.to || '…'}` : '';
    openSheet(`<h2>${esc(title)}</h2>
      <p class="field wide" style="font-weight:400">${esc(c.name)}${way ? ' · ' + esc(way) : ''} · <b>${money(preset.price)}</b></p>
      ${field('Fecha', `<input name="date" type="date" required value="${today()}">`)}
      ${field('Hora', `<input name="time" type="time" value="${esc(preset.time)}">`)}
      ${whenHtml}
      <small class="wide clash" id="qclash" hidden></small>
      <div class="buttons"><button type="button" data-close>Cancelar</button><button type="button" data-more>Más opciones</button><button class="primary">Agendar</button></div>`, (form) => {
      $('[data-close]', form).onclick = () => sheet.close();
      const read = () => ({ ...preset, date: form.elements.date.value || today(), time: form.elements.time.value || '' });
      // Dos viajes a la misma hora: avisa y el segundo toque en «Agendar igual» lo guarda.
      const box = $('#qclash', form);
      const okBtn = form.querySelector('button.primary');
      let sig = '', ack = false;
      const check = () => {
        const list = clashes(data.trips, read());
        const s = list.map((o) => o.id).join();
        if (s !== sig) { sig = s; ack = false; okBtn.textContent = 'Agendar'; }
        box.hidden = !list.length;
        box.textContent = list.length ? `⚠ ${clashLine(list, (id) => client(id)?.name || 'otro cliente')} Cambia la hora o agéndalo igual.` : '';
      };
      wireWhen(form, check);
      form.elements.time.addEventListener('input', check);
      check();
      $('[data-more]', form).onclick = () => { const p = read(); sheet.close(); tripForm(null, p); };
      form.onsubmit = (e) => {
        if (clashes(data.trips, read()).length && !ack) { e.preventDefault(); ack = true; okBtn.textContent = 'Agendar igual'; return; }
        const x = { id: uid(), createdAt: Date.now(), updatedAt: Date.now(), status: 'agendado', pay: '', notes: '', wait: '', ...read() };
        data.trips.push(x);
        sheet.close();
        refresh();
        tripToast(x, true);
      };
    });
  }
  return { wireWhen, lastUse, tripToast, learnOffer, quickTrip };
}
