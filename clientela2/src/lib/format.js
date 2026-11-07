// Formatos para México. El dinero sigue la moneda elegida en Ajustes (lib/moneda.js; por defecto pesos).
export { money, money2, rate, sym } from './moneda.js';
export const kmText = (n) => `${(+n || 0).toFixed(1)} km`;
export function minText(m) {
  m = Math.round(+m || 0);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ''}`.trim();
}
export function dateText(d, t) {
  if (!d) return t || '';
  const dt = new Date(`${d}T${t || '12:00'}`);
  const day = dt.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  return t ? `${day}, ${t} h` : day;
}
/** Solo dígitos; antepone la lada si el número es de 10 dígitos. */
export function waNumber(phone, lada = '52') {
  const d = String(phone || '').replace(/\D/g, '');
  if (!d) return '';
  return d.length === 10 ? `${lada}${d}` : d;
}
