// Agenda: viajes por hacer, agrupados por día. Un solo botón avanza el viaje: Confirmar → Ya llegué → Terminar.
import { useState } from 'react';
import { Plus, AlertTriangle, Banknote, Landmark, CreditCard, Clock } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { upcoming, clashes, stepOf, STEP_LABELS, advancePatch, finishPatch, reopenPatch, cancelPatch, endTime } from '../lib/agenda.js';
import { today, dayLong } from '../lib/dates.js';
import { money } from '../lib/format.js';
import { Button, cx } from '../components/ui.jsx';
import Sheet from '../components/Sheet.jsx';
import AgendaSheet from '../components/AgendaSheet.jsx';
import { useToast } from '../components/Toast.jsx';

const PAYS = [
  { key: 'efectivo', label: 'Efectivo', icon: Banknote },
  { key: 'spei', label: 'SPEI', icon: Landmark },
  { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { key: '', label: 'Me debe', icon: Clock },
];
const STEPS = ['Agendado', 'Confirmado', 'Llegué'];

function dayLabel(iso) {
  const d = new Date();
  const t = today();
  d.setDate(d.getDate() + 1);
  const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return iso === t ? 'Hoy' : iso === m ? 'Mañana' : iso < t ? `${dayLong(iso)} · sin cerrar` : dayLong(iso);
}

export default function Agenda() {
  const { trips, update } = useStore();
  const [newOpen, setNewOpen] = useState(false);
  const [paying, setPaying] = useState(null);
  const [toast, showToast] = useToast('bottom-28');

  const list = upcoming(trips);
  const hoy = list.filter((t) => t.date === today());
  const sig = list.find((t) => t.date >= today());
  const groups = [...new Set(list.map((t) => t.date))].map((d) => [d, list.filter((t) => t.date === d)]);

  function advance(t) {
    if (stepOf(t) < 2) return update('trips', t.id, advancePatch(t, new Date().toISOString()));
    setPaying(t);
  }
  function finish(t, pay) {
    update('trips', t.id, finishPatch(pay, today()));
    setPaying(null);
    showToast(`Terminado · ${PAYS.find((p) => p.key === pay).label} ${money(t.amount)} → bitácora`, () => update('trips', t.id, reopenPatch()));
  }
  function cancel(t) {
    update('trips', t.id, cancelPatch());
    showToast('Viaje cancelado', () => update('trips', t.id, reopenPatch()));
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-titulo text-2xl">Agenda</h1>
        <Button icon={Plus} className="h-10" onClick={() => setNewOpen(true)}>Agendar</Button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-tablero px-3.5 py-3">
        <div><b className="block text-xl tabular-nums">{hoy.length} viaje{hoy.length === 1 ? '' : 's'}</b><small className="text-[10.5px] font-bold tracking-widest text-gris uppercase">Hoy · {money(hoy.reduce((s, t) => s + (+t.amount || 0), 0))}</small></div>
        <div className="min-w-0 text-right"><b className="block text-xl tabular-nums">{sig ? sig.time : '—'}</b><small className="block truncate text-[10.5px] font-bold tracking-widest text-gris uppercase">{sig ? `Siguiente · ${sig.clientName || 'Sin nombre'}` : 'Sin viajes por hacer'}</small></div>
      </div>

      {!list.length && <div className="rounded-2xl border border-dashed border-white/15 py-8 text-center text-gris"><b className="text-hueso">Nada agendado</b><br />Toca «Agendar» o agéndalo desde una cotización.</div>}

      {groups.map(([d, items]) => (
        <section key={d} className="space-y-2" aria-label={dayLabel(d)}>
          <h2 className="mt-1 text-[10.5px] font-bold tracking-widest text-gris uppercase">{dayLabel(d)}</h2>
          {items.map((t) => {
            const c = clashes(trips, t);
            const s = stepOf(t);
            return (
              <article key={t.id} aria-label={`${t.clientName || 'Sin nombre'}, ${t.time}`} className={cx('space-y-2.5 rounded-2xl border bg-[#1C1C23] p-3.5', c.length ? 'border-tedebe/55' : 'border-white/10')}>
                <div className="flex items-start gap-3">
                  <div className="min-w-[58px] text-[22px] leading-tight font-extrabold tabular-nums">{t.time}<small className="mt-0.5 block font-mono text-[11px] font-medium text-gris">→ {endTime(t)}</small></div>
                  <div className="min-w-0 flex-1"><b className="block truncate">{t.clientName || 'Sin nombre'}</b><small className="block truncate text-[12.5px] text-gris">{[t.from, t.to].filter(Boolean).join(' → ') || '—'}</small></div>
                  <span className="font-mono font-bold tabular-nums">{money(t.amount)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-wider uppercase" aria-label={`Avance: ${STEPS[s]}`}>
                  {STEPS.map((l, i) => (
                    <span key={l} className="contents">
                      {i > 0 && <i className={cx('h-[3px] flex-1 rounded', s >= i ? 'bg-cobrado' : 'bg-white/15')} />}
                      <span className={s >= i ? 'text-cobrado' : 'text-gris'}>{l}</span>
                    </span>
                  ))}
                </div>
                {c.length > 0 && <div className="flex items-start gap-2 text-[12.5px] font-bold text-tedebe"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />Se empalma con {c[0].time} · {c[0].clientName || 'Sin nombre'}</div>}
                <div className="flex items-center gap-2">
                  <Button className="h-11 flex-1" onClick={() => advance(t)}>{STEP_LABELS[s]}</Button>
                  <button type="button" onClick={() => cancel(t)} className="px-2 text-[13px] font-bold text-gris underline underline-offset-4">Cancelar</button>
                </div>
              </article>
            );
          })}
        </section>
      ))}

      <p className="text-xs text-gris">Un viaje ocupa lo que dura su ruta (mínimo 30 min). Si dos se pisan te avisamos, pero puedes agendarlo igual.</p>

      <AgendaSheet open={newOpen} onClose={() => setNewOpen(false)} onSaved={(t) => showToast(`Agendado ${t.time} · ${t.clientName || 'Sin nombre'}`)} />
      <Sheet open={!!paying} onClose={() => setPaying(null)} title={paying ? `Terminar · ${paying.clientName || 'Sin nombre'}` : ''}>
        {paying && (
          <>
            <p className="mb-3 text-sm text-gris">{money(paying.amount)}. ¿Cómo te pagó?</p>
            <div className="grid grid-cols-2 gap-2">
              {PAYS.map(({ key, label, icon: Icon }) => <Button key={label} variant="outline" icon={Icon} onClick={() => finish(paying, key)}>{label}</Button>)}
            </div>
          </>
        )}
      </Sheet>
      {toast}
    </>
  );
}
