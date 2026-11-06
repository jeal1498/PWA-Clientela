// «Te deben»: viajes hechos sin cobrar, por cliente. Amarillo reciente, rojo desde 15 días.
import { useRef, useState } from 'react';
import { MessageCircle, Check, Banknote, Landmark, CreditCard } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { debtsByClient, debtTotals, paidPatch, unpaidPatch, LATE_DAYS } from '../lib/debts.js';
import { today, dayLong } from '../lib/dates.js';
import { money } from '../lib/format.js';
import { waLink, debtReminderMessage } from '../lib/whatsapp.js';
import { Button, Avatar, cx } from '../components/ui.jsx';
import Sheet from '../components/Sheet.jsx';

const PAYS = [
  { key: 'efectivo', label: 'Efectivo', icon: Banknote },
  { key: 'spei', label: 'SPEI', icon: Landmark },
  { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
];

export default function Cobros() {
  const { trips, clients, config, update } = useStore();
  const [paying, setPaying] = useState(null); // grupo que se va a cobrar
  const [undo, setUndo] = useState(null); // { ids, msg }
  const timer = useRef();

  const groups = debtsByClient(trips, today());
  const { total, late } = debtTotals(groups);
  const paid = trips.filter((t) => t.pay && t.paidAt && t.paidAt >= weekAgo()).sort((a, b) => b.paidAt.localeCompare(a.paidAt));

  function charge(g, pay) {
    const ids = g.trips.map((t) => t.id);
    ids.forEach((id) => update('trips', id, paidPatch(pay, today())));
    setPaying(null);
    clearTimeout(timer.current);
    setUndo({ ids, msg: `Cobrado ${money(g.total)} · ${PAYS.find((p) => p.key === pay).label}` });
    timer.current = setTimeout(() => setUndo(null), 5000);
  }
  function undoCharge() {
    undo.ids.forEach((id) => update('trips', id, unpaidPatch()));
    clearTimeout(timer.current);
    setUndo(null);
  }
  function remind(g) {
    const phone = clients.find((c) => c.id === g.clientId)?.phone;
    const text = debtReminderMessage({ clientName: g.name === 'Sin nombre' ? '' : g.name, trips: g.trips, total: g.total, driverName: config.driver.name });
    window.open(waLink(phone, text, config.driver.lada), '_blank', 'noopener');
  }

  return (
    <>
      <h1 className="font-titulo text-2xl">Te deben</h1>

      {groups.length > 0 ? (
        <section className="space-y-1.5 rounded-3xl bg-hueso p-4 text-asfalto" aria-label="Por cobrar">
          <div className="text-xs font-bold tracking-widest text-[#55555e] uppercase">Por cobrar</div>
          <div className="font-mono text-4xl leading-none font-bold tracking-tight tabular-nums">{money(total)}</div>
          <div className="flex items-center justify-between gap-2 text-[13px] text-[#3a3a45]">
            <span>{groups.length} cliente{groups.length > 1 ? 's' : ''}</span>
            {late ? <span className="rounded-full bg-atrasado px-2.5 py-0.5 text-xs font-bold text-white">{money(late)} atrasados</span> : <span>Nada atrasado</span>}
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-white/10 py-8 text-center text-gris"><b className="text-hueso">Nadie te debe</b><br />Los viajes marcados «Me debe» aparecen aquí.</div>
      )}

      {groups.map((g, i) => (
        <details key={g.key} open={i === 0} className={cx('overflow-hidden rounded-2xl border bg-tablero', g.late ? 'border-atrasado bg-atrasado/10' : 'border-tedebe/40')}>
          <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-3 [&::-webkit-details-marker]:hidden">
            <Avatar name={g.name} light={g.late ? 'red' : 'yellow'} />
            <span className="min-w-0 flex-1">
              <b className="block truncate font-titulo text-base font-semibold">{g.name}</b>
              <small className="text-xs text-gris">{g.late ? `Atrasado · ${g.days} días` : `Hace ${g.days} ${g.days === 1 ? 'día' : 'días'}`} · {g.trips.length} viaje{g.trips.length > 1 ? 's' : ''}</small>
            </span>
            <span className={cx('font-mono text-[17px] font-bold', g.late ? 'text-atrasado' : 'text-tedebe')}>{money(g.total)}</span>
          </summary>
          <div className="border-t border-white/10 px-3.5 pb-3.5 pt-1.5">
            {g.trips.map((t) => (
              <div key={t.id} className="flex justify-between gap-2 border-b border-dashed border-white/10 py-2 text-[13px]">
                <span className="min-w-0"><span>{dayLong(t.date)}</span><small className="block truncate text-gris">{[t.from, t.to].filter(Boolean).join(' → ') || '—'}</small></span>
                <span className="font-mono">{money(t.amount)}</span>
              </div>
            ))}
            <div className="mt-3 flex gap-2">
              <Button variant="outline" icon={MessageCircle} className="h-11 flex-1" onClick={() => remind(g)}>Recordar</Button>
              <Button icon={Check} className="h-11 flex-1" onClick={() => setPaying(g)}>Ya me pagó</Button>
            </div>
          </div>
        </details>
      ))}

      {paid.length > 0 && (
        <section aria-label="Cobrado esta semana">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-gris">Cobrado esta semana</h2>
          {paid.slice(0, 8).map((t) => (
            <div key={t.id} className="flex justify-between py-1.5 text-[13px] text-gris">
              <span className="truncate">{t.clientName || 'Sin nombre'} · {PAYS.find((p) => p.key === t.pay)?.label}</span>
              <b className="font-mono text-cobrado">{money(t.amount)}</b>
            </div>
          ))}
        </section>
      )}
      <p className="text-xs text-gris">Rojo desde {LATE_DAYS} días sin cobrar. «Ya me pagó» cobra todos los viajes del cliente.</p>

      <Sheet open={!!paying} onClose={() => setPaying(null)} title={paying ? `Cobrar a ${paying.name}` : ''}>
        {paying && (
          <>
            <p className="mb-3 text-sm text-gris">{paying.trips.length} viaje{paying.trips.length > 1 ? 's' : ''} · {money(paying.total)}. ¿Cómo te pagó?</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYS.map(({ key, label, icon: Icon }) => <Button key={key} variant="outline" icon={Icon} className="px-2" onClick={() => charge(paying, key)}>{label}</Button>)}
            </div>
          </>
        )}
      </Sheet>

      {undo && (
        <div role="status" className="fixed inset-x-0 bottom-24 z-50 mx-auto flex w-fit items-center gap-3 rounded-full bg-hueso py-2 pl-4 pr-2 text-sm font-semibold text-asfalto shadow-xl">
          {undo.msg}
          <button type="button" onClick={undoCharge} className="rounded-full bg-asfalto px-3 py-1.5 text-[13px] text-hueso">Deshacer</button>
        </div>
      )}
    </>
  );
}

function weekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
