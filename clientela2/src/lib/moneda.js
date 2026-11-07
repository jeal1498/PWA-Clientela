// Moneda de Clientela 2.0: símbolo, lado del símbolo, separadores y decimales. Por defecto pesos mexicanos ($1,250).
// Se guarda en settings.currency y en perfil_conductor (moneda, simbolo, simbolo_despues, sep_miles, sep_decimal, decimales).
export const MONEDA_MXN = { code: 'MXN', sym: '$', after: false, thou: ',', dec: '.', digits: 0 };
// code, símbolo, símbolo después, miles, decimal, decimales, nombre
export const MONEDAS = [
  ['MXN', '$', 0, ',', '.', 0, 'Peso mexicano'], ['USD', '$', 0, ',', '.', 2, 'Dólar'], ['COP', '$', 0, '.', ',', 0, 'Peso colombiano'],
  ['ARS', '$', 0, '.', ',', 0, 'Peso argentino'], ['CLP', '$', 0, '.', ',', 0, 'Peso chileno'], ['UYU', '$U', 0, '.', ',', 0, 'Peso uruguayo'],
  ['PEN', 'S/', 0, ',', '.', 2, 'Sol peruano'], ['BOB', 'Bs', 0, '.', ',', 2, 'Boliviano'], ['GTQ', 'Q', 0, ',', '.', 2, 'Quetzal'],
  ['CRC', '₡', 0, '.', ',', 0, 'Colón costarricense'], ['DOP', 'RD$', 0, ',', '.', 2, 'Peso dominicano'], ['BRL', 'R$', 0, '.', ',', 2, 'Real'],
  ['EUR', '€', 1, '.', ',', 2, 'Euro'],
].map(([code, sym, after, thou, dec, digits, name]) => ({ code, sym, after: !!after, thou, dec, digits, name }));

let C = { ...MONEDA_MXN };
export function setMoneda(c) {
  const o = c && typeof c === 'object' ? c : {};
  C = {
    code: /^[A-Z]{3}$/.test(o.code) ? o.code : 'MXN',
    sym: String(o.sym ?? '$').slice(0, 4) || '$',
    after: !!o.after,
    thou: [',', '.', ' ', "'", ''].includes(o.thou) ? o.thou : ',',
    dec: o.dec === ',' ? ',' : '.',
    digits: +o.digits === 2 ? 2 : 0,
  };
  if (C.thou === C.dec) C.thou = C.dec === ',' ? '.' : ',';
}
export const moneda = () => ({ ...C });
export const sym = () => C.sym;

/** Número con los separadores de la moneda. `digits` decimales fijos (por defecto los de la moneda). */
export function numero(n, digits = C.digits, c = C) {
  const v = Number.isFinite(+n) ? +n : 0;
  const [ent, frac = ''] = Math.abs(v).toFixed(digits).split('.');
  const miles = ent.replace(/\B(?=(\d{3})+(?!\d))/g, c.thou);
  return miles + (digits ? c.dec + frac : '');
}
const poner = (txt, c = C, neg = false) => `${neg ? '-' : ''}${c.after ? `${txt} ${c.sym}` : `${c.sym}${txt}`}`;
/** Monto en la moneda elegida, p. ej. «$1,250», «$12.50» o «12,50 €». */
export const money = (n, c = C) => poner(numero(Math.abs(+n || 0), c.digits, c), c, +n < 0 && +Math.abs(n).toFixed(c.digits) !== 0);
/** Tarifa (por km, por hora…): hasta 2 decimales sin ceros de sobra. */
export function rate(n) {
  const v = Math.round((+n || 0) * 100) / 100;
  return poner(numero(v, Number.isInteger(v) ? 0 : 2));
}
/** Monto con 2 decimales fijos (costos por km y similares). */
export const money2 = (n, c = C) => poner(numero(Math.abs(+n || 0), 2, c), c, +n < 0 && +Math.abs(n).toFixed(2) !== 0);
