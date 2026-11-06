// Agendar un viaje (de la agenda o desde una cotización). Avisa si se empalma con otro, pero deja agendarlo igual.
import { useEffect, useState } from 'react';
import { CalendarPlus, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { today, ymd, hm } from '../lib/dates.js';
import { clashes, endTime } from '../lib/agenda.js';
import { dayLong } from '../lib/dates.js';
import Sheet from './Sheet.jsx';
import { Field, NumberInput, TextInput, Button, cx } from './ui.jsx';

const blank = () => ({ date: today(), time: hm(), dur: 30, clientId: '', clientName: '', from: '', to: '', km: '', amount: '' });
const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return ymd(d); };

export default function AgendaSheet({ open, onClose, prefill, onSaved }) {
  const { trips, clients, add } = useStore();
  const [f, setF] = useState(blank);
  const [armed, setArmed] = useState(false); // ya vio el aviso de empalme: el siguiente toque agenda igual
  useEffect(() => { if (open) { setF({ ...blank(), ...(prefill || {}) }); setArmed(false); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (p) => { setF((s) => ({ ...s, ...p })); setArmed(false); };

  const draft = { ...f, id: 'nuevo', dur: +f.dur || 0 };
  const choque = clashes(trips, draft);

  function save() {
    if (choque.length && !armed) return setArmed(true);
    const trip = add('trips', { status: 'agendado', pay: '', date: f.date, time: f.time, dur: +f.dur || 30, clientId: f.clientId, clientName: f.clientName, from: f.from, to: f.to, km: +f.km || 0, amount: +f.amount || 0 });
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
        {armed && choque.length > 0 && (
          <div role="alert" className="flex items-start gap-2 rounded-2xl border border-tedebe/50 bg-tedebe/10 p-3 text-sm font-bold text-tedebe">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            Se empalma con {choque[0].time}–{endTime(choque[0])} · {choque[0].clientName || 'Sin nombre'} ({dayLong(choque[0].date)}). Cambia la hora o agéndalo igual.
          </div>
        )}
        <Button icon={CalendarPlus} className="w-full" onClick={save}>{armed && choque.length ? 'Agendar igual' : 'Agendar'}</Button>
      </div>
    </Sheet>
  );
}
