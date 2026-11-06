// Recordatorios de viajes agendados. Funciones puras (probadas en recordar.test.js).
import { ymd } from './dates.js';

const addDays = (iso, n) => { const d = new Date(`${iso}T12:00`); d.setDate(d.getDate() + n); return ymd(d); };

/** «hoy», «mañana» o null (más lejos) respecto a `todayIso`. */
export const cuandoDe = (date, todayIso) => (date === todayIso ? 'hoy' : date === addDays(todayIso, 1) ? 'mañana' : null);

/** Viajes agendados de mañana que aún no se avisaron. */
export const sinAvisarManana = (trips, todayIso) => trips.filter((t) => t.status === 'agendado' && t.date === addDays(todayIso, 1) && !t.recordadoAt);

/** «Avisado hoy 8:12», «Avisado ayer 8:12» o «Avisado 5 nov 8:12». */
export function avisadoTexto(iso, now = new Date()) {
  const d = new Date(iso);
  const hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  const dia = ymd(d), hoy = ymd(now);
  const lab = dia === hoy ? 'hoy' : dia === addDays(hoy, -1) ? 'ayer' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
  return `Avisado ${lab} ${hm}`;
}
