// Formatos para México.
const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const mxn2 = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const money = (n) => mxn.format(Math.round(+n || 0));
export const money2 = (n) => mxn2.format(+n || 0);
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
