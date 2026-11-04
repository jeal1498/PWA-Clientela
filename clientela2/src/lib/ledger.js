// Bitácora y gastos: resúmenes del día y de la semana. Funciones puras (probadas en ledger.test.js).
import { weekDays } from './dates.js';

export const PAY_METHODS = {
  efectivo: 'Efectivo',
  spei: 'Transferencia SPEI',
  tarjeta: 'Tarjeta',
};

export const EXPENSE_CATS = {
  combustible: { label: 'Combustible', emoji: '⛽' },
  casetas: { label: 'Casetas', emoji: '🛣️' },
  lavado: { label: 'Lavado / Mantenimiento', emoji: '🧽' },
  hormiga: { label: 'Gastos hormiga', emoji: '🥤' },
};

const sum = (xs, f) => xs.reduce((s, x) => s + (+f(x) || 0), 0);

/** Resumen de un conjunto de días: bruto, km, gastos, neto real y desglose. */
export function summarize(trips, expenses, days) {
  const set = new Set(days);
  const t = trips.filter((x) => set.has(x.date));
  const e = expenses.filter((x) => set.has(x.date));
  const gross = sum(t, (x) => x.amount);
  const km = sum(t, (x) => x.km);
  const spent = sum(e, (x) => x.amount);
  const byPay = Object.fromEntries(Object.keys(PAY_METHODS).map((k) => [k, sum(t.filter((x) => x.pay === k), (x) => x.amount)]));
  const byCat = Object.fromEntries(Object.keys(EXPENSE_CATS).map((k) => [k, sum(e.filter((x) => x.cat === k), (x) => x.amount)]));
  return {
    trips: t.length,
    gross,
    km: Math.round(km * 10) / 10,
    grossPerKm: km > 0 ? Math.round((gross / km) * 100) / 100 : 0,
    spent,
    net: gross - spent, // Ingresos de la bitácora − gastos = ganancia neta real
    byPay,
    byCat,
  };
}

export const daySummary = (trips, expenses, day) => summarize(trips, expenses, [day]);

/** Semana de lunes a domingo, con el total y cada día (para las barras). */
export function weekSummary(trips, expenses, ref = new Date()) {
  const days = weekDays(ref);
  return { days: days.map((d) => ({ date: d, ...summarize(trips, expenses, [d]) })), total: summarize(trips, expenses, days) };
}
