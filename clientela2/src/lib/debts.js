// Cobros: viajes hechos sin pago (pay === ''). Funciones puras (probadas en debts.test.js).
import { isDone } from './agenda.js';
export const LATE_DAYS = 15; // rojo desde 15 días sin cobrar

export const isDebt = (t) => isDone(t) && !t.pay; // un viaje agendado aún no es deuda

const norm = (s) => String(s || '').trim().toLowerCase();
const dayMs = 86400000;
const parse = (iso) => new Date(`${iso}T12:00`).getTime();

/** Días enteros de `iso` a `todayIso` (nunca negativo). */
export const daysSince = (iso, todayIso) => Math.max(0, Math.round((parse(todayIso) - parse(iso)) / dayMs));

/** Deudas agrupadas por cliente (id, o nombre si no hay id). Atrasados primero, luego por monto. */
export function debtsByClient(trips, todayIso, lateDays = LATE_DAYS) {
  const map = new Map();
  for (const t of trips.filter(isDebt)) {
    const key = t.clientId || `n:${norm(t.clientName)}`;
    if (!map.has(key)) map.set(key, { key, clientId: t.clientId || '', name: t.clientName || 'Sin nombre', trips: [] });
    map.get(key).trips.push(t);
  }
  const list = [...map.values()].map((g) => {
    g.trips.sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    const total = g.trips.reduce((s, t) => s + (+t.amount || 0), 0);
    const days = daysSince(g.trips[0].date, todayIso);
    return { ...g, total, days, late: days >= lateDays };
  });
  return list.sort((a, b) => Number(b.late) - Number(a.late) || b.total - a.total);
}

/** Totales: pendiente y atrasado. */
export function debtTotals(groups) {
  return {
    total: groups.reduce((s, g) => s + g.total, 0),
    late: groups.filter((g) => g.late).reduce((s, g) => s + g.total, 0),
  };
}

/** Parche para cobrar un viaje. */
export const paidPatch = (pay, paidAt) => ({ pay, paidAt });
/** Parche para deshacer el cobro. */
export const unpaidPatch = () => ({ pay: '', paidAt: null });
