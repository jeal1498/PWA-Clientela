// Bitácora de viajes realizados: resumen diario y semanal (bruto vs. km) y lista por día.
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, BookOpen, Repeat } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { isDone } from '../lib/agenda.js';
import { weekSummary, PAY_METHODS } from '../lib/ledger.js';
import { dayShort, dayLong, today } from '../lib/dates.js';
import { money, money2 } from '../lib/format.js';
import { Card, CardTitle, Button, Stat, cx } from '../components/ui.jsx';
import TripSheet, { lastPay } from '../components/TripSheet.jsx';
import { useToast } from '../components/Toast.jsx';

/** Repetir: mismo cliente, ruta, km y monto; fecha y hora de ahora y el último pago usado. */
const repeatOf = (x) => ({ clientId: x.clientId || '', clientName: x.clientName || '', from: x.from || '', to: x.to || '', km: x.km || '', amount: x.amount || '', pay: lastPay() });

export default function Bitacora() {
  const { trips, expenses, remove } = useStore();
  const [offset, setOffset] = useState(0); // 0 = esta semana, -1 = la pasada…
  const [sheet, setSheet] = useState(null); // { editing } | {}
  const [toast, showToast] = useToast();

  const ref = new Date();
  ref.setDate(ref.getDate() + offset * 7);
  const w = weekSummary(trips, expenses, ref);
  const t = w.total;
  const maxGross = Math.max(1, ...w.days.map((d) => d.gross));
  const maxKm = Math.max(1, ...w.days.map((d) => d.km));
  const label = offset === 0 ? 'Esta semana' : offset === -1 ? 'Semana pasada' : `Semana del ${dayLong(w.days[0].date)}`;
  const weekTrips = trips.filter((x) => isDone(x) && x.date >= w.days[0].date && x.date <= w.days[6].date).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-titulo text-2xl">Bitácora</h1>
        <Button icon={Plus} className="h-11" onClick={() => setSheet({})}>Viaje</Button>
      </div>

      <Card>
        <div className="mb-3 flex items-center">
          <button type="button" aria-label="Semana anterior" onClick={() => setOffset((o) => o - 1)} className="grid size-11 place-items-center rounded-xl bg-asfalto"><ChevronLeft className="size-5" /></button>
          <div className="flex-1 text-center text-sm font-semibold">{label}</div>
          <button type="button" aria-label="Semana siguiente" disabled={offset >= 0} onClick={() => setOffset((o) => o + 1)} className="grid size-11 place-items-center rounded-xl bg-asfalto disabled:opacity-30"><ChevronRight className="size-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Ganancia bruta" value={money(t.gross)} />
          <Stat label="Km recorridos" value={`${t.km} km`} />
          <Stat small label="Bruto por km" value={money2(t.grossPerKm)} />
          <Stat small label={`Neta real (− ${money(t.spent)} gastos)`} value={money(t.net)} tone={t.net > 0 ? 'green' : t.net < 0 ? 'red' : undefined} />
        </div>

        {/* Barras por día: bruto (verde) vs km (gris) */}
        <div className="mt-4 grid grid-cols-7 items-end gap-1.5" aria-label="Bruto y km por día">
          {w.days.map((d) => (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <div className="flex h-24 items-end gap-0.5">
                <div className="w-2.5 rounded-t bg-cobrado" style={{ height: `${(d.gross / maxGross) * 100}%` }} title={`${money(d.gross)}`} />
                <div className="w-2.5 rounded-t bg-gris/50" style={{ height: `${(d.km / maxKm) * 100}%` }} title={`${d.km} km`} />
              </div>
              <span className={cx('text-xs capitalize', d.date === today() ? 'font-semibold text-cobrado' : 'text-gris')}>{dayShort(d.date)}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 flex justify-center gap-3 text-xs text-gris">
          <span className="flex items-center gap-1"><i className="size-2 rounded-sm bg-cobrado" />Bruto</span>
          <span className="flex items-center gap-1"><i className="size-2 rounded-sm bg-gris/50" />Km</span>
        </p>
        <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-xs">
          {Object.entries(PAY_METHODS).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-asfalto/60 p-2"><div className="text-gris">{v.replace('Transferencia ', '')}</div><div className="font-mono">{money(t.byPay[k])}</div></div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle icon={BookOpen}>Viajes ({weekTrips.length})</CardTitle>
        {!weekTrips.length && <p className="py-4 text-center text-sm text-gris">Sin viajes esta semana. Registra uno con «+ Viaje».</p>}
        <ul className="divide-y divide-white/5">
          {weekTrips.map((x) => (
            <li key={x.id} className="flex items-center gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{x.clientName || 'Sin nombre'} <span className="text-gris">· {x.pay ? PAY_METHODS[x.pay]?.replace('Transferencia ', '') : 'Me debe'}</span></div>
                <div className="truncate text-xs text-gris">{dayShort(x.date)} {x.time} · {[x.from, x.to].filter(Boolean).join(' → ') || '—'}{x.km ? ` · ${x.km} km` : ''}</div>
              </div>
              <span className="font-mono">{money(x.amount)}</span>
              <button type="button" aria-label="Repetir viaje" onClick={() => setSheet({ prefill: repeatOf(x) })} className="grid size-11 place-items-center rounded-xl bg-asfalto"><Repeat className="size-4 text-gris" /></button>
              <button type="button" aria-label="Editar" onClick={() => setSheet({ editing: x })} className="grid size-11 place-items-center rounded-xl bg-asfalto"><Pencil className="size-4 text-gris" /></button>
              <button type="button" aria-label="Borrar" onClick={() => confirm('¿Borrar este viaje?') && remove('trips', x.id)} className="grid size-11 place-items-center rounded-xl bg-asfalto"><Trash2 className="size-4 text-atrasado" /></button>
            </li>
          ))}
        </ul>
      </Card>
      <TripSheet open={!!sheet} editing={sheet?.editing} prefill={sheet?.prefill} onClose={() => setSheet(null)}
        onSaved={(trip, isNew) => (isNew ? showToast('Viaje guardado', () => remove('trips', trip.id)) : showToast('Bitácora actualizada'))} />
      {toast}
    </>
  );
}
