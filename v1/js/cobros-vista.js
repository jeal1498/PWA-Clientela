// Cobros «toca cobrar a…» (rediseño B): el cliente más atrasado en grande con su botón de recordar y «Ya me pagó»,
// los demás en filas cortas (en amarillo lo reciente, en rojo lo atrasado: 15 días o más). Al cobrar, pasa al siguiente.
export function createChargesView({ getData, view, header, setTabs, tripsOf, owed, lateDebt, byWhen, money, icon, esc, waLink, MSG, cap, fdate, dayLabel, daysBetween, today, bindTrips, $, collectForm, client, shortRoute, initials }) {
  let focusId = ''; // cliente en grande; si ya no debe nada, el primero de la lista
  function renderCharges() {
    const data = getData();
    header('Cobros');
    setTabs('cobros');
    const sum = (list) => list.reduce((s, t) => s + +t.price, 0);
    const groups = data.clients
      .map((c) => ({ c, list: tripsOf(c.id).filter(owed).sort(byWhen) }))
      .filter((g) => g.list.length)
      .map((g) => ({ ...g, total: sum(g.list), late: g.list.some(lateDebt), days: daysBetween(g.list[0].date, today()) }))
      .sort((a, b) => b.late - a.late || b.total - a.total);
    const all = groups.flatMap((g) => g.list);
    const total = sum(all);
    const late = sum(all.filter(lateDebt));
    const paid = data.trips.filter((t) => t.status === 'hecho' && t.pay && t.paidAt && daysBetween(t.paidAt, today()) <= 6)
      .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
    const since = (d) => (d === 0 ? 'de hoy' : d === 1 ? 'desde ayer' : `desde hace ${d} días`);
    const paidHtml = paid.length ? `<p class="group"><span>Cobrado esta semana</span><em>${money(sum(paid))}</em></p>
      <ul class="list">${paid.map((t) => `<li data-trip="${t.id}"><span class="body"><b>${esc(client(t.clientId)?.name || '—')}</b><small>${esc(cap(t.pay))} · ${dayLabel(t.paidAt)} · ${money(t.price)}</small></span><span class="sello">Cobrado</span></li>`).join('')}</ul>` : '';
    const cur = groups.find((g) => g.c.id === focusId) || groups[0];
    if (cur) focusId = cur.c.id;
    const tripWord = (n) => `${n} viaje${n === 1 ? '' : 's'}`;
    const dates = (list) => {
      const d = list.map((x) => fdate(x.date, { weekday: 'short', day: 'numeric', month: 'short' }));
      return d.length > 3 ? `${d.slice(0, 2).join(', ')} y ${d.length - 2} más` : d.length > 1 ? `${d.slice(0, -1).join(', ')} y ${d[d.length - 1]}` : d[0];
    };
    const focusHtml = ({ c, list, total: t, late: l, days }) => `<section class="foco cobrar ${l ? 'late' : 'debe'}">
        <span class="pill ${l ? 'late' : 'debe'}">${l ? `Atrasado · ${days} días` : `Te debe · ${since(days)}`}</span>
        <b class="nombre grande">${esc(c.name)}</b>
        <span class="numgrande">${money(t)}</span>
        <span class="ruta">${tripWord(list.length)} · ${esc(dates(list))}</span>
        <div class="actions grande">${c.phone ? `<a class="btn primary" href="${waLink(c, MSG.charge(c, list))}" target="_blank" rel="noopener">${icon('wa')}Recordar por WhatsApp</a>` : '<small class="muted">Sin WhatsApp: agrégalo en su ficha para recordarle.</small>'}
          <button type="button" data-payall="${c.id}">${icon('cash')}Ya me pagó</button></div>
        <details class="ct-viajes"><summary>Ver ${list.length === 1 ? 'el viaje' : `los ${list.length} viajes`}</summary>
          <ul class="list">${list.map((x) => `<li data-trip="${x.id}"><span class="body"><b>${cap(fdate(x.date))}</b><small>${esc(shortRoute(x.from, x.to))}</small></span><span class="amt">${money(x.price)}</span><button type="button" data-paid="${x.id}">Cobrado</button></li>`).join('')}</ul></details>
      </section>`;
    const rest = groups.filter((g) => g !== cur);
    const restHtml = rest.length ? `<p class="group"><span>Siguientes</span><em>${money(sum(rest.flatMap((g) => g.list)))}</em></p>
      ${rest.map(({ c, list, total: t, late: l, days }) => `<button type="button" class="fila-c cobro" data-focus="${c.id}"><span class="av s">${esc(initials(c.name))}</span>
        <span class="n"><b>${esc(c.name)}</b><small>${tripWord(list.length)} · ${since(days)}</small></span><span class="m ${l ? 'late' : 'debe'}">${money(t)}</span>${icon('right')}</button>`).join('')}` : '';
    view.innerHTML = !groups.length
      ? `<div class="empty">${icon('wallet')}<h2>Nadie te debe</h2><p>Cuando termines un viaje y elijas «Me debe», aparece aquí para cobrarlo.</p></div>${paidHtml}`
      : `<div class="fila-hoy"><span><span class="eti">Te deben</span><br><b class="mono cuenta-total">${money(total)}</b></span><span class="muted">${groups.indexOf(cur) + 1} de ${groups.length}${late ? ` · ${money(late)} atrasados` : ''}</span></div>
        <div class="avance" aria-hidden="true">${groups.map((g) => `<i class="${g === cur ? 'on' : ''}"></i>`).join('')}</div>
        ${focusHtml(cur)}
        ${restHtml}
        ${paidHtml}`;
    bindTrips();
    view.querySelectorAll('[data-focus]').forEach((b) => (b.onclick = () => { focusId = b.dataset.focus; renderCharges(); window.scrollTo(0, 0); }));
    view.querySelectorAll('[data-payall]').forEach((b) => (b.onclick = () => collectForm(client(b.dataset.payall))));
  }
  return renderCharges;
}
