// Vistas del inicio rápido y del editor de perfil.
import { esc } from './utilidades.js';
import { EXTRAS_INFO, PRESETS } from './calculos.js';

export const PROFILE_STEPS = ['Tú', 'Tu auto', 'Tu tarifa', 'Cómo cobras'];
export const CAR_EXTRAS = ['Aire acondicionado', 'Cajuela amplia', 'Acepta mascotas', 'Silla para bebé', 'Factura'];
export const PAY_OPTS = ['Efectivo', 'Transferencia', 'Tarjeta'];
// Al inicio solo se pide lo esencial (tú y tu tarifa). Auto y forma de cobro se completan en Mi perfil.
export const ONB = [1, 3];
const chipsOf = (list, sel, key) => `<div class="chips wrap">${list.map((x) => `<button type="button" aria-pressed="${sel.includes(x)}" data-toggle="${key}" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>`;
const pin = (k, label, val, attrs = '') => `<label class="field">${label}<input data-k="${k}" value="${esc(val)}" ${attrs}></label>`;

// Campos de cada paso; los usan el inicio rápido y «Editar» del perfil.
// En el inicio rápido la ciudad no se pide (se completa luego en Mis datos).
export function stepHtml(n, D, { onboarding = false } = {}) {
  if (n === 1) return `<h2>¿Cómo te llamas?</h2><div class="pbody">
    ${pin('driver', 'Tu nombre o apodo', D.driver, 'placeholder="Ej. Lalo" autocomplete="given-name"')}
    ${pin('phone', 'Tu WhatsApp', D.phone, 'type="tel" inputmode="numeric" maxlength="10" pattern="[0-9]{10}" placeholder="10 dígitos"')}
    ${onboarding ? '' : pin('city', 'Ciudad donde trabajas <small>(opcional)</small>', D.city, 'placeholder="Ej. la ciudad donde trabajas"')}
    <small class="muted">Tu nombre firma los mensajes${onboarding ? '' : '. La ciudad ayuda a encontrar direcciones'}.</small></div>`;
  if (n === 2) return `<h2>Tu auto</h2><div class="pbody">
    ${pin('car', 'Marca y modelo', D.car, 'placeholder="Ej. Nissan Versa"')}
    <div class="row2">${pin('year', 'Año', D.year, 'inputmode="numeric" maxlength="4"')}${pin('color', 'Color', D.color)}</div>
    ${pin('plates', 'Placas <small>(opcional, solo tú las ves)</small>', D.plates, 'placeholder="ABC-123-D" style="text-transform:uppercase"')}
    <div class="field">Pasajeros<span class="stepper"><button type="button" data-seats="-1" aria-label="Menos">−</button><b>${D.seats}</b><button type="button" data-seats="1" aria-label="Más">+</button></span></div>
    <div class="field">Qué ofreces${chipsOf(CAR_EXTRAS, D.extras, 'extras')}</div></div>`;
  if (n === 3) return `<h2>¿Cuánto cobras?</h2><div class="pbody">
    <p class="muted">Como en Checa: tu meta por km y por hora. El precio usa la que deje más.</p>
    <div class="field">Empieza con una tarifa${chipsOf(Object.keys(PRESETS), Object.keys(PRESETS).filter((k) => PRESETS[k].join() === [D.perKm, D.perHour].join()), 'preset')}</div>
    <div class="row2">${pin('perKm', 'Por km $', D.perKm, 'type="number" inputmode="decimal" step="0.5" min="0"')}${pin('perHour', 'Por hora $', D.perHour, 'type="number" readonly aria-readonly="true" tabindex="-1"')}</div>
    <details class="more" ${Object.values(D.extra).some((x) => x.on) ? 'open' : ''}><summary>Más detalles <small>opcional</small></summary>
      ${EXTRAS_INFO.map(([k, l, u, h]) => `<div class="opt"><label class="sw"><input type="checkbox" data-on="${k}" ${D.extra[k].on ? 'checked' : ''}><span>${l}<small>${h}</small></span></label>
        ${D.extra[k].on ? `<label class="unit"><input data-x="${k}" type="number" inputmode="decimal" min="0" value="${D.extra[k].v}" aria-label="${l}"><span>${u}</span></label>` : ''}</div>`).join('')}
    </details>
    <div class="example" data-ex></div></div>`;
  if (n === 4) return `<h2>¿Cómo te pagan?</h2><div class="pbody">
    ${chipsOf(PAY_OPTS, D.pays, 'pays')}
    ${D.pays.includes('Transferencia') ? `${pin('holder', 'Nombre completo del titular', D.holder, 'placeholder="Como aparece en tu cuenta" autocomplete="name"')}<div class="row2">${pin('bank', 'Banco', D.bank, 'placeholder="Ej. BBVA"')}${pin('clabe', 'CLABE o tarjeta', D.clabe, 'inputmode="numeric"')}</div>` : ''}
    <div class="field">Así se ve tu recordatorio de cobro</div><div class="bubble" data-bubble></div></div>`;
  return '';
}
