// Agenda: viajes por hacer, agrupados por día. Un solo botón avanza el viaje: Confirmar → Ya llegué → Terminar.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, AlertTriangle, Banknote, Landmark, CreditCard, Clock, Repeat, MoreHorizontal } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { upcoming, clashes, stepOf, STEP_LABELS, advancePatch, finishPatch, reopenPatch, cancelPatch, endTime } from '../lib/agenda.js';
import { today, dayLong } from '../lib/dates.js';
import { diasTexto, stopPatches } from '../lib/series.js';
import { money } from '../lib/format.js';
import { Button, TextArea, cx } from '../components/ui.jsx';
import { waLink, tripReminderMessage } from '../lib/whatsapp.js';
import { cuandoDe, sinAvisarManana, avisadoTexto } from '../lib/recordar.js';
import Sheet from '../components/Sheet.jsx';
import AgendaSheet from '../components/AgendaSheet.jsx';
import { lastPay, rememberPay } from '../components/TripSheet.jsx';
import { useToast } from '../components/Toast.jsx';
import Vacio from '../components/Vacio.jsx';

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

export default function Agenda({ embedded = false, slot = null }) {
  const { trips, clients, config, update } = useStore();
  const [newOpen, setNewOpen] = useState(false);
  const [paying, setPaying] = useState(null);
  const [queue, setQueue] = useState([]); // recordatorios por mandar, uno por uno
  const [msg, setMsg] = useState('');
  const [menu, setMenu] = useState(null); // id del viaje con el menú «⋯» abierto
  const [toast, showToast] = useToast('bottom-28');

  const list = upcoming(trips);
  const hoy = list.filter((t) => t.date === today());
  const sig = list.find((t) => t.date >= today());
  const activo = (list.find((t) => stepOf(t) > 0) || sig)?.id; // el único viaje con botón verde grande
  const groups = [...new Set(list.map((t) => t.date))].map((d) => [d, list.filter((t) => t.date === d)]);

  const sinAvisar = sinAvisarManana(trips, today());
  const rem = queue[0];
  const phoneOf = (t) => clients.find((c) => c.id === t.clientId)?.phone || t.clientPhone || '';
  const draftOf = (t) => tripReminderMessage({ clientName: t.clientName, cuando: cuandoDe(t.date, today()) || dayLong(t.date), time: t.time, from: t.from, to: t.to, amount: t.amount, driverName: config.driver.name });
  function startRemind(list) { setQueue(list); setMsg(draftOf(list[0])); }
  function sent() { // se abrió WhatsApp: queda avisado y pasa al siguiente
    update('trips', rem.id, { recordadoAt: new Date().toISOString() });
    const rest = queue.slice(1);
    setQueue(rest);
    if (rest.length) setMsg(draftOf(rest[0]));
  }
  function advance(t) {
    if (stepOf(t) < 2) return update('trips', t.id, advancePatch(t, new Date().toISOString()));
    setPaying(t);
  }
  function finish(t, pay) {
    update('trips', t.id, finishPatch(pay, today()));
    rememberPay(pay);
    setPaying(null);
    showToast(`Terminado · ${PAYS.find((p) => p.key === pay).label} ${money(t.amount)} → bitácora`, () => update('trips', t.id, reopenPatch()));
  }
  function stopSerie(t) {
    const ps = stopPatches(trips, t.serie, today());
    ps.forEach(({ id, patch }) => update('trips', id, patch));
    showToast('Serie detenida', () => ps.forEach(({ id, undo }) => update('trips', id, undo)));
  }
  function cancel(t) {
    update('trips', t.id, cancelPatch());
    showToast('Viaje cancelado', () => update('trips', t.id, reopenPatch()));
  }

  return (
    <>
      {embedded ? (
        <>
          <h1 className="sr-only">Por hacer</h1>
          {slot && createPortal(<Button icon={Plus} className="h-11" onClick={() => setNewOpen(true)}>Agendar</Button>, slot)}
        </>
      ) : (
        <div className="flex items-center justify-between">
          <h1 className="font-titulo text-2xl">Agenda</h1>
          <Button icon={Plus} className="h-11" onClick={() => setNewOpen(true)}>Agendar</Button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-hueso/10 bg-tablero px-3.5 py-3">
        <div><b className="block text-xl tabular-nums">{hoy.length} viaje{hoy.length === 1 ? '' : 's'}</b><small className="text-xs font-bold tracking-widest text-gris uppercase">Hoy · {money(hoy.reduce((s, t) => s + (+t.amount || 0), 0))}</small></div>
        <div className="min-w-0 text-right"><b className="block text-xl tabular-nums">{sig ? sig.time : '—'}</b><small className="block truncate text-xs font-bold tracking-widest text-gris uppercase">{sig ? `Siguiente · ${sig.clientName || 'Sin nombre'}` : 'Sin viajes por hacer'}</small></div>
      </div>

      {sinAvisar.length > 0 || list.some((t) => cuandoDe(t.date, today()) === 'mañana') ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-hueso/10 bg-elev px-3.5 py-3">
          <div><b className={cx('block text-[26px] leading-none tabular-nums', sinAvisar.length ? 'text-aviso' : 'text-ok')}>{sinAvisar.length}</b><small className="text-xs font-bold tracking-widest text-gris uppercase">{sinAvisar.length ? 'Sin avisar para mañana' : 'Todo avisado para mañana'}</small></div>
          <Button variant="outline" className="h-11" disabled={!sinAvisar.length} onClick={() => startRemind(sinAvisar)}>Recordar a todos</Button>
        </div>
      ) : null}

      {!list.length && <Vacio titulo="Nada agendado" texto="Agenda un viaje y te avisamos de empalmes y de a quién recordar." accion="Agendar un viaje" onClick={() => setNewOpen(true)} />}

      {groups.map(([d, items]) => (
        <section key={d} className="space-y-2" aria-label={dayLabel(d)}>
          <h2 className="mt-1 text-xs font-bold tracking-widest text-gris uppercase">{dayLabel(d)}</h2>
          {items.map((t) => {
            const c = clashes(trips, t);
            const s = stepOf(t);
            const main = t.id === activo;
            const open = menu === t.id;
            return (
              <article key={t.id} aria-label={`${t.clientName || 'Sin nombre'}, ${t.time}`} className={cx('space-y-2.5 rounded-2xl border bg-elev p-3.5', c.length ? 'border-tedebe/55' : main ? 'border-cobrado/45' : 'border-hueso/10')}>
                <div className="flex items-start gap-3">
                  <div className="min-w-[62px] text-[22px] leading-tight font-extrabold tabular-nums">{t.time}<small className="mt-0.5 block font-mono text-xs font-medium text-gris">→ {endTime(t)}</small></div>
                  <div className="min-w-0 flex-1"><b className="block font-titulo text-base">{t.clientName || 'Sin nombre'}</b><small className="block text-[13px] break-words text-gris">{[t.from, t.to].filter(Boolean).join(' → ') || '—'}</small></div>
                  <span className="font-mono font-bold tabular-nums">{money(t.amount)}</span>
                </div>
                {t.serie && <div className="flex items-center gap-1.5 text-xs text-gris"><Repeat className="size-3.5" aria-hidden />Cada {diasTexto(t.dias)}{t.fin ? ` · hasta ${dayLong(t.fin)}` : ''}</div>}
                {main && (
                  <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase" aria-label={`Avance: ${STEPS[s]}`}>
                    {STEPS.map((l, i) => (
                      <span key={l} className="contents">
                        {i > 0 && <i className={cx('h-[3px] flex-1 rounded', s >= i ? 'bg-cobrado' : 'bg-hueso/15')} />}
                        <span className={s >= i ? 'text-ok' : 'text-gris'}>{l}</span>
                      </span>
                    ))}
                  </div>
                )}
                {c.length > 0 && <div className="flex items-start gap-2 text-[13px] font-bold text-aviso"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />Se empalma con {c[0].time} · {c[0].clientName || 'Sin nombre'}</div>}
                {cuandoDe(t.date, today()) && <div><span className={cx('inline-block rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap', t.recordadoAt ? 'border-cobrado/55 text-ok' : 'border-tedebe/55 text-aviso')}>{t.recordadoAt ? avisadoTexto(t.recordadoAt) : 'Sin avisar'}</span></div>}
                {main && (
                  <Button className="h-[52px] w-full text-base font-bold" onClick={() => finish(t, lastPay())}>Terminar · {PAYS.find((p) => p.key === lastPay())?.label || 'Efectivo'} {money(t.amount)}</Button>
                )}
                <div className="flex items-center gap-2">
                  {main
                    ? (
                      <>
                        {s < 2 && <Button variant="outline" className="h-11 flex-1" onClick={() => advance(t)}>{STEP_LABELS[s]}</Button>}
                        <Button variant="outline" className="h-11 flex-1" onClick={() => setPaying(t)}>Otro pago</Button>
                      </>
                    )
                    : <Button variant="outline" className="h-11 flex-1" onClick={() => advance(t)}>{STEP_LABELS[s]}</Button>}
                  <button type="button" aria-label="Más opciones" aria-expanded={open} aria-haspopup="menu" onClick={() => setMenu(open ? null : t.id)} onKeyDown={(e) => e.key === 'Escape' && setMenu(null)} className="grid size-11 shrink-0 place-items-center rounded-xl border border-humo text-hueso active:scale-95"><MoreHorizontal className="size-5" aria-hidden /></button>
                </div>
                {open && (
                  <div role="menu" aria-label="Opciones del viaje" onKeyDown={(e) => e.key === 'Escape' && setMenu(null)} className="flex flex-col rounded-2xl border border-humo bg-tablero p-1.5">
                    <button type="button" role="menuitem" className="min-h-11 rounded-xl px-3 text-left text-sm active:bg-hueso/5" onClick={() => { setMenu(null); startRemind([t]); }}>{t.recordadoAt ? 'Recordar otra vez por WhatsApp' : 'Recordar por WhatsApp'}</button>
                    {t.serie && <button type="button" role="menuitem" className="min-h-11 rounded-xl px-3 text-left text-sm active:bg-hueso/5" onClick={() => { setMenu(null); stopSerie(t); }}>Detener serie</button>}
                    <button type="button" role="menuitem" className="min-h-11 rounded-xl px-3 text-left text-sm font-bold text-malo active:bg-hueso/5" onClick={() => { setMenu(null); cancel(t); }}>Cancelar viaje</button>
                  </div>
                )}
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
      <Sheet open={!!rem} onClose={() => setQueue([])} title={rem ? `Recordar a ${rem.clientName || 'Sin nombre'}${queue.length > 1 ? ` · quedan ${queue.length}` : ''}` : ''}>
        {rem && (
          <div className="space-y-3">
            <p className="text-sm text-gris">Puedes editar el mensaje antes de abrir WhatsApp.{!phoneOf(rem) && ' Este viaje no tiene número: WhatsApp te dejará elegir el chat.'}</p>
            <TextArea rows={7} value={msg} onChange={(e) => setMsg(e.target.value)} aria-label="Mensaje" />
            <Button variant="whatsapp" className="w-full" as="a" href={waLink(phoneOf(rem), msg, config.driver.lada)} target="_blank" rel="noopener" onClick={sent}>Abrir WhatsApp</Button>
            <Button variant="outline" className="w-full" onClick={() => setQueue([])}>Cancelar</Button>
          </div>
        )}
      </Sheet>
      {toast}
    </>
  );
}
