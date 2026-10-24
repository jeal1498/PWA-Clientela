// Vista del resumen mensual y acciones de navegación por mes.
export function createSummaryView({ getData, view, header, setTabs, today, lastTrip, sleeping, icon, money, esc, cap, fdate, initials, dayLabel, waLink, MSG, client }) {
  let sumMonth = '';
  function renderSummary() {
    const data = getData();
    header('Resumen');
    setTabs('resumen');
    if (!sumMonth) sumMonth = today().slice(0, 7);
    const shift = (n) => { const d = new Date(sumMonth + '-01T00:00'); d.setMonth(d.getMonth() + n); return d.toLocaleDateString('en-CA').slice(0, 7); };
    const trips = data.trips.filter((t) => t.status === 'hecho' && t.date.startsWith(sumMonth));
    const total = trips.reduce((s, t) => s + +t.price, 0);
    const paid = trips.filter((t) => t.pay).reduce((s, t) => s + +t.price, 0);
    const per = new Map();
    const count = new Map();
    for (const t of trips) { per.set(t.clientId, (per.get(t.clientId) || 0) + +t.price); count.set(t.clientId, (count.get(t.clientId) || 0) + 1); }
    const top = [...per].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = top[0]?.[1] || 1;
    const methods = ['efectivo', 'transferencia', 'tarjeta'].map((m) => [m, trips.filter((t) => t.pay === m).reduce((s, t) => s + +t.price, 0)]).filter(([, v]) => v);
    const isNow = sumMonth === today().slice(0, 7);
    const asleep = data.clients.filter((c) => c.phone && lastTrip(c.id) && sleeping(c));
    view.innerHTML = `
      <div class="monthnav"><button class="iconbtn" data-m="-1" aria-label="Mes anterior">${icon('left')}</button>
        <b>${cap(new Date(sumMonth + '-01T00:00').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }))}</b>
        <button class="iconbtn" data-m="1" aria-label="Mes siguiente" ${isNow ? 'disabled style="opacity:.3"' : ''}>${icon('right')}</button></div>
      <section class="hoy"><span class="eti">Generaste</span><b class="big">${money(total)}</b>
        <small class="muted">${trips.length} viaje${trips.length === 1 ? '' : 's'} · ${per.size} cliente${per.size === 1 ? '' : 's'}${trips.length ? ' · promedio ' + money(total / trips.length) : ''}</small></section>
      <section class="tiles" style="grid-template-columns:1fr 1fr"><div class="tile"><small>Cobrado</small><b class="ok">${money(paid)}</b></div><div class="tile"><small>Te deben</small><b class="${total - paid ? 'debe' : ''}">${money(total - paid)}</b></div></section>
      ${top.length ? `<section class="card"><h3 class="eti">Mejores clientes</h3><div class="bars">${top.map(([id, v]) => `<div class="bar"><span>${esc(client(id)?.name || '—')} · ${count.get(id)} viaje${count.get(id) === 1 ? '' : 's'}</span><b class="mono">${money(v)}</b><i style="--w:${Math.round((v / max) * 100)}%"></i></div>`).join('')}</div></section>` : '<div class="card muted">Sin viajes terminados este mes.</div>'}
      ${methods.length ? `<section class="card"><h3 class="eti">Cómo te pagaron</h3><dl class="kv">${methods.map(([m, v]) => `<dt>${cap(m)}</dt><dd>${money(v)}</dd>`).join('')}</dl></section>` : ''}
      ${isNow && asleep.length ? `<p class="group"><span>Para reactivar</span><em>30 días o más</em></p>
        <ul class="list">${asleep.map((c) => `<li data-client="${c.id}"><span class="avatar">${esc(initials(c.name))}</span><span class="body"><b>${esc(c.name)}</b><small>último viaje ${dayLabel(lastTrip(c.id).date)}</small></span><a class="btn" href="${waLink(c, MSG.hello(c))}" target="_blank" rel="noopener">Saludar</a></li>`).join('')}</ul>` : ''}`;
    view.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { if (!b.disabled) { sumMonth = shift(+b.dataset.m); renderSummary(); } }));
    view.querySelectorAll('[data-client]').forEach((li) => (li.onclick = (e) => { if (!e.target.closest('a')) location.hash = `#/cliente/${li.dataset.client}`; }));
  }
  return renderSummary;
}
