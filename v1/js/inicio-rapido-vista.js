// Pantalla del inicio rápido, sin poseer el estado principal de Clientela.
// Logo de la marca: la luz se enciende y se dibuja la ✓ (sin animación con «reducir movimiento»).
const LOGO = '<svg class="logo-ob" viewBox="0 0 112 72" aria-hidden="true"><rect x="2" y="2" width="108" height="68" rx="20" fill="#222826" stroke="#3A423F" stroke-width="1.6"/><circle class="luz" cx="32" cy="36" r="15" fill="#22C55E"/><path class="chk" d="M25 36.6l5 5L39.5 31" fill="none" stroke="#04210F" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="56" y="25" width="40" height="8" rx="4" fill="#F4F4EF"/><rect x="56" y="40" width="26" height="8" rx="4" fill="#5A625F"/></svg>';
export function createOnboardingView({ getData, getObStep, setObStep, getObDraft, setObDraft, top, tabs, view, icon, ONB, PROFILE_STEPS, stepHtml, wireStep, $, esc, toast, save, render, pickBackup, importContacts, clientForm }) {
  function renderOnboarding() {
      const data = getData();
      let obDraft = getObDraft();
      if (!obDraft) { obDraft = structuredClone(data.settings); setObDraft(obDraft); }
      const obStep = getObStep();
    top.innerHTML = '';
    tabs.innerHTML = '';
    const D = obDraft;
    const n = obStep;
    if (n === 0) {
      view.innerHTML = `<section class="ob"><div class="welcome">
        ${LOGO}
        <h2>Tus clientes, en orden.</h2>
        <ul class="benefits">
          <li><span class="ic">${icon('calc')}</span><div><b>Cotiza en segundos</b><span>Aunque vayas manejando.</span></div></li>
          <li><span class="ic">${icon('calendar')}</span><div><b>Que no se te olvide un viaje</b><span>Confirma y avisa por WhatsApp.</span></div></li>
          <li><span class="ic">${icon('wallet')}</span><div><b>Cobra todo</b><span>Sabes quién te debe y desde cuándo.</span></div></li>
        </ul></div>
        <button class="cta primary" data-go="1">Empezar · 1 minuto</button>
        <button class="skip" data-backup>Ya tengo una copia de mis datos</button></section>`;
    } else if (n <= ONB.length) {
      view.innerHTML = `<section class="ob"><div class="progress">${ONB.map((_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>
        <span class="steplabel">Paso ${n} de ${ONB.length} · ${PROFILE_STEPS[ONB[n - 1] - 1]}</span>
        <div class="pstep">${stepHtml(ONB[n - 1], D, { onboarding: true })}</div>
        <div class="nav"><button type="button" data-go="${n - 1}">Atrás</button><button type="button" class="primary" data-go="${n + 1}">${n === ONB.length ? 'Terminar' : 'Siguiente'}</button></div></section>`;
      wireStep($('.pstep', view), D, renderOnboarding);
    } else {
      view.innerHTML = `<section class="ob"><div class="done">${LOGO}
        <h2>¡Listo${D.driver ? ', ' + esc(D.driver) : ''}!</h2>
        <p class="muted">Tu perfil y tu tarifa quedaron guardados. Tu auto y cómo cobras los completas luego en Yo (toca tu inicial arriba).</p></div>
        <button class="cta primary" data-finish="client">${icon('plus')} Agrega tu primer cliente</button>
        ${'contacts' in navigator ? '<button class="cta" data-finish="contacts">Importar de mis contactos</button>' : ''}
        <button class="skip" data-finish="">Ir a mi agenda</button></section>`;
    }
    view.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => {
      const to = +b.dataset.go;
      if (n === 1 && to === 2 && !D.driver.trim()) { toast('Escribe tu nombre para firmar los mensajes'); $('[data-k=driver]', view).focus(); return; }
      if (n === 1 && to === 2 && String(D.phone || '').replace(/\D/g, '').length !== 10) { toast('Ingresa un WhatsApp válido de 10 dígitos'); $('[data-k=phone]', view).focus(); return; }
      if (to === ONB.length + 1) { data.settings = { ...D, onboarded: false }; save(); }
      setObStep(to);
      render();
    }));
    $('[data-backup]', view)?.addEventListener('click', pickBackup);
    view.querySelectorAll('[data-finish]').forEach((b) => (b.onclick = () => {
      data.settings.onboarded = true;
      setObDraft(null);
      setObStep(0);
      save();
      if (b.dataset.finish === 'contacts') return importContacts();
      location.hash = b.dataset.finish === 'client' ? '#/clientes' : '#/';
      render();
      if (b.dataset.finish === 'client') clientForm();
    }));
  }
  return renderOnboarding;
}
