// Agenda de viajes. Un viaje agendado vive en `trips` con status 'agendado' (o 'cancelado'); sin status = hecho.
// Funciones puras (probadas en agenda.test.js).
export const MIN_SLOT = 30; // un viaje ocupa al menos 30 min

export const isDone = (t) => !t.status || t.status === 'hecho';
export const isScheduled = (t) => t.status === 'agendado';

const toMin = (hm) => { const [h, m] = String(hm || '00:00').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
export const hmOf = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** [inicio, fin] en minutos del día. */
export const slot = (t) => { const s = toMin(t.time); return [s, s + Math.max(MIN_SLOT, +t.dur || 0)]; };
export const endTime = (t) => hmOf(slot(t)[1]);

/** Viajes agendados que se pisan con `x` (mismo día; no cuenta a sí mismo). */
export function clashes(trips, x) {
  const [a0, a1] = slot(x);
  return trips.filter((o) => isScheduled(o) && o.id !== x.id && o.date === x.date && (() => { const [b0, b1] = slot(o); return a0 < b1 && b0 < a1; })());
}

/** Avance del viaje: 0 agendado, 1 confirmado, 2 ya llegué. */
export const stepOf = (t) => (t.arrivedAt ? 2 : t.confirmedAt ? 1 : 0);
export const STEP_LABELS = ['Confirmar', 'Ya llegué', 'Terminar'];

/** Parche para avanzar un paso (0→1, 1→2). El paso 2 se termina con finishPatch. */
export function advancePatch(t, nowIso) {
  const s = stepOf(t);
  return s === 0 ? { confirmedAt: nowIso } : s === 1 ? { arrivedAt: nowIso } : {};
}
/** Terminar: pasa a la bitácora con su pago ('' = me debe). */
export const finishPatch = (pay, day) => ({ status: 'hecho', pay, paidAt: pay ? day : null });
/** Deshacer terminar o cancelar. */
export const reopenPatch = () => ({ status: 'agendado', pay: '', paidAt: null });
export const cancelPatch = () => ({ status: 'cancelado' });

/** Agendados ordenados por fecha y hora. */
export const upcoming = (trips) => trips.filter(isScheduled).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
