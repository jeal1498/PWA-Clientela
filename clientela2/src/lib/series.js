// Viajes frecuentes: un viaje agendado puede repetirse algunos días de la semana con el mismo horario y precio.
// Cada copia lleva `serie` (id del primero), `dias` (0 = lunes … 6 = domingo) y `fin` ('YYYY-MM-DD' o null). Funciones puras.
import { ymd } from './dates.js';

export const DIAS_CORTO = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
export const HORIZON_DAYS = 28; // se agendan solos los próximos 28 días

const parse = (iso) => new Date(`${iso}T12:00`);
const addDays = (iso, n) => { const d = parse(iso); d.setDate(d.getDate() + n); return ymd(d); };
/** 0 = lunes … 6 = domingo. */
export const weekdayIdx = (iso) => (parse(iso).getDay() + 6) % 7;
export const diasTexto = (dias = []) => [...dias].sort((a, b) => a - b).map((i) => DIAS_CORTO[i]).join(', ');

/** Id determinista de una copia: nunca se duplica ni reaparece una cancelada. */
export const copyId = (serie, date) => `${serie}-${date}`;

/** Fechas (desde `desde`, inclusive) que cumplen los días y no pasan de `fin`. Máximo `max`. */
export function datesOf(desde, dias, fin, max = 60, span = 400) {
  const out = [];
  for (let i = 0; i <= span && out.length < max; i++) {
    const d = addDays(desde, i);
    if (fin && d > fin) break;
    if (dias.includes(weekdayIdx(d))) out.push(d);
  }
  return out;
}

/** Fecha del último viaje al cabo de `weeks` semanas desde `desde` (para «Termina tras N semanas»). */
export const finAfterWeeks = (desde, weeks) => addDays(desde, weeks * 7 - 1);

/**
 * Copias que faltan: para cada serie toma su viaje más reciente como molde y crea las fechas hasta
 * hoy + HORIZON_DAYS. No crea nada anterior a hoy ni lo que ya existe (aunque esté cancelado o hecho).
 */
export function missingCopies(trips, todayIso, newStamp = () => new Date().toISOString()) {
  const bySerie = new Map();
  for (const t of trips) if (t.serie) (bySerie.get(t.serie) || bySerie.set(t.serie, []).get(t.serie)).push(t);
  const limit = addDays(todayIso, HORIZON_DAYS);
  const out = [];
  for (const [serie, list] of bySerie) {
    const tpl = list.reduce((a, b) => (b.date > a.date ? b : a));
    if (!tpl.repite || !tpl.dias?.length) continue;
    const have = new Set(list.map((t) => t.date));
    const first = list.reduce((a, b) => (b.date < a.date ? b : a)).date;
    const from = todayIso > first ? todayIso : first;
    for (const d of datesOf(from, tpl.dias, tpl.fin && tpl.fin < limit ? tpl.fin : limit)) {
      if (have.has(d) || trips.some((t) => t.id === copyId(serie, d))) continue;
      out.push({
        id: copyId(serie, d), createdAt: newStamp(), status: 'agendado', pay: '', date: d, time: tpl.time, dur: tpl.dur,
        clientId: tpl.clientId || '', clientName: tpl.clientName || '', clientPhone: tpl.clientPhone || '', from: tpl.from || '', to: tpl.to || '',
        km: tpl.km || 0, amount: tpl.amount || 0, repite: true, serie, dias: tpl.dias, fin: tpl.fin || null,
      });
    }
  }
  return out;
}

/** Parches para detener la serie: cancela lo agendado sin avance después de hoy y pone `fin` = hoy en todos. */
export function stopPatches(trips, serie, todayIso) {
  return trips.filter((t) => t.serie === serie).map((t) => {
    const cancel = t.status === 'agendado' && t.date > todayIso && !t.confirmedAt;
    return { id: t.id, patch: { fin: todayIso, ...(cancel ? { status: 'cancelado' } : {}) }, undo: { fin: t.fin ?? null, status: t.status } };
  });
}
