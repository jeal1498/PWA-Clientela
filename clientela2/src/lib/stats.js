// Resumen de ganancias y metas. Funciones puras (probadas en stats.test.js). Solo cuentan los viajes hechos (ver ledger.js).
import { ymd, weekStart } from './dates.js';
import { summarize } from './ledger.js';
import { isDone } from './agenda.js';
import { weekdayIdx } from './series.js';

const d12 = (iso) => new Date(`${iso}T12:00`);
const addDays = (iso, n) => { const d = d12(iso); d.setDate(d.getDate() + n); return ymd(d); };
const daysBetween = (a, b) => { const out = []; for (let d = a; d <= b; d = addDays(d, 1)) out.push(d); return out; };

/** Periodos (actual y anterior) de la semana (lunes a domingo) o del mes que contiene `refIso`. */
export function periods(kind, refIso) {
  if (kind === 'sem') {
    const desde = ymd(weekStart(d12(refIso)));
    return { desde, hasta: addDays(desde, 6), prev: { desde: addDays(desde, -7), hasta: addDays(desde, -1) } };
  }
  const r = d12(refIso);
  const desde = ymd(new Date(r.getFullYear(), r.getMonth(), 1));
  const hasta = ymd(new Date(r.getFullYear(), r.getMonth() + 1, 0));
  return { desde, hasta, prev: { desde: ymd(new Date(r.getFullYear(), r.getMonth() - 1, 1)), hasta: addDays(desde, -1) } };
}

/** Meta del día, de la semana y del mes. Si solo hay una, las otras se derivan (6 días de trabajo por semana). */
export function goalsOf({ dayNet = 0, weekNet = 0 } = {}) {
  const dia = +dayNet || (+weekNet ? Math.round(+weekNet / 6) : 0);
  const sem = +weekNet || dia * 6;
  return { dia, sem, mes: Math.round((sem * 52) / 12) };
}

const labelOf = (t) => [t.from, t.to].filter(Boolean).join(' → ');
function group(done, keyOf) {
  const m = new Map();
  for (const t of done) {
    const k = keyOf(t);
    if (!k) continue;
    const g = m.get(k) || { name: k, total: 0, n: 0 };
    g.total += +t.amount || 0; g.n += 1; m.set(k, g);
  }
  return [...m.values()].sort((a, b) => b.total - a.total);
}

/** Totales del periodo, barras (por día en la semana, por semana en el mes) y rankings por cliente y ruta. */
export function resumen(trips, expenses, kind, refIso) {
  const p = periods(kind, refIso);
  const days = daysBetween(p.desde, p.hasta);
  const total = summarize(trips, expenses, days);
  const prev = summarize(trips, expenses, daysBetween(p.prev.desde, p.prev.hasta));
  let bars;
  if (kind === 'sem') bars = days.map((d) => ({ label: ['L', 'M', 'M', 'J', 'V', 'S', 'D'][weekdayIdx(d)], date: d, net: summarize(trips, expenses, [d]).net }));
  else {
    const chunks = [];
    for (let i = 0; i < days.length; ) { const len = i === 0 ? 7 - weekdayIdx(days[0]) : 7; chunks.push(days.slice(i, i + len)); i += len; }
    bars = chunks.map((c, i) => ({ label: `S${i + 1}`, date: c[0], net: summarize(trips, expenses, c).net }));
  }
  const set = new Set(days);
  const done = trips.filter((t) => isDone(t) && set.has(t.date));
  return {
    ...p, net: total.net, gross: total.gross, spent: total.spent, trips: total.trips, prevNet: prev.net,
    delta: prev.net > 0 ? Math.round(((total.net - prev.net) / prev.net) * 100) : null,
    bars, clientes: group(done, (t) => t.clientName || 'Sin nombre'), rutas: group(done, labelOf),
  };
}

/** Días que quedan del periodo, contando hoy (para «te faltan $X por día»). */
export function daysLeft(kind, todayIso) {
  const p = periods(kind, todayIso);
  return daysBetween(todayIso, p.hasta).length;
}
