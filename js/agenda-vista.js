// Agenda: lo de hoy primero, lo que te deben a un toque y cada viaje con su siguiente paso.
export function createAgendaView({ getData, view, header, setTabs, today, owed, lateDebt, byWhen, money, icon, firstName, esc, cap, fdate, dayLabel, hour12, weekSummary, weekNudges, addDays, tripCard, bindTrips, $, client, weekForm, refresh, clientForm, importContacts }) {
  function renderAgenda() {
    const data = getData();
    header('Agenda');
    setTabs('agenda');
    const t = today();
    if (!data.clients.length) {
      view.innerHTML = `<div class="empty">${icon('users')}<h2>Tus clientes, en orden</h2>
        <p>Guarda a tus clientes privados, cotiza en segundos, confírmales por WhatsApp y lleva quién te debe.</p>
        <button class="primary" data-newclient>${icon('plus')} Agregar mi primer cliente</button>
        ${'contacts' in navigator ? '<button data-contacts>Importar de mis contactos</button>' : ''}</div>`;
      $('[data-newclient]', view).onclick = () => clientForm();
      $('[data-contacts]', view)?.addEventListener('click', importContacts);
      return;
    }
    const active = data.trips.filter((x) => x.status !== 'cancelado');
    const todays = active.filter((x) => x.date === t && x.status === 'agendado').sort(byWhen);
    const pending = active.filter((x) => x.status === 'agendado' && x.date < t).sort(byWhen);
    const upcoming = active.filter((x) => x.status === 'agendado' && x.date > t).sort(byWhen);
    const tomorrow = upcoming.filter((x) => x.date === addDays(t, 1));
    const week = upcoming.filter((x) => x.date > addDays(t, 1) && x.date <= addDays(t, 7));
    const later = upcoming.filter((x) => x.date > addDays(t, 7));
    const owing = data.trips.filter(owed);
    const debt = owing.reduce((s, x) => s + +x.price, 0);
    const debtors = new Set(owing.map((x) => x.clientId)).size;
    const sum = (list) => list.reduce((s, x) => s + +x.price, 0);
    const section = (title, list, opts) => (list.length ? `<p class="group"><span>${title}</span><em>${money(sum(list))}</em></p>${list.map((x) => tripCard(x, opts)).join('')}` : '');
    const next = upcoming[0];
    const nudges = weekNudges();
    view.innerHTML = `
      <p class="fecha">${cap(fdate(t, { weekday: 'long', day: 'numeric', month: 'short' }))}</p>
      <section class="hoy"><span class="eti">Hoy</span>
        <div class="fila-hoy"><b class="big">${todays.length ? `${todays.length} viaje${todays.length === 1 ? '' : 's'}` : 'Sin viajes'}</b>${todays.length ? `<span class="mono">${money(sum(todays))}</span>` : ''}</div>
        ${!todays.length && next ? `<small class="muted">El siguiente: ${esc(client(next.clientId)?.name || '')}, ${dayLabel(next.date)}${next.time ? ' a las ' + hour12(next.time) : ''}</small>` : ''}</section>
      ${debt ? `<a class="strip" href="#/cobros"><span class="pill ${owing.some(lateDebt) ? 'late' : 'debe'}">Te deben</span><span class="grow"><b class="mono">${money(debt)}</b> · ${debtors} cliente${debtors === 1 ? '' : 's'}</span>${icon('right')}</a>` : ''}
      ${nudges.map(({ c }) => `<section class="card nudge"><b>¿Agendar la próxima semana de ${esc(firstName(c))}?</b><small class="muted">${esc(weekSummary(c))}</small>
        <div class="actions"><button class="primary" data-nweek="${c.id}">Agendar semana</button><button data-nsnooze="${c.id}">Ahora no</button></div></section>`).join('')}
      ${section('¿Se hizo?', pending)}
      ${section('Hoy', todays)}
      ${section('Mañana', tomorrow)}
      ${section('Esta semana', week, { showDate: true })}
      ${section('Más adelante', later, { showDate: true })}`;
    bindTrips();
    view.querySelectorAll('[data-nweek]').forEach((b) => (b.onclick = () => weekForm(client(b.dataset.nweek), { start: 'next' })));
    view.querySelectorAll('[data-nsnooze]').forEach((b) => (b.onclick = () => { const n = nudges.find((x) => x.c.id === b.dataset.nsnooze); client(n.c.id).weekSnooze = n.next; refresh(); }));
  }
  return renderAgenda;
}
