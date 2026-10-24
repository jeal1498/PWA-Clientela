// Interacciones de los campos del inicio rápido y previsualizaciones.
export function createStepHandlers({ quote, money, calcTable, $, numOr, PRESETS }) {
  function liveStep(root, D) {
    const ex = $('[data-ex]', root);
    if (ex) { const q = quote(18, 30, { airport: true }, D); ex.innerHTML = `<small>Ejemplo: Centro → Aeropuerto · 18 km · 30 min</small><span class="big">${money(q.total)}</span>${calcTable(q)}`; }
    const b = $('[data-bubble]', root);
    if (b) {
      const p = quote(18, 30, { airport: true }, D).total;
      const to = D.pays.includes('Transferencia') && D.clabe ? `\nTransferencia: ${[D.bank, D.clabe].filter(Boolean).join(' ')}` : '';
      b.textContent = `Hola Ana, te comparto lo pendiente:\n• 12 oct · Centro → Aeropuerto: ${money(p)}\nTotal: ${money(p)}.${to}\n¡Gracias!\n— ${D.driver || 'Tu nombre'}`;
    }
  }
  // Conecta los campos de un paso con el borrador D; redraw vuelve a pintar el paso.
  function wireStep(root, D, redraw) {
    root.oninput = (e) => {
      const el = e.target;
      if (el.dataset.x) D.extra[el.dataset.x].v = +el.value || 0;
      else if (el.dataset.k) {
        D[el.dataset.k] = el.type === 'number' ? numOr(el.value, 0) : el.value;
        if (el.dataset.k === 'perKm') { D.perHour = D.perKm * 20; const hour = $('[data-k=perHour]', root); if (hour) hour.value = D.perHour; }
        if (el.dataset.k === 'perKm') root.querySelectorAll('[data-toggle=preset]').forEach((b) => b.setAttribute('aria-pressed', PRESETS[b.dataset.v].join() === [D.perKm, D.perHour].join()));
        if (el.dataset.k === 'clabe' || el.dataset.k === 'bank' || el.dataset.k === 'driver') liveStep(root, D);
      }
      liveStep(root, D);
    };
    root.onchange = (e) => { if (e.target.dataset.on) { D.extra[e.target.dataset.on] = { ...D.extra[e.target.dataset.on], on: e.target.checked }; redraw(); } };
    root.addEventListener('click', (e) => {
      const t = e.target.closest('button');
      if (!t || !root.contains(t)) return;
      if (t.dataset.seats) { D.seats = Math.min(15, Math.max(1, D.seats + +t.dataset.seats)); redraw(); }
      else if (t.dataset.toggle === 'preset') { [D.perKm, D.perHour] = PRESETS[t.dataset.v]; redraw(); }
      else if (t.dataset.toggle) {
        const list = D[t.dataset.toggle], v = t.dataset.v;
        list.includes(v) ? list.splice(list.indexOf(v), 1) : list.push(v);
        redraw();
      }
    });
    liveStep(root, D);
  }
  return { liveStep, wireStep };
}
