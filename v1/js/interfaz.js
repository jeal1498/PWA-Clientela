// Encabezado (título, Mi tarjeta y Yo), barra inferior con el botón + al centro y avisos.
export function createShell({ getData, top, tabs, icon, esc, initials, owed, lateDebt, $, onCard, onPlus }) {
  let toastTimer;
  // Pestañas principales: título grande, botón QR (Mi tarjeta) y avatar (Yo).
  // Pantallas internas (back): volver, título centrado y una acción opcional.
  function header(title, { back, action } = {}) {
    const data = getData();
    top.classList.toggle('sub', !!back);
    top.innerHTML = back
      ? `<a class="iconbtn" href="${back}" aria-label="Volver">${icon('back')}</a><h1>${esc(title)}</h1>${action ? `<a class="iconbtn" href="${action.href}" aria-label="${action.label}">${icon(action.icon)}</a>` : '<span></span>'}`
      : `<h1>${esc(title)}</h1><button type="button" class="qrbtn" data-card aria-label="Mi tarjeta">${icon('qr')}</button>
        <a class="me" href="#/yo" aria-label="Yo">${data.settings.driver ? esc(initials(data.settings.driver)) : icon('users')}</a>`;
    $('[data-card]', top)?.addEventListener('click', onCard);
  }
  function setTabs(on) {
    const data = getData();
    const debtors = new Set(data.trips.filter(owed).map((t) => t.clientId)).size;
    const late = data.trips.some(lateDebt);
    const tab = (h, ic, l, k, extra = '') => `<a href="${h}" class="${on === k ? 'on' : ''}" ${on === k ? 'aria-current="page"' : ''}>${icon(ic)}${l}${extra}</a>`;
    tabs.innerHTML = tab('#/', 'calendar', 'Agenda', 'agenda') + tab('#/clientes', 'users', 'Clientes', 'clientes')
      + `<button type="button" class="plus" data-plus aria-label="Agregar: cotizar, agendar o cliente nuevo">${icon('plus')}</button>`
      + tab('#/cobros', 'wallet', 'Cobros', 'cobros', debtors ? `<span class="dot ${late ? 'late' : ''}">${debtors}</span>` : '') + tab('#/resumen', 'chart', 'Resumen', 'resumen');
    $('[data-plus]', tabs).onclick = onPlus;
  }
  function toast(msg, act) {
    const t = $('#toast');
    t.textContent = msg;
    if (act) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = act.label;
      b.onclick = () => { clearTimeout(toastTimer); t.classList.remove('on', 'act'); act.fn(); };
      t.append(b);
    }
    t.classList.toggle('act', !!act);
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('on', 'act'), act ? 7000 : 1800);
  }
  return { header, setTabs, toast };
}
