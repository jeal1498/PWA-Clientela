// Agendar un viaje (de la agenda o desde una cotización). Avisa si se empalma con otro, pero deja agendarlo igual.
import { useEffect, useState } from 'react';
import { CalendarPlus, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { today, ymd, hm } from '../lib/dates.js';
import { clashes, endTime } from '../lib/agenda.js';
import { DIAS_CORTO, weekdayIdx, datesOf, finAfterWeeks } from '../lib/series.js';
import { dayLong } from '../lib/dates.js';
import Sheet from './Sheet.jsx';
import { Field, NumberInput, TextInput, Button, cx } from './ui.jsx';

const blank = () => ({ date: today(), time: hm(), dur: 30, clientId: '', clientName: '', from: '', to: '', km: '', amount: '', repite: false, dias: [], finTipo: 'sin', semanas: 4 });
const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return ymd(d); };

export default function AgendaSheet({ open, onClose, prefill, onSaved }) {
  const { trips, clients, add } = useStore();
  const [f, setF] = useState(blank);
  const [armed, setArmed] = useState(false); // ya vio el aviso de empalme: el siguiente toque agenda igual
  useEffect(() => { if (open) { setF({ ...blank(), ...(prefill || {}) }); setArmed(false); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (p) => { setF((s) => ({ ...s, ...p })); setArmed(false); };

  const draft = { ...f, id: 'nuevo', dur: +f.dur || 0 };
  const dias = f.dias.length ? f.dias : [weekdayIdx(f.date)];
  const fin = f.finTipo === 'sem' ? finAfterWeeks(f.date, Math.max(1, +f.semanas || 1)) : null;
  const proximas = datesOf(f.date, dias, fin, f.finTipo === 'sem' ? 120 : 5);
  const choque = clashes(trips, draft);

  function save() {
    if (choque.length && !armed) return setArmed(true);
    const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const serie = f.repite ? { repite: true, serie: id, dias, fin } : {};
    const trip = add('trips', { id, status: 'agendado', pay: '', date: f.date, time: f.time, dur: +f.dur || 30, clientId: f.clientId, clientName: f.clientName, from: f.from, to: f.to, km: +f.km || 0, amount: +f.amount || 0, ...serie });
    onSaved?.(trip);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Agendar viaje">
      <div className="space-y-3">
        <Field label="Monto">
          <NumberInput prefix="$" value={f.amount} onChange={(amount) => set({ amount })} placeholder="0" autoFocus aria-label="Monto" />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          {[['Hoy', today()], ['Mañana', tomorrow()]].map(([l, d]) => (
            <button key={l} type="button" onClick={() => set({ date: d })} className={cx('h-10 rounded-xl border text-sm font-bold', f.date === d ? 'border-hueso bg-tablero' : 'border-white/10 bg-asfalto text-gris')}>{l}</button>
          ))}
          <TextInput type="date" aria-label="Fecha" value={f.date} onChange={(e) => set({ date: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Hora"><TextInput type="time" value={f.time} onChange={(e) => set({ time: e.target.value })} /></Field>
          <Field label="Duración"><NumberInput suffix="min" value={f.dur} onChange={(dur) => set({ dur })} placeholder="30" /></Field>
        </div>
        <Field label="Cliente">
          <TextInput list="ag-clientes" value={f.clientName} placeholder="Nombre (opcional)"
            onChange={(e) => { const c = clients.find((x) => x.name === e.target.value); set({ clientName: e.target.value, clientId: c?.id || '' }); }} />
          <datalist id="ag-clientes">{clients.map((c) => <option key={c.id} value={c.name} />)}</datalist>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Origen"><TextInput value={f.from} onChange={(e) => set({ from: e.target.value })} placeholder="De" /></Field>
          <Field label="Destino"><TextInput value={f.to} onChange={(e) => set({ to: e.target.value })} placeholder="A" /></Field>
        </div>
        <div className="flex items-center gap-3 border-t border-white/10 pt-3">
          <div className="min-w-0 flex-1"><b className="block">Se repite</b><small className="text-xs text-gris">Mismo horario y mismo precio en cada viaje</small></div>
          <button type="button" role="switch" aria-checked={f.repite} aria-label="Se repite" onClick={() => set({ repite: !f.repite, dias: f.dias.length ? f.dias : [weekdayIdx(f.date)] })}
            className={cx('relative h-[26px] w-11 shrink-0 rounded-full border border-white/15', f.repite ? 'bg-hueso' : 'bg-asfalto')}>
            <span className={cx('absolute top-[2px] left-[2px] size-5 rounded-full transition-transform', f.repite ? 'translate-x-[18px] bg-asfalto' : 'bg-gris')} />
          </button>
        </div>
        {f.repite && (
          <div className="space-y-2.5">
            <div className="text-[10.5px] font-bold tracking-widest text-gris uppercase">Días</div>
            <div className="flex gap-1.5">
              {DIAS_CORTO.map((n, i) => (
                <button key={n} type="button" aria-pressed={dias.includes(i)} aria-label={n} onClick={() => set({ dias: dias.includes(i) ? dias.filter((x) => x !== i) : [...dias, i] })}
                  className={cx('h-10 flex-1 rounded-xl border text-sm font-bold uppercase', dias.includes(i) ? 'border-hueso bg-tablero' : 'border-white/10 bg-asfalto text-gris')}>{n[0]}</button>
              ))}
            </div>
            <div className="text-[10.5px] font-bold tracking-widest text-gris uppercase">Termina</div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" aria-pressed={f.finTipo === 'sin'} onClick={() => set({ finTipo: 'sin' })} className={cx('h-11 rounded-xl border text-sm font-bold', f.finTipo === 'sin' ? 'border-hueso bg-tablero' : 'border-white/10 bg-asfalto text-gris')}>Sin fin</button>
              <button type="button" aria-pressed={f.finTipo === 'sem'} onClick={() => set({ finTipo: 'sem' })} className={cx('h-11 rounded-xl border text-sm font-bold', f.finTipo === 'sem' ? 'border-hueso bg-tablero' : 'border-white/10 bg-asfalto text-gris')}>Tras {f.semanas} semanas</button>
            </div>
            {f.finTipo === 'sem' && <NumberInput suffix="semanas" value={f.semanas} onChange={(semanas) => set({ semanas: Math.min(26, Math.max(1, semanas || 1)) })} aria-label="Semanas" />}
            <div className="space-y-1 rounded-2xl border border-white/10 bg-[#1C1C23] p-3" aria-live="polite">
              <div className="text-[10.5px] font-bold tracking-widest text-gris uppercase">{fin ? `Se crearán ${proximas.length} viajes` : 'Se agendan los próximos 28 días y se rellenan solos'}</div>
              {proximas.slice(0, 5).map((d) => <div key={d} className="flex justify-between text-sm"><span className="capitalize">{dayLong(d)}</span><span className="font-mono text-gris">{f.time}</span></div>)}
              {proximas.length > 5 && <div className="text-xs text-gris">…y {proximas.length - 5} más</div>}
            </div>
          </div>
        )}
        {armed && choque.length > 0 && (
          <div role="alert" className="flex items-start gap-2 rounded-2xl border border-tedebe/50 bg-tedebe/10 p-3 text-sm font-bold text-tedebe">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            Se empalma con {choque[0].time}–{endTime(choque[0])} · {choque[0].clientName || 'Sin nombre'} ({dayLong(choque[0].date)}). Cambia la hora o agéndalo igual.
          </div>
        )}
        <Button icon={CalendarPlus} className="w-full" onClick={save}>{armed && choque.length ? 'Agendar igual' : f.repite ? 'Agendar serie' : 'Agendar'}</Button>
      </div>
    </Sheet>
  );
}
