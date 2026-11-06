// Hoy (/app): estado, siguiente viaje, lo que te deben y el saldo del día.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, CalendarPlus, ChevronRight } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { upcoming, stepOf, STEP_LABELS, advancePatch, endTime } from '../lib/agenda.js';
import { debtsByClient, debtTotals } from '../lib/debts.js';
import { cuandoDe } from '../lib/recordar.js';
import { daySummary } from '../lib/ledger.js';
import { today, hm } from '../lib/dates.js';
import { money } from '../lib/format.js';
import { Button, cx } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';
import EstadoAhora from '../components/EstadoAhora.jsx';
import ExpenseQuick from '../components/ExpenseQuick.jsx';
import TripSheet from '../components/TripSheet.jsx';

const label = 'text-xs font-bold tracking-widest uppercase';

/** «en 42 min», «en 2 h», «hoy», «mañana» o la fecha corta. */
function cuando(t, now = new Date()) {
  const d = new Date(`${t.date}T${t.time || '00:00'}`);
  const min = Math.round((d - now) / 60000);
  if (t.date === today() && min >= 0 && min < 60) return `en ${min} min`;
  if (t.date === today() && min >= 60) return `en ${Math.floor(min / 60)} h`;
  if (t.date === today()) return 'ya es hora';
  return cuandoDe(t.date, today()) || d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '');
}

function NextTrip({ trip, onAdvance }) {
  if (!trip) {
    return (
      <section className="rounded-3xl bg-hueso p-4 text-asfalto" aria-label="Siguiente viaje">
        <div className={cx(label, 'text-[#55555e]')}>Siguiente viaje</div>
        <div className="mt-1 font-titulo text-xl">Sin viajes agendados</div>
        <Link to="/app/viajes?s=porhacer" className="mt-3 flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-cobrado text-base font-bold text-[#04210f]"><CalendarPlus className="size-5" aria-hidden /> Agendar un viaje</Link>
      </section>
    );
  }
  const s = stepOf(trip);
  return (
    <section className="space-y-2 rounded-3xl bg-hueso p-4 text-asfalto" aria-label="Siguiente viaje">
      <div className="flex items-baseline justify-between gap-2"><span className={cx(label, 'text-[#55555e]')}>Siguiente viaje</span><span className="font-mono text-xs font-medium text-[#55555e]">{cuando(trip)}</span></div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[34px] leading-none font-bold tracking-tight tabular-nums">{trip.time}<small className="ml-2 text-xs font-medium text-[#55555e]">→ {endTime(trip)}</small></span>
        <span className="font-mono text-[15px] font-bold tabular-nums">{money(trip.amount)}</span>
      </div>
      <div className="min-w-0"><b className="block truncate font-titulo text-lg">{trip.clientName || 'Sin nombre'}</b><span className="block truncate text-sm text-[#3a3a45]">{[trip.from, trip.to].filter(Boolean).join(' → ') || '—'}</span></div>
      <Button className="h-[52px] w-full rounded-2xl bg-cobrado text-base font-bold text-[#04210f]" onClick={() => onAdvance(trip)}>{STEP_LABELS[s]}</Button>
      <Link to="/app/viajes?s=porhacer" className="flex min-h-11 items-center justify-center rounded-xl border border-[#c9c9c2] text-sm font-medium">Ver agenda · recordar o cancelar</Link>
    </section>
  );
}

function Debts() {
  const { trips } = useStore();
  const groups = debtsByClient(trips, today());
  if (!groups.length) {
    return <Link to="/app/clientes?f=debe" className="flex min-h-16 items-center justify-between rounded-2xl border border-cobrado/30 bg-cobrado/10 px-4 text-cobrado"><b className="font-titulo text-[15px]">Nadie te debe</b><ChevronRight className="size-5" aria-hidden /></Link>;
  }
  const { total, late } = debtTotals(groups);
  const lateN = groups.filter((g) => g.late).length;
  return (
    <Link to="/app/clientes?f=debe" className={cx('flex min-h-16 items-center justify-between gap-3 rounded-2xl px-4 py-3', late ? 'bg-atrasado text-white' : 'bg-tedebe text-[#231c00]')} aria-label={`Te deben ${money(total)}`}>
      <span><b className="block font-titulo text-[15px]">Te deben</b><small className="block text-xs opacity-90">{groups.length} {groups.length === 1 ? 'cliente' : 'clientes'}{lateN ? ` · ${lateN} atrasado${lateN === 1 ? '' : 's'}` : ''}</small></span>
      <span className="flex items-center gap-1 font-mono text-2xl font-bold tabular-nums">{money(total)}<ChevronRight className="size-5" aria-hidden /></span>
    </Link>
  );
}

/** Guía de primeros pasos: se va palomeando y desaparece al terminar. */
function Empezar() {
  const { config, clients } = useStore();
  const pasos = [
    { ok: !!config.driver.name, t: 'Tu nombre', d: config.driver.name || 'Para saludarte y firmar tus mensajes', to: '/app/pagina' },
    { ok: !!config.driver.phone, t: 'Tu WhatsApp', d: 'Para que tus clientes te escriban', to: '/app/pagina' },
    { ok: clients.length > 0, t: 'Tu primer cliente', d: 'Con su ruta habitual', to: '/app/clientes' },
  ];
  const hechos = pasos.filter((x) => x.ok).length;
  if (hechos === pasos.length) return null;
  return (
    <>
      <section className="space-y-2 rounded-3xl bg-hueso p-4 text-asfalto" aria-label="Primeros pasos">
        <div className={cx(label, 'text-[#55555e]')}>Empieza aquí</div>
        <div className="font-titulo text-xl leading-tight">Deja tu cuenta lista en 2 minutos</div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#d8d8d0]" role="progressbar" aria-valuenow={hechos} aria-valuemin={0} aria-valuemax={3} aria-label={`${hechos} de 3 pasos`}><div className="h-full rounded-full bg-cobrado" style={{ width: `${(hechos / 3) * 100}%` }} /></div>
      </section>
      <section className="divide-y divide-white/5 rounded-3xl border border-white/5 bg-tablero px-3" aria-label="Pasos">
        {pasos.map((x, i) => (
          <div key={x.t} className="flex min-h-[52px] items-center gap-3 py-1.5">
            <span className={cx('grid size-7 shrink-0 place-items-center rounded-full border-2 font-mono text-xs font-bold', x.ok ? 'border-cobrado bg-cobrado text-[#04210f]' : 'border-humo')}>{x.ok ? '✓' : i + 1}</span>
            <span className="min-w-0 flex-1"><b className="block font-titulo text-[15px]">{x.t}</b><small className="block truncate text-[13px] text-gris">{x.d}</small></span>
            {!x.ok && <Link to={x.to} className="grid min-h-11 place-items-center rounded-xl border border-humo px-3 text-sm">Agregar</Link>}
          </div>
        ))}
      </section>
    </>
  );
}

export default function Dashboard() {
  const { config, trips, expenses, update } = useStore();
  const [toast, showToast] = useToast();
  const [tripOpen, setTripOpen] = useState(false);
  const [gasto, setGasto] = useState(false);
  const d = daySummary(trips, expenses, today());
  const next = upcoming(trips).find((t) => (t.date + t.time) >= (today() + hm(new Date(Date.now() - 30 * 60000))) || t.confirmedAt) || upcoming(trips)[0];

  function advance(t) {
    if (stepOf(t) < 2) return update('trips', t.id, advancePatch(t, new Date().toISOString()));
    location.hash = '#/app/viajes?s=porhacer'; // Terminar pide el pago en la Agenda
  }

  return (
    <>
      <h1 className="font-titulo text-2xl">Hola, {config.driver.name || 'bienvenido'}</h1>

      <Empezar />

      <EstadoAhora />

      <NextTrip trip={next} onAdvance={advance} />

      <Debts />

      <section className="rounded-3xl border border-white/5 bg-tablero p-4" aria-label="Saldo de hoy">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><div className={cx(label, 'text-gris')}>Ingresos</div><div className="font-mono text-lg font-bold tabular-nums">{d.trips ? money(d.gross) : '—'}</div></div>
          <div><div className={cx(label, 'text-gris')}>Gastos</div><div className="font-mono text-lg font-bold tabular-nums">{money(d.spent)}</div></div>
          <div><div className={cx(label, 'text-gris')}>Neta</div><div className={cx('font-mono text-lg font-bold tabular-nums', d.trips && d.net > 0 ? 'text-cobrado' : d.trips && d.net < 0 ? 'text-atrasado' : '')}>{d.trips ? money(d.net) : '—'}</div></div>
        </div>
        <p className="mt-2 text-center text-xs text-gris">{d.trips ? `${d.trips} ${d.trips === 1 ? 'viaje' : 'viajes'} hoy · ${d.km} km` : 'Aún no cobras ningún viaje hoy'}</p>
        <div className="mt-2">
          <span className="grid grid-cols-2 gap-2">
            <Button variant="ghost" className="h-11 px-3 text-sm whitespace-nowrap" onClick={() => setGasto((g) => !g)} aria-expanded={gasto}>+ Gasto</Button>
            <Button variant="ghost" icon={Plus} className="h-11 px-3 text-sm whitespace-nowrap" onClick={() => setTripOpen(true)}>Viaje cobrado</Button>
          </span>
        </div>
        {gasto && <div className="mt-3"><ExpenseQuick onSaved={(m) => { showToast(m); setGasto(false); }} /></div>}
        <Link to="/app/resumen" className="mt-1 flex min-h-11 items-center justify-center text-xs text-cobrado">Ver resumen de la semana</Link>
      </section>

      <TripSheet open={tripOpen} onClose={() => setTripOpen(false)} onSaved={() => showToast('Viaje guardado en bitácora')} />
      {toast}
    </>
  );
}
