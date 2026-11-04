// Tarjeta de viaje: muestra solo el siguiente paso (confirmar → ya llegué → terminar, o «¿se hizo?»).
// tripCard(t) es la tarjeta de siempre; tripCard.focus(t) es la tarjeta grande de la Agenda («un solo foco»),
// tripCard.row(t) la fila compacta y tripCard.ask(t) el aviso «¿se hizo?». Todas usan los mismos data-* que bindTrips.
export function createTripCard({ client, today, owed, lateDebt, cap, waLink, MSG, icon, hour12, dayLabel, esc, money, payLabel, directionsLink, fdate }) {
  const wayOf = (t) => {
    const n = (t.stops || []).length;
    return t.from || t.to ? `${esc(t.from || '…')} → ${esc(t.to || '…')}${n ? ` · ${n} parada${n > 1 ? 's' : ''}` : ''}` : 'Sin ruta';
  };
  // Terminar con la forma de pago habitual del cliente en un solo toque; «Otro pago» abre las demás.
  const doneBtn = (t, c, { primary, past = false, short = false } = {}) => {
    const hab = c.lastPay && payLabel[c.lastPay] ? c.lastPay : '';
    const habName = hab === 'transferencia' ? 'Transf.' : payLabel[hab];
    if (short) {
      return hab
        ? `<button type="button" class="${primary ? 'primary' : ''}" data-fpay="${t.id}" data-method="${hab}">Sí</button>`
        : `<button type="button" class="${primary ? 'primary' : ''}" data-finish="${t.id}">Sí</button>`;
    }
    return hab
      ? `<button type="button" class="${primary ? 'primary' : ''}" data-fpay="${t.id}" data-method="${hab}">${icon('check')}${past ? 'Sí' : 'Terminar'} · ${habName}</button><button type="button" class="mini" data-finish="${t.id}">Otro pago</button>`
      : `<button type="button" class="${primary ? 'primary' : ''}" data-finish="${t.id}">${icon('check')}${past ? 'Sí, terminar' : 'Terminar'}</button>`;
  };
  const actionsOf = (t, c) => {
    const isToday = t.date === today();
    const past = t.status === 'agendado' && t.date < today();
    const again = `<button type="button" data-again="${t.id}">${icon('repeat')}Repetir</button>`;
    if (past) return `<button type="button" data-notdone="${t.id}">No se hizo</button>${doneBtn(t, c, { primary: true, past: true })}`;
    if (t.status === 'agendado') {
      const confirm = c.phone && !t.confirmedAt
        ? `<a class="btn primary" data-confirm="${t.id}" href="${waLink(c, MSG.confirm(c, t))}" target="_blank" rel="noopener">${icon('wa')}Confirmar por WhatsApp</a>` : '';
      if (isToday) {
        const arrived = c.phone && t.confirmedAt ? `<a class="btn primary" href="${waLink(c, MSG.arrived(c, t))}" target="_blank" rel="noopener">${icon('pin')}Ya llegué</a>` : '';
        return confirm + arrived + doneBtn(t, c, { primary: !confirm && !arrived });
      }
      return confirm;
    }
    if (owed(t)) return `<button type="button" data-paid="${t.id}">${icon('cash')}Ya me pagó</button>${again}`;
    if (t.status === 'hecho') return again;
    return '';
  };

  function tripCard(t, { showDate = false, showClient = true } = {}) {
    const c = client(t.clientId) || { name: 'Sin cliente' };
    const past = t.status === 'agendado' && t.date < today();
    const day = showDate || past ? cap(dayLabel(t.date)) : '';
    const when = [day, t.time ? hour12(t.time) : day ? '' : 'Sin hora'].filter(Boolean).join(' · ');
    let tag = '';
    if (t.status === 'cancelado') tag = '<span class="pill">Cancelado</span>';
    else if (owed(t)) tag = lateDebt(t) ? '<span class="pill late">Atrasado</span>' : '<span class="pill debe">Te debe</span>';
    else if (t.status === 'hecho') tag = `<span class="pill ok">${esc(cap(t.pay || 'cobrado'))}</span>`;
    else if (!past) tag = `<span class="pill">${t.confirmedAt ? 'Confirmado' : 'Agendado'}</span>`;
    const actions = actionsOf(t, c);
    const way = wayOf(t);
    return `<article class="trip ${t.status !== 'agendado' ? 'done' : ''}" data-trip="${t.id}" tabindex="0">
    <div class="t1"><span class="when">${when}</span>${tag}</div>
    <div class="t2"><b class="who">${showClient ? esc(c.name) : way}</b><span class="price">${money(t.price)}</span></div>
    ${showClient ? `<div class="way">${way}</div>` : ''}
    ${actions ? `<div class="actions">${actions}</div>` : ''}
  </article>`;
  }

  // «Un solo foco»: el siguiente viaje en grande, con ruta, WhatsApp y llamar a un toque y su botón principal.
  tripCard.focus = (t, { eyebrow }) => {
    const c = client(t.clientId) || { name: 'Sin cliente' };
    const m = /^(.*?)\s*(am|pm)$/i.exec(t.time ? hour12(t.time) : '');
    const time = m ? `<span class="t">${esc(m[1])}</span><small>${esc(m[2])}</small>` : '<span class="t sin">Sin hora</span>';
    const dig = String(c.phone || '').replace(/\D/g, '');
    const nav = t.fromPt && t.toPt ? directionsLink(t.fromPt, t.toPt, t.stops || []) : '';
    const round = (icn, label, href, off) => (href
      ? `<a class="redondo" href="${href}" target="_blank" rel="noopener">${icon(icn)}${label}</a>`
      : `<span class="redondo off" aria-disabled="true">${icon(icn)}${label}</span>`);
    const km = t.km ? ` · ${esc(t.km)} km` : '';
    return `<article class="foco" data-trip="${t.id}" tabindex="0">
      <span class="eti">${esc(eyebrow)}</span>
      <div class="fila-foco"><span class="hora">${time}</span><span class="pill">${t.confirmedAt ? 'Confirmado' : 'Agendado'}</span></div>
      <div><b class="nombre">${esc(c.name)}</b><span class="ruta">${wayOf(t)}${km} · <b class="mono">${money(t.price)}</b></span></div>
      <div class="redondos">${round('nav', 'Ruta', nav)}${round('wa', 'WhatsApp', c.phone ? waLink(c, '') : '')}${round('phone', 'Llamar', dig ? `tel:${dig}` : '')}</div>
      <div class="actions grande">${actionsOf(t, c)}</div>
    </article>`;
  };

  // Fila compacta para «Después hoy», «Mañana»…
  tripCard.row = (t, { showDate = false } = {}) => {
    const c = client(t.clientId) || { name: 'Sin cliente' };
    const hr = showDate ? cap(fdate(t.date, { day: 'numeric', month: 'short' })) : t.time ? hour12(t.time) : 'Sin hora';
    return `<article class="fila-c" data-trip="${t.id}" tabindex="0"><span class="hr">${esc(hr)}</span>
      <span class="n"><b>${esc(c.name)}</b><small>${wayOf(t)}</small></span><span class="m">${money(t.price)}</span>${icon('right')}</article>`;
  };

  // Aviso «¿se hizo?» de un viaje que ya pasó: No / Sí en una línea.
  tripCard.ask = (t) => {
    const c = client(t.clientId) || { name: 'Sin cliente' };
    return `<article class="aviso" data-trip="${t.id}" tabindex="0"><span class="pq"><b>${esc(cap(dayLabel(t.date)))} · ${esc(c.name)} · ${money(t.price)}</b>
      <small>${wayOf(t)} · ¿se hizo?</small></span>
      <button type="button" data-notdone="${t.id}">No</button>${doneBtn(t, c, { primary: true, short: true })}</article>`;
  };
  return tripCard;
}
