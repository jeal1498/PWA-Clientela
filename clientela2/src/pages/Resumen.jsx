// Resumen de ganancias con tus metas: semana o mes contra el periodo anterior, por día, por cliente y por ruta.
import { useState } from 'react';
import { Target } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { resumen, goalsOf, daysLeft } from '../lib/stats.js';
import { today } from '../lib/dates.js';
import { money } from '../lib/format.js';
import { Card, CardTitle, Button, Field, NumberInput, cx } from '../components/ui.jsx';
import Sheet from '../components/Sheet.jsx';
import Vacio from '../components/Vacio.jsx';
import { isDone } from '../lib/agenda.js';
import { QuoteStats, MyNumbers } from '../components/PanelBlocks.jsx';

const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

function Ranking({ title, rows }) {
  const max = rows[0]?.total || 1;
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {!rows.length && <p className="text-sm text-gris">Sin viajes en este periodo.</p>}
      <ul className="space-y-3">
        {rows.slice(0, 5).map((r) => (
          <li key={r.name}>
            <div className="flex justify-between gap-2 text-sm"><span className="min-w-0 truncate">{r.name} <span className="text-gris">· {r.n} viaje{r.n > 1 ? 's' : ''}</span></span><b className="font-mono">{money(r.total)}</b></div>
            <div className="mt-1 h-1.5 overflow-hidden rounded bg-asfalto"><div className="h-full rounded bg-hueso" style={{ width: `${(r.total / max) * 100}%` }} /></div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function Resumen({ embedded = false }) {
  const { trips, expenses, config, setSection } = useStore();
  const [kind, setKind] = useState('sem');
  const [edit, setEdit] = useState(null); // { dayNet, weekNet } mientras se editan las metas
  const hoy = today();
  const r = resumen(trips, expenses, kind, hoy);
  const meta = goalsOf(config.goals);
  const objetivo = kind === 'sem' ? meta.sem : meta.mes;
  const avance = pct(r.net, objetivo);
  const falta = Math.max(0, objetivo - r.net);
  const quedan = daysLeft(kind, hoy);
  const hoyNet = resumen(trips, expenses, 'sem', hoy).bars.find((b) => b.date === hoy)?.net ?? 0;
  const maxBar = Math.max(1, ...r.bars.map((b) => b.net));

  if (!trips.some(isDone)) {
    return (
      <>
        <h1 className={embedded ? 'sr-only' : 'font-titulo text-2xl'}>Resumen</h1>
        <Vacio titulo="Aún no hay viajes" texto="Cuando cobres tu primer viaje, aquí verás cuánto ganas neto y contra tu meta." accion="Agendar un viaje" to="/app/viajes?s=porhacer" />
        <div className="grid grid-cols-2 gap-2 opacity-55" aria-hidden="true">
          <div className="rounded-xl bg-tablero p-3 text-xs text-gris">Ganancia neta<b className="block font-mono text-base">—</b></div>
          <div className="rounded-xl bg-tablero p-3 text-xs text-gris">Meta de la semana<b className="block font-mono text-base">—</b></div>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className={embedded ? 'sr-only' : 'font-titulo text-2xl'}>Resumen</h1>
      <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-asfalto p-0.5" role="tablist" aria-label="Periodo">
        {[['sem', 'Semana'], ['mes', 'Mes']].map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)} className={cx('h-11 rounded-[10px] text-sm font-bold', kind === k ? 'bg-tablero text-hueso ring-1 ring-white/15' : 'text-gris')}>{l}</button>
        ))}
      </div>

      <Card className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div><div className="text-xs font-bold tracking-widest text-gris uppercase">Ganancia neta</div><div className="text-3xl font-extrabold tabular-nums">{money(r.net)}</div></div>
          {r.delta != null && <span className={cx('rounded-full border px-2.5 py-1 text-xs font-bold tracking-wider uppercase', r.delta >= 0 ? 'border-cobrado/55 text-cobrado' : 'border-tedebe/55 text-tedebe')}>{r.delta >= 0 ? '+' : ''}{r.delta} % vs. anterior</span>}
        </div>

        {objetivo > 0 ? (
          <div>
            <div className="mb-1.5 flex justify-between text-sm"><span className="text-gris">Meta {kind === 'sem' ? 'semanal' : 'del mes'} {money(objetivo)}</span><b className={cx('font-mono', avance >= 100 && 'text-cobrado')}>{avance} %</b></div>
            <div className="h-2.5 overflow-hidden rounded-full border border-white/10 bg-asfalto" role="progressbar" aria-valuenow={avance} aria-valuemin={0} aria-valuemax={100} aria-label="Avance de la meta"><div className="h-full rounded-full bg-hueso" style={{ width: `${avance}%` }} /></div>
            <p className="mt-1.5 text-xs text-gris">{falta > 0 ? `Te faltan ${money(falta)}${quedan > 0 ? ` · ${money(falta / quedan)} por día los ${quedan} días que quedan` : ''}` : 'Meta lograda'}</p>
          </div>
        ) : (
          <Button variant="outline" icon={Target} className="w-full" onClick={() => setEdit({ dayNet: config.goals.dayNet || '', weekNet: config.goals.weekNet || '' })}>Define tu meta para ver tu avance</Button>
        )}

        {kind === 'sem' && meta.dia > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <div className="grid h-[60px] place-content-center rounded-2xl border border-white/10 bg-[#1C1C23] text-center"><b className="font-mono text-xl">{money(hoyNet)}</b><small className="text-xs font-bold tracking-widest text-gris uppercase">Hoy · meta {money(meta.dia)}</small></div>
            <div className="grid h-[60px] place-content-center rounded-2xl border border-white/10 bg-[#1C1C23] text-center"><b className={cx('text-xl', hoyNet >= meta.dia ? 'text-cobrado' : 'text-gris')}>{hoyNet >= meta.dia ? 'Meta lograda' : `Faltan ${money(meta.dia - hoyNet)}`}</b><small className="text-xs font-bold tracking-widest text-gris uppercase">Hoy</small></div>
          </div>
        )}

        <div>
          <div className="mb-1 text-xs font-bold tracking-widest text-gris uppercase">{kind === 'sem' ? 'Por día' : 'Por semana'}</div>
          <div className="flex h-[90px] items-end gap-1.5">
            {r.bars.map((b) => (
              <div key={b.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1" role="img" aria-label={`${b.label}: ${money(b.net)}`}>
                <i className={cx('w-full max-w-[26px] rounded-t', b.net > 0 ? 'bg-hueso' : 'bg-white/15')} style={{ height: `${Math.max(3, (Math.max(0, b.net) / maxBar) * 68)}px` }} />
                <span className="text-xs text-gris">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-gris">Ganancia neta = lo cobrado menos tus gastos. {r.trips} viaje{r.trips === 1 ? '' : 's'} en el periodo.</p>
      </Card>

      <Ranking title="Ingresos por cliente" rows={r.clientes} />
      <Ranking title="Ingresos por ruta" rows={r.rutas} />
      <Button variant="outline" icon={Target} onClick={() => setEdit({ dayNet: config.goals.dayNet || '', weekNet: config.goals.weekNet || '' })}>Cambiar mis metas</Button>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title="Mis metas">
        {edit && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Por día"><NumberInput prefix="$" value={edit.dayNet} onChange={(dayNet) => setEdit((e) => ({ ...e, dayNet }))} placeholder="0" /></Field>
              <Field label="Por semana"><NumberInput prefix="$" value={edit.weekNet} onChange={(weekNet) => setEdit((e) => ({ ...e, weekNet }))} placeholder="0" /></Field>
            </div>
            <p className="text-xs text-gris">Se compara con tu ganancia neta. Si pones solo una, la otra se calcula (6 días por semana). Déjalas en 0 para quitarlas.</p>
            <Button className="w-full" onClick={() => { setSection('goals', { dayNet: +edit.dayNet || 0, weekNet: +edit.weekNet || 0 }); setEdit(null); }}>Guardar</Button>
          </div>
        )}
      </Sheet>

      <QuoteStats />
      <MyNumbers />
    </>
  );
}
