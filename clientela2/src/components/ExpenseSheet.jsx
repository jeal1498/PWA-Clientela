// Captura ultrarrápida de un gasto: categoría (ya elegida) + monto + guardar.
import { sym } from '../lib/moneda.js';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { EXPENSE_CATS } from '../lib/ledger.js';
import { today, hm } from '../lib/dates.js';
import { money } from '../lib/format.js';
import Sheet from './Sheet.jsx';
import { NumberInput, TextInput, Button, cx } from './ui.jsx';

export default function ExpenseSheet({ cat, onClose, onSaved, sugeridos = false }) {
  const { add, expenses, config } = useStore();
  const [c, setC] = useState(cat);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => { if (cat) { setC(cat); setAmount(''); setNote(''); } }, [cat]);

  // Montos frecuentes: lo último que anotaste por categoría (y la caseta habitual), a 1 toque.
  const frecuentes = [];
  if (sugeridos) {
    const seen = new Set();
    [...expenses].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).forEach((e) => {
      const k = `${e.cat}-${e.amount}`;
      if (EXPENSE_CATS[e.cat] && +e.amount > 0 && !seen.has(k) && frecuentes.length < 4) { seen.add(k); frecuentes.push({ cat: e.cat, amount: +e.amount }); }
    });
    const caseta = +config.extras?.tollDefault || 0;
    if (caseta > 0 && !frecuentes.some((x) => x.cat === 'casetas' && x.amount === caseta)) frecuentes.unshift({ cat: 'casetas', amount: caseta });
  }
  function rapido({ cat: k, amount: m }) {
    add('expenses', { date: today(), time: hm(), cat: k, amount: m, note: '' });
    onSaved?.(`Gasto de ${EXPENSE_CATS[k].label.toLowerCase()} guardado`);
    onClose();
  }

  function save() {
    add('expenses', { date: today(), time: hm(), cat: c, amount: +amount, note: note.trim() });
    onSaved?.(`Gasto de ${EXPENSE_CATS[c].label.toLowerCase()} guardado`);
    onClose();
  }

  return (
    <Sheet open={!!cat} onClose={onClose} title="Nuevo gasto">
      <div className="space-y-3">
        {frecuentes.length > 0 && (
          <div>
            <div className="mb-1.5 text-xs font-bold tracking-widest text-gris uppercase">Anotar en 1 toque</div>
            <div className="flex flex-wrap gap-1.5">
              {frecuentes.slice(0, 4).map((x) => (
                <button key={`${x.cat}-${x.amount}`} type="button" onClick={() => rapido(x)} className="min-h-11 rounded-full border border-cobrado/40 bg-cobrado/10 px-3.5 text-sm font-bold text-ok active:scale-95">
                  {EXPENSE_CATS[x.cat].emoji} {EXPENSE_CATS[x.cat].label.split(' /')[0]} {money(x.amount)}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-4 gap-1.5">
          {Object.entries(EXPENSE_CATS).map(([k, v]) => (
            <button key={k} type="button" onClick={() => setC(k)} className={cx('flex h-16 flex-col items-center justify-center rounded-2xl text-xs leading-tight', c === k ? 'bg-cobrado/15 text-ok ring-1 ring-cobrado/40' : 'bg-asfalto text-gris')}>
              <span className="text-xl" aria-hidden>{v.emoji}</span>{v.label.split(' /')[0]}
            </button>
          ))}
        </div>
        <NumberInput prefix={sym()} value={amount} onChange={setAmount} placeholder="0" autoFocus aria-label="Monto del gasto" onKeyDown={(e) => e.key === 'Enter' && +amount > 0 && save()} />
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)" />
        <Button icon={Check} className="w-full" disabled={!(+amount > 0)} onClick={save}>Guardar gasto</Button>
      </div>
    </Sheet>
  );
}
