// Pantalla Yo: Mi tarjeta, tu perfil (datos, auto, tarifa, cobro) y los ajustes.
export function createMeView({ getData, header, setTabs, view, icon, esc, initials, $, today, daysBetween, editProfile, openCard, importContacts, ladaForm, placesForm, hojaForm, hojaOn, resetOnboarding }) {
  function renderMe() {
    const data = getData();
    const s = data.settings;
    header('Yo', { back: '#/' });
    setTabs('');
    const done = data.trips.filter((t) => t.status === 'hecho').length;
    const phone = String(s.phone || '').replace(/\D/g, '');
    const nicePhone = phone.length === 10 ? `${phone.slice(0, 2)} ${phone.slice(2, 6)} ${phone.slice(6)}` : s.phone;
    const nPlaces = (s.savedPlaces || []).length + data.clients.reduce((n, c) => n + (c.savedPlaces || []).length, 0);
    const row = (attrs, name, value) => `<button type="button" class="fila" ${attrs}><span class="n">${name}</span><span class="v">${value}</span>${icon('right')}</button>`;
    view.innerHTML = `
      <section class="hero"><span class="avatar big">${esc(initials(s.driver || '?'))}</span><h2>${esc(s.driver || 'Tu nombre')}</h2>
        <span class="muted mono">${data.clients.length} cliente${data.clients.length === 1 ? '' : 's'} · ${done} viaje${done === 1 ? '' : 's'}</span></section>
      <button type="button" class="micard" data-card><span class="ic">${icon('qr')}</span><span><b>Mi tarjeta</b><small>Enséñala para que te guarden</small></span>${icon('right')}</button>
      <section class="filas">
        ${row('data-edit="1"', 'Mis datos', esc([s.driver, nicePhone].filter(Boolean).join(' · ') || 'Completa'))}
        ${row('data-edit="2"', 'Mi auto', esc(s.car ? `${s.car} ${s.year}`.trim() : 'Agrégalo'))}
        ${row('data-edit="3"', 'Mi tarifa', `$${esc(s.perKm)}/km · $${esc(s.perHour)}/h`)}
        ${row('data-edit="4"', 'Cómo cobro', esc((s.pays || []).join(', ') || 'Sin elegir'))}
        ${row('data-places', 'Mis lugares', esc(nPlaces ? `${nPlaces} con nombre` : 'Casa, Trabajo…'))}
      </section>
      <section class="filas">
        ${row('data-hoja', 'Respaldo en Google Sheets', hojaOn() ? 'Conectado' : 'Conectar')}
        ${'contacts' in navigator ? row('data-contacts', 'Importar contactos', '') : ''}
        ${row('data-lada', 'Lada para WhatsApp', `+${esc(s.lada || '52')}`)}
        ${row('data-tour', 'Ver el inicio rápido otra vez', '')}
      </section>
      <p class="pie">Clientela · v2.0</p>`;
    view.querySelectorAll('[data-edit]').forEach((b) => (b.onclick = () => editProfile(+b.dataset.edit)));
    $('[data-card]', view).onclick = openCard;
    $('[data-hoja]', view).onclick = () => hojaForm();
    $('[data-contacts]', view)?.addEventListener('click', importContacts);
    $('[data-lada]', view).onclick = ladaForm;
    $('[data-places]', view).onclick = placesForm;
    $('[data-tour]', view).onclick = resetOnboarding;
  }
  return renderMe;
}
