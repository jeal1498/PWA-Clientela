// Mi tarjeta: pantalla completa con el QR grande para que te escaneen y te guarden.
// El QR abre tarjeta.html con tus datos dentro del enlace (sin servidor).
export function createCardView({ getData, view, icon, esc, $, toast, cardUrl, qrSvg, openSettings }) {
  let lock = null;
  async function renderCard() {
    const s = getData().settings;
    if (!s.driver.trim()) { toast('Escribe tu nombre en Mis datos'); location.hash = '#/yo'; return; }
    view.innerHTML = `<section class="micarta">
      <div class="mc-top"><a class="iconbtn" href="#/" aria-label="Cerrar">${icon('close')}</a></div>
      <div class="mc-quien"><h2>${esc(s.driver)}</h2><span class="muted">Chofer privado</span></div>
      <div class="mc-qr" id="mcqr" aria-label="Código QR de mi tarjeta"></div>
      <div class="mc-quien"><b>Escanea con tu cámara</b><span class="muted">y guarda mi contacto</span></div>
      <div class="mc-acc">
        <button type="button" class="grande" data-send>${icon('wa')} Mandar por WhatsApp</button>
        <button type="button" class="ghost" data-copy>Copiar enlace</button>
        <button type="button" class="ghost" data-what>Qué se ve en mi tarjeta ${icon('right')}</button>
      </div></section>`;
    const url = await cardUrl();
    try {
      const qr = qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      $('#mcqr', view).innerHTML = qrSvg(qr);
    } catch { $('#mcqr', view).innerHTML = '<p class="muted">Hay demasiados datos para el QR. Quita rutas o el horario en «Qué se ve».</p>'; }
    const text = `Hola, soy ${s.driver.trim()}, chofer privado. Aquí está mi tarjeta para que me guardes y me pidas tus viajes:\n${url}`;
    $('[data-send]', view).onclick = () => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    $('[data-copy]', view).onclick = async () => { try { await navigator.clipboard.writeText(url); toast('Enlace copiado'); } catch { toast('No se pudo copiar'); } };
    $('[data-what]', view).onclick = openSettings;
    // Que la pantalla no se apague mientras te escanean.
    try { lock = await navigator.wakeLock?.request('screen'); } catch { lock = null; }
  }
  window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/tarjeta')) { lock?.release?.(); lock = null; } });
  return renderCard;
}
