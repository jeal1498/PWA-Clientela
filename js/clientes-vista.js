import { fold } from './utilidades.js';
import { ctFecha, ctHead, ctEstado } from './tabla.js';
// Listado, búsqueda y filtros de clientes.
export function createClientsView({ getData, header, setTabs, view, icon, esc, clientForm, $, sleeping, debtOf, lateDebt, lastTrip, tripsOf, dayLabel, hour12, today, byWhen, initials, money }) {
  let clientQuery = '';
  let clientFilter = '';
  function renderClients() {
    const data = getData();
    header('Clientes');
    setTabs('clientes');
    if (!data.clients.length) {
      view.innerHTML = `<div class="empty">${icon('users')}<h2>Sin clientes</h2><p>Agrega a las personas que te piden viajes por fuera.</p><button class="primary" data-newclient>${icon('plus')} Cliente nuevo</button></div>`;
      $('[data-newclient]', view).onclick = () => clientForm();
      return;
    }
    view.innerHTML = `<input class="search" type="search" placeholder="Buscar por nombre, teléfono o lugar" value="${esc(clientQuery)}" aria-label="Buscar cliente">
      <div class="chips">${[['', `Todos · ${data.clients.length}`], ['debe', 'Te deben'], ['dormidos', 'Sin viajar 30 días']].map(([k, l]) => `<button class="${k === clientFilter ? 'on' : ''}" data-cf="${k}">${l}</button>`).join('')}</div>
      <div class="ct" id="clist"></div>`;
    const search = $('.search', view);
    search.oninput = () => { clientQuery = search.value; drawClientList(); };
    view.querySelectorAll('[data-cf]').forEach((b) => (b.onclick = () => { clientFilter = b.dataset.cf; renderClients(); }));
    drawClientList();
  }
  function drawClientList() {
    const data = getData();
    const q = fold(clientQuery).split(/\s+/).filter(Boolean);
    const list = data.clients
      .filter((c) => q.every((w) => fold([c.name, c.phone, c.places, c.notes, ...(c.services || []).map((sv) => `${sv.name} ${sv.a?.label} ${sv.b?.label}`)].join(' ')).includes(w)))
      .filter((c) => (clientFilter === 'debe' ? debtOf(c.id) > 0 : clientFilter === 'dormidos' ? sleeping(c) : true))
      .map((c) => ({ c, last: lastTrip(c.id), n: tripsOf(c.id).filter((t) => t.status === 'hecho').length, debt: debtOf(c.id), late: tripsOf(c.id).some(lateDebt),
        next: tripsOf(c.id).filter((t) => t.status === 'agendado' && t.date >= today()).sort(byWhen)[0] }))
      .sort((a, b) => (b.last?.date || '').localeCompare(a.last?.date || '') || a.c.name.localeCompare(b.c.name, 'es'));
    const tone = ({ n, debt, late, c }) => (late ? 'danger' : debt ? 'warn' : sleeping(c) || !n ? 'muted' : 'ok');
    const label = { danger: 'Atrasado', warn: 'Te debe', muted: 'Sin viajar', ok: 'Al día' };
    $('#clist').innerHTML = list.length
      ? ctHead('Último', 'Estado', 'Cliente', 'Debe') + list.map((x) => { const { c, last, n, debt, late, next } = x, t = tone(x); return `<div class="ct-cols ct-row${late ? ' v' : ''}" data-client="${c.id}" tabindex="0" role="button">
          ${ctFecha(last?.date)}${ctEstado(t, label[t])}
          <span class="ct-cc"><span class="ct-name">${esc(c.name)}</span><span class="ct-nota muted">${n ? `${n} viaje${n === 1 ? '' : 's'} · último ${last ? dayLabel(last.date) : ''}` : next ? `Próximo viaje ${dayLabel(next.date)}${next.time ? ' · ' + hour12(next.time) : ''}` : 'Sin viajes aún · agendar'}</span></span>
          <span class="ct-amt">${debt ? `<b>${money(debt)}</b>` : '<small>—</small>'}</span></div>`; }).join('')
        + `<div class="ct-foot"><span>${list.length} cliente${list.length === 1 ? '' : 's'}</span><b>${money(list.reduce((s, x) => s + x.debt, 0))}</b></div>`
      : '<p class="empty-route">Nadie coincide.</p>';
    view.querySelectorAll('[data-client]').forEach((li) => {
      const go = () => (location.hash = `#/cliente/${li.dataset.client}`);
      li.onclick = go;
      li.onkeydown = (e) => { if (e.key === 'Enter') go(); };
    });
  }
  return renderClients;
}
