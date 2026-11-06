// Acciones para cerrar viajes y registrar pagos.
export function createPaymentHandlers({ client, openSheet, esc, money, payGrid, $, sheet, refresh, learnOffer, toast, today, tripsOf, owed, byWhen, firstName, cap, fdate, hour12, shortRoute, field, debtOf }) {
  // Termina el viaje con la forma de pago dada ('' = me debe). Con «Deshacer» salvo cuando ofrece guardar la ruta.
  function finishTrip(t, pay) {
    const c = client(t.clientId);
    const prev = { status: t.status, pay: t.pay, paidAt: t.paidAt, updatedAt: t.updatedAt };
    const prevPay = c?.lastPay;
    Object.assign(t, { status: 'hecho', pay, paidAt: pay ? today() : '', updatedAt: Date.now() });
    if (pay && c) c.lastPay = pay;
    refresh();
    const offer = learnOffer(t);
    const undo = { label: 'Deshacer', fn: () => { Object.assign(t, prev); if (c) c.lastPay = prevPay; refresh(); } };
    toast(offer ? 'Viaje terminado · ruta repetida' : pay ? 'Viaje terminado' : 'Anotado en Cobros', offer || undo);
  }
  function finishForm(t) {
    const c = client(t.clientId);
    openSheet(`<h2>Terminar viaje</h2>
      <p class="field wide" style="font-weight:400">${esc(c?.name)} · ${money(t.price)}</p>
      <span class="field wide">¿Cómo te pagó? <small>un toque y listo</small></span>${payGrid(c, { debt: true })}
      <div class="buttons"><button type="button" data-close>Cancelar</button></div>`, (form) => {
      $('[data-close]', form).onclick = () => sheet.close();
      form.querySelectorAll('[data-pay]').forEach((b) => (b.onclick = () => {
        sheet.close();
        finishTrip(t, b.dataset.pay);
      }));
    });
  }
  function payForm(list) {
    const total = list.reduce((s, t) => s + +t.price, 0);
    const c = client(list[0].clientId);
    openSheet(`<h2>Registrar pago</h2>
      <p class="field wide" style="font-weight:400">${esc(c?.name)} · ${list.length} viaje${list.length === 1 ? '' : 's'} · ${money(total)}</p>
      ${payGrid(c)}
      <div class="buttons"><button type="button" data-close>Cancelar</button></div>`, (form) => {
      $('[data-close]', form).onclick = () => sheet.close();
      form.querySelectorAll('[data-pay]').forEach((b) => (b.onclick = () => {
        const pay = b.dataset.pay;
        for (const t of list) Object.assign(t, { pay, paidAt: today(), updatedAt: Date.now() });
        if (c) c.lastPay = pay;
        sheet.close();
        refresh();
        toast('Cobrado');
      }));
    });
  }
  function collectForm(c) {
    const list = tripsOf(c.id).filter(owed).sort(byWhen);
    if (!list.length) { toast('No hay nada pendiente'); return; }
    openSheet(`<h2>Cobrar a ${esc(firstName(c))}</h2>
      <div class="wide picks">${list.map((t) => `<label class="pick row"><input type="checkbox" data-id="${t.id}" checked><span><b>${cap(fdate(t.date))}${t.time ? ' · ' + hour12(t.time) : ''}</b><small>${esc(shortRoute(t.from, t.to))}</small></span><em>${money(t.price)}</em></label>`).join('')}</div>
      ${field('Me pagó (opcional)', '<input name="amt" type="number" inputmode="decimal" min="0" step="1" placeholder="Ej. 300 · marca los más antiguos">', true)}
      <p class="wide total" id="ctot"></p>
      <span class="field wide">¿Cómo te pagó? <small>un toque cobra lo marcado</small></span>${payGrid(c)}
      <div class="buttons"><button type="button" data-close>Cancelar</button></div>`, (form) => {
      $('[data-close]', form).onclick = () => sheet.close();
      const checks = [...form.querySelectorAll('[data-id]')];
      const price = (ch) => +list.find((t) => t.id === ch.dataset.id).price;
      let left = 0;
      const tot = () => {
        const on = checks.filter((ch) => ch.checked);
        const amt = +form.elements.amt.value;
        $('#ctot', form).textContent = `Marcado: ${money(on.reduce((s, ch) => s + price(ch), 0))} · ${on.length} de ${list.length}${amt && left > 0 ? ` · sobran ${money(left)}` : ''}`;
      };
      form.elements.amt.addEventListener('input', () => {
        left = +form.elements.amt.value;
        if (!left) { checks.forEach((ch) => (ch.checked = true)); tot(); return; }
        let stop = false;
        checks.forEach((ch) => { if (!stop && price(ch) <= left) { ch.checked = true; left -= price(ch); } else { stop = true; ch.checked = false; } });
        tot();
      });
      checks.forEach((ch) => ch.addEventListener('change', () => { left = 0; tot(); }));
      tot();
      form.querySelectorAll('[data-pay]').forEach((b) => (b.onclick = () => {
        const picked = checks.filter((ch) => ch.checked).map((ch) => list.find((t) => t.id === ch.dataset.id));
        if (!picked.length) { toast('Marca al menos un viaje'); return; }
        const pay = b.dataset.pay;
        for (const t of picked) Object.assign(t, { pay, paidAt: today(), updatedAt: Date.now() });
        c.lastPay = pay;
        sheet.close();
        refresh();
        const rest = debtOf(c.id);
        toast(`Cobrado ${money(picked.reduce((s, t) => s + +t.price, 0))}${rest ? ` · le quedan ${money(rest)}` : ' · al día'}`);
      }));
    });
  }
  return { finishTrip, finishForm, payForm, collectForm };
}
