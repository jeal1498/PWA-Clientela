// Gastos del turno: captura rápida, balance del día y lista de la semana.
import { Trash2, Receipt } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { EXPENSE_CATS, weekSummary } from '../lib/ledger.js';
import { dayShort } from '../lib/dates.js';
import { money } from '../lib/format.js';
import { Card, CardTitle } from '../components/ui.jsx';
import DayBalance from '../components/DayBalance.jsx';
import ExpenseQuick from '../components/ExpenseQuick.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Gastos() {
  const { trips, expenses, remove } = useStore();
  const [toast, showToast] = useToast();
  const w = weekSummary(trips, expenses);
  const list = expenses.filter((e) => e.date >= w.days[0].date && e.date <= w.days[6].date).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  return (
    <>
      <h1 className="font-titulo text-2xl">Gastos</h1>
      <Card>
        <ExpenseQuick onSaved={showToast} />
        <div className="mt-4"><DayBalance /></div>
      </Card>
      <Card>
        <CardTitle icon={Receipt} right={<span className="font-mono text-sm">{money(w.total.spent)}</span>}>Esta semana</CardTitle>
        <div className="mb-3 grid grid-cols-4 gap-1.5 text-center text-[11px]">
          {Object.entries(EXPENSE_CATS).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-asfalto/60 p-2"><div aria-hidden>{v.emoji}</div><div className="font-mono text-xs">{money(w.total.byCat[k])}</div></div>
          ))}
        </div>
        {!list.length && <p className="py-4 text-center text-sm text-gris">Sin gastos esta semana.</p>}
        <ul className="divide-y divide-white/5">
          {list.map((e) => (
            <li key={e.id} className="flex items-center gap-2 py-2.5">
              <span className="text-lg" aria-hidden>{EXPENSE_CATS[e.cat]?.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{EXPENSE_CATS[e.cat]?.label}{e.note && <span className="text-gris"> · {e.note}</span>}</div>
                <div className="text-xs capitalize text-gris">{dayShort(e.date)} {e.time}</div>
              </div>
              <span className="font-mono text-tedebe">{money(e.amount)}</span>
              <button type="button" aria-label="Borrar gasto" onClick={() => confirm('¿Borrar este gasto?') && remove('expenses', e.id)} className="grid size-9 place-items-center rounded-xl bg-asfalto"><Trash2 className="size-4 text-atrasado" /></button>
            </li>
          ))}
        </ul>
      </Card>
      {toast}
    </>
  );
}
