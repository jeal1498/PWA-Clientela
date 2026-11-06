// ¿Cuándo? Los viajes siempre se programan: Hoy, Mañana u otra fecha, más la hora.
import { today, tomorrow } from '../lib/dates.js';
import { TextInput, cx } from './ui.jsx';

export default function WhenPicker({ date, time, onChange }) {
  const day = date === today() ? 'hoy' : date === tomorrow() ? 'man' : 'otra';
  const chip = 'h-10 flex-1 rounded-xl border text-sm font-bold';
  return (
    <div className="space-y-2">
      <div className="text-xs font-bold tracking-widest text-gris uppercase">¿Cuándo?</div>
      <div className="flex gap-2">
        {[['hoy', 'Hoy', today()], ['man', 'Mañana', tomorrow()]].map(([k, l, d]) => (
          <button key={k} type="button" aria-pressed={day === k} onClick={() => onChange({ date: d, time })} className={cx(chip, day === k ? 'border-hueso bg-tablero' : 'border-white/10 bg-asfalto text-gris')}>{l}</button>
        ))}
        <button type="button" aria-pressed={day === 'otra'} onClick={() => onChange({ date: day === 'otra' ? date : tomorrow(), time })} className={cx(chip, day === 'otra' ? 'border-hueso bg-tablero' : 'border-white/10 bg-asfalto text-gris')}>Otra fecha</button>
        <TextInput type="time" aria-label="Hora" value={time} onChange={(e) => onChange({ date, time: e.target.value })} className="h-10 w-28 flex-none px-2" />
      </div>
      {day === 'otra' && <TextInput type="date" aria-label="Fecha" value={date} min={today()} onChange={(e) => onChange({ date: e.target.value || date, time })} className="h-10" />}
    </div>
  );
}
