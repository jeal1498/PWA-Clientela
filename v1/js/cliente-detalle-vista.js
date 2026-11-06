// Ficha del cliente (rediseño B): el número de viajes primero, un botón grande para agendar, atajos de precio,
// WhatsApp y llamar, y el detalle (viajes de siempre, historial, notas) plegado.
export function createClientDetailView({ client, header, top, icon, esc, $, clientForm, setTabs, tripsOf, byWhen, debtOf, lateDebt, owed, tripForm, view, initials, firstName, phoneIntl, waLink, MSG, weekSummary, money, dayLabel, hour12, cap, autoName, svcPrice, sleeping, weekForm, collectForm, quickTrip, repeatTrip, fromService, bindTrips, quoteForm }) {
  function renderClient(id) {
    const c = client(id);
    header(c.name, { back: '#/clientes' });
    top.lastElementChild.outerHTML = `<button class="iconbtn" data-editc aria-label="Editar cliente">${icon('edit')}</button>`;
    $('[data-editc]', top).onclick = () => clientForm(c);
    setTabs('clientes');
    const trips = tripsOf(id).sort((a, b) => byWhen(b, a));
    const done = trips.filter((t) => t.status === 'hecho');
    const debt = debtOf(id);
    const late = trips.some(lateDebt);
    const last = done[0] || trips[0];
    const digits = String(c.phone || '').replace(/\D/g, '');
    const nicePhone = digits.length === 10 ? `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}` : c.phone;
    const tag = (t) => (t.status === 'cancelado' ? '<span class="pill">Cancelado</span>'
      : owed(t) ? `<span class="pill ${lateDebt(t) ? 'late' : 'debe'}">${money(t.price)}</span>`
        : t.status === 'hecho' ? `<span class="pill ok">${money(t.price)}</span>`
          : `<span class="pill">${money(t.price)}</span>`);
    const total = done.reduce((s, t) => s + +t.price, 0);
    const round = (icn, label, attrs) => `<${attrs.startsWith('href') ? 'a' : 'button type="button"'} class="redondo" ${attrs}>${icon(icn)}${label}</${attrs.startsWith('href') ? 'a' : 'button'}>`;
    const svcHtml = (c.services || []).map((sv) => `<article class="trip svc-card"><div class="t2"><b class="who">${esc(sv.name || autoName(sv))}</b><span class="price">${money(svcPrice(sv))}</span></div>
          ${sv.km ? `<div class="way">${sv.km} km · ${sv.min} min</div>` : ''}
          <div class="actions"><button type="button" class="primary" data-book="${sv.id}">Agendar</button>${c.phone ? `<a class="btn" href="${waLink(c, MSG.quote(c, { from: sv.a?.label, to: sv.b?.label, price: svcPrice(sv) }))}" target="_blank" rel="noopener">${icon('wa')}Mandar precio</a>` : ''}</div></article>`).join('');
    const histHtml = trips.length ? `<ul class="list">${trips.map((t) => `<li data-trip="${t.id}" tabindex="0"><span class="body"><b class="mono">${cap(dayLabel(t.date))}${t.time ? ' · ' + hour12(t.time) : ''}</b><small>${t.from || t.to ? `${esc(t.from || '…')} → ${esc(t.to || '…')}` : 'Sin ruta'}</small></span>${tag(t)}${t.status === 'hecho' ? `<button type="button" class="again" data-again="${t.id}" aria-label="Repetir este viaje para hoy" title="Repetir para hoy">${icon('repeat')}</button>` : ''}</li>`).join('')}</ul>` : '<div class="card muted">Aún no hay viajes con este cliente.</div>';
    const acord = (title, count, body, open = false) => `<details class="acord"${open ? ' open' : ''}><summary><b>${title}</b>${count != null ? `<span class="mono muted">${count}</span>` : ''}${icon('right')}</summary><div class="acord-body">${body}</div></details>`;
    view.innerHTML = `
      <section class="heroc"><span class="avatar big">${esc(initials(c.name))}</span><h2>${esc(c.name)}</h2>
        <b class="cnt">${done.length}</b><span class="muted">viaje${done.length === 1 ? '' : 's'}${done.length ? ` · ${money(total)} en total` : ''}</span>
        ${debt ? `<button type="button" class="pill ${late ? 'late' : 'debe'}" data-collect>Te debe ${money(debt)}</button>` : done.length ? '<span class="pill ok">Al corriente</span>' : ''}
        ${c.phone ? `<span class="muted mono">${esc(nicePhone)}</span>` : ''}</section>
      <button type="button" class="primary grande" data-new>${icon('plus')}Agendar viaje</button>
      <nav class="redondos">
        ${round('calc', 'Precio', 'data-quote')}
        ${c.phone ? `${round('wa', 'WhatsApp', `href="${waLink(c, `Hola ${firstName(c)}, `)}" target="_blank" rel="noopener"`)}${round('phone', 'Llamar', `href="tel:+${phoneIntl(c.phone)}"`)}` : round('phone', 'Agregar teléfono', 'data-editc2')}
      </nav>
      ${(c.services || []).length || done.length ? `<div class="actions" style="margin:0 0 4px"><button type="button" data-week>${icon('repeat')}Agendar semana</button>${last ? `<button type="button" data-repeat>${icon('repeat')}Repetir el último</button>` : ''}</div>
        ${c.week ? `<p class="muted" style="margin:0 2px 4px;font-size:12.5px">Su rutina: ${esc(weekSummary(c))}</p>` : ''}` : ''}
      ${c.phone && sleeping(c) && done.length ? `<a class="strip" href="${waLink(c, MSG.hello(c))}" target="_blank" rel="noopener">${icon('wa')}<span class="grow">Lleva más de 30 días sin viajar. Mándale un saludo</span>${icon('right')}</a>` : ''}
      ${(c.services || []).length ? acord('Sus viajes de siempre', c.services.length, svcHtml, true) : ''}
      ${acord('Historial', trips.length, histHtml)}
      ${c.places || c.rate || c.notes ? acord('Notas', null, `<dl class="kv">
        ${c.places ? `<dt>Lugares</dt><dd>${esc(c.places)}</dd>` : ''}
        ${c.rate ? `<dt>Tarifa</dt><dd>${esc(c.rate)}</dd>` : ''}
        ${c.notes ? `<dt>Notas</dt><dd>${esc(c.notes)}</dd>` : ''}</dl>`) : ''}`;
    $('[data-quote]', view)?.addEventListener('click', () => quoteForm({ clientId: id }));
    $('[data-new]', view).onclick = () => tripForm(null, { clientId: id });
    $('[data-week]', view)?.addEventListener('click', () => weekForm(c));
    $('[data-collect]', view)?.addEventListener('click', () => collectForm(c));
    view.querySelectorAll('[data-book]').forEach((b) => (b.onclick = () => { const sv = c.services.find((x) => x.id === b.dataset.book); quickTrip(fromService(c, sv), sv.name || autoName(sv)); }));
    $('[data-repeat]', view)?.addEventListener('click', () => repeatTrip(last));
    $('[data-editc2]', view)?.addEventListener('click', () => clientForm(c));
    bindTrips();
  }
  return renderClient;
}
