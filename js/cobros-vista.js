// Cobros: quién te debe, en amarillo lo reciente y en rojo lo atrasado (15 días o más).
export function createChargesView({ getData, view, header, setTabs, tripsOf, owed, lateDebt, byWhen, money, icon, esc, waLink, MSG, cap, fdate, dayLabel, daysBetween, today, bindTrips, $, collectForm, client, shortRoute }) {
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
    view.innerHTML = !groups.length
      ? `<div class="empty">${icon('wallet')}<h2>Nadie te debe</h2><p>Cuando termines un viaje y elijas «Me debe», aparece aquí para cobrarlo.</p></div>${paidHtml}`
      : `<section class="hoy"><span class="eti">Te deben</span><b class="big">${money(total)}</b>
          <div class="barra" aria-hidden="true"><i class="debe" style="width:${Math.round(((total - late) / total) * 100)}%"></i><i class="late" style="width:${Math.round((late / total) * 100)}%"></i></div>
          <small class="muted">${money(total - late)} recientes · ${money(late)} atrasados</small></section>
        ${groups.map(({ c, list, total: t, late: l, days }) => `<section class="cobro">
          <details><summary><span class="row"><b>${esc(c.name)}</b><span class="pill ${l ? 'late' : 'debe'}">${money(t)}</span></span>
            <small class="muted">${list.length} viaje${list.length === 1 ? '' : 's'} · ${since(days)} · ver</small></summary>
            <ul class="list">${list.map((x) => `<li data-trip="${x.id}"><span class="body"><b>${cap(fdate(x.date))}</b><small>${esc(shortRoute(x.from, x.to))}</small></span><span class="amt">${money(x.price)}</span><button type="button" data-paid="${x.id}">Cobrado</button></li>`).join('')}</ul></details>
          <div class="actions">${c.phone ? `<a class="btn primary" href="${waLink(c, MSG.charge(c, list))}" target="_blank" rel="noopener">${icon('wa')}Recordar</a>` : ''}<button type="button" data-payall="${c.id}">${icon('cash')}Ya me pagó</button></div></section>`).join('')}
        ${paidHtml}`;
    bindTrips();
    view.querySelectorAll('[data-payall]').forEach((b) => (b.onclick = () => collectForm(client(b.dataset.payall))));
  }
  return renderCharges;
}
