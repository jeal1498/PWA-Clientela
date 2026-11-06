// Estado Disponible / Ocupado del conductor, calculado con su agenda (solo dentro de la app). Funciones puras.
import { isScheduled, slot, endTime } from './agenda.js';
import { ymd } from './dates.js';

export const MODOS = [
  { key: 'auto', label: 'Automático · según mi agenda' },
  { key: 'libre', label: 'Disponible (a mano)' },
  { key: 'ocupado', label: 'Ocupado (a mano)' },
];

/** { ocupado, texto, detalle } en el momento `now`. `modo`: 'auto' | 'libre' | 'ocupado'. */
export function estadoAhora(trips, now = new Date(), modo = 'auto') {
  if (modo === 'libre') return { ocupado: false, texto: 'Disponible', detalle: 'Lo pusiste a mano' };
  if (modo === 'ocupado') return { ocupado: true, texto: 'Ocupado', detalle: 'Lo pusiste a mano' };
  const hoy = ymd(now);
  const min = now.getHours() * 60 + now.getMinutes();
  const deHoy = trips.filter((t) => isScheduled(t) && t.date === hoy).sort((a, b) => a.time.localeCompare(b.time));
  // En viaje: dentro de su horario, o ya llegaste y no lo has terminado aunque se pase de hora.
  const en = deHoy.find((t) => { const [a, b] = slot(t); return (min >= a && min < b) || (t.arrivedAt && min >= a); });
  if (en) {
    const fin = slot(en)[1];
    return { ocupado: true, texto: 'Ocupado', detalle: `En viaje con ${en.clientName || 'un cliente'}${min < fin ? ` hasta ${endTime(en)}` : ''}` };
  }
  const sig = deHoy.find((t) => slot(t)[0] > min);
  return { ocupado: false, texto: 'Disponible', detalle: sig ? `Siguiente viaje a las ${sig.time}` : 'Sin más viajes hoy' };
}
