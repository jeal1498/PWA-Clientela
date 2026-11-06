// Fechas locales como 'YYYY-MM-DD' (sin líos de zona horaria con toISOString).
const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hm = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const today = () => ymd();

/** Lunes de la semana de `d` (semana de lunes a domingo). */
export function weekStart(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

/** Los 7 días (YYYY-MM-DD) de la semana de `d`. */
export function weekDays(d = new Date()) {
  const s = weekStart(d);
  return Array.from({ length: 7 }, (_, i) => ymd(new Date(s.getFullYear(), s.getMonth(), s.getDate() + i)));
}

export const dayShort = (iso) => new Date(`${iso}T12:00`).toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '');
export const dayLong = (iso) => new Date(`${iso}T12:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });

/** Fecha y hora por defecto de un viaje programado: la próxima media hora en punto (los viajes siempre se programan). */
export function nextSlot(now = new Date()) {
  const d = new Date(now.getTime() + 15 * 60000); // al menos 15 min de margen
  const m = d.getMinutes();
  d.setMinutes(m === 0 || m === 30 ? m : m < 30 ? 30 : 60, 0, 0);
  return { date: ymd(d), time: hm(d) };
}
export const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return ymd(d); };
