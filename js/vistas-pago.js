// Plantillas compartidas para seleccionar métodos de pago.
export const PAYS = [['', 'Me debe'], ['efectivo', 'Efectivo'], ['transferencia', 'Transferencia'], ['tarjeta', 'Tarjeta']];
export const seg = (name, opts, val) => `<div class="seg" role="radiogroup">${opts.map(([v, l]) => `<label><input type="radio" name="${name}" value="${v}" ${v === val ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;

export const PAY_LABEL = { efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta' };
// Botones de forma de pago; la habitual del cliente va primero.
export function payGrid(c, { debt = false } = {}) {
  const order = Object.keys(PAY_LABEL);
  const hab = c?.lastPay && PAY_LABEL[c.lastPay] ? c.lastPay : '';
  if (hab) { order.splice(order.indexOf(hab), 1); order.unshift(hab); }
  return `<div class="paygrid">${order.map((k) => `<button type="button" data-pay="${k}" class="${k === hab ? 'hab' : ''}">${PAY_LABEL[k]}${k === hab ? '<small>habitual</small>' : ''}</button>`).join('')}${debt ? '<button type="button" data-pay="" class="debt">Me debe</button>' : ''}</div>`;
}
