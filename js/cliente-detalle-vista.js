// Ficha del cliente: contacto, lo que te debe, sus viajes de siempre y su historial compacto.
export function createClientDetailView({ client, header, top, icon, esc, $, clientForm, setTabs, tripsOf, byWhen, debtOf, lateDebt, owed, tripForm, view, initials, firstName, phoneIntl, waLink, MSG, weekSummary, money, dayLabel, hour12, cap, autoName, svcPrice, sleeping, weekForm, collectForm, quickTrip, repeatTrip, fromService, bindTrips }) {
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
    view.innerHTML = `
      <section class="hero"><span class="avatar big">${esc(initials(c.name))}</span><h2>${esc(c.name)}</h2>
        ${c.phone ? `<span class="muted mono">${esc(nicePhone)}</span>` : ''}</section>
      <nav class="actions quick3">
        ${c.phone ? `<a class="btn" href="${waLink(c, `Hola ${firstName(c)}, `)}" target="_blank" rel="noopener">${icon('wa')}WhatsApp</a><a class="btn" href="tel:+${phoneIntl(c.phone)}">${icon('phone')}Llamar</a>` : `<button type="button" data-editc2>${icon('phone')}Agregar teléfono</button>`}
        <button type="button" class="primary" data-new>${icon('plus')}Agendar</button>
      </nav>
      ${done.length || debt ? `<div class="strip"><span class="grow mono">${done.length} viaje${done.length === 1 ? '' : 's'} · ${money(done.reduce((s, t) => s + +t.price, 0))}</span>
        ${debt ? `<button type="button" class="pill ${late ? 'late' : 'debe'}" data-collect>Te debe ${money(debt)}</button>` : '<span class="pill ok">Al corriente</span>'}</div>` : ''}
      ${(c.services || []).length ? `<p class="group"><span>Sus viajes de siempre</span></p>
        ${c.services.map((sv) => `<article class="trip svc-card"><div class="t2"><b class="who">${esc(sv.name || autoName(sv))}</b><span class="price">${money(svcPrice(sv))}</span></div>
          ${sv.km ? `<div class="way">${sv.km} km · ${sv.min} min</div>` : ''}
          <div class="actions"><button type="button" class="primary" data-book="${sv.id}">Agendar</button>${c.phone ? `<a class="btn" href="${waLink(c, MSG.quote(c, { from: sv.a?.label, to: sv.b?.label, price: svcPrice(sv) }))}" target="_blank" rel="noopener">${icon('wa')}Mandar precio</a>` : ''}</div></article>`).join('')}` : ''}
      ${(c.services || []).length || done.length ? `<div class="actions" style="margin:0 0 12px">${`<button type="button" data-week>${icon('repeat')}Agendar semana</button>`}${last ? `<button type="button" data-repeat>${icon('repeat')}Repetir el último</button>` : ''}</div>
        ${c.week ? `<p class="muted" style="margin:-6px 2px 12px;font-size:12.5px">Su rutina: ${esc(weekSummary(c))}</p>` : ''}` : ''}
      ${c.places || c.rate || c.notes ? `<section class="card"><dl class="kv">
        ${c.places ? `<dt>Lugares</dt><dd>${esc(c.places)}</dd>` : ''}
        ${c.rate ? `<dt>Tarifa</dt><dd>${esc(c.rate)}</dd>` : ''}
        ${c.notes ? `<dt>Notas</dt><dd>${esc(c.notes)}</dd>` : ''}</dl></section>` : ''}
      ${c.phone && sleeping(c) && done.length ? `<a class="strip" href="${waLink(c, MSG.hello(c))}" target="_blank" rel="noopener">${icon('wa')}<span class="grow">Lleva más de 30 días sin viajar. Mándale un saludo</span>${icon('right')}</a>` : ''}
      <p class="group"><span>Historial</span><em>${trips.length}</em></p>
      ${trips.length ? `<ul class="list">${trips.map((t) => `<li data-trip="${t.id}" tabindex="0"><span class="body"><b class="mono">${cap(dayLabel(t.date))}${t.time ? ' · ' + hour12(t.time) : ''}</b><small>${t.from || t.to ? `${esc(t.from || '…')} → ${esc(t.to || '…')}` : 'Sin ruta'}</small></span>${tag(t)}${t.status === 'hecho' ? `<button type="button" class="again" data-again="${t.id}" aria-label="Repetir este viaje para hoy" title="Repetir para hoy">${icon('repeat')}</button>` : ''}</li>`).join('')}</ul>` : '<div class="card muted">Aún no hay viajes con este cliente.</div>'}`;
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
