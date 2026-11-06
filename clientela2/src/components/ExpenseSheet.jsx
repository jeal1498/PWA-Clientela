// Captura ultrarrápida de un gasto: categoría (ya elegida) + monto + guardar.
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { EXPENSE_CATS } from '../lib/ledger.js';
import { today, hm } from '../lib/dates.js';
import Sheet from './Sheet.jsx';
import { NumberInput, TextInput, Button, cx } from './ui.jsx';

export default function ExpenseSheet({ cat, onClose, onSaved }) {
  const { add } = useStore();
  const [c, setC] = useState(cat);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => { if (cat) { setC(cat); setAmount(''); setNote(''); } }, [cat]);

  function save() {
    add('expenses', { date: today(), time: hm(), cat: c, amount: +amount, note: note.trim() });
    onSaved?.(`Gasto de ${EXPENSE_CATS[c].label.toLowerCase()} guardado`);
    onClose();
  }

  return (
    <Sheet open={!!cat} onClose={onClose} title="Nuevo gasto">
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-1.5">
          {Object.entries(EXPENSE_CATS).map(([k, v]) => (
            <button key={k} type="button" onClick={() => setC(k)} className={cx('flex h-16 flex-col items-center justify-center rounded-2xl text-xs leading-tight', c === k ? 'bg-cobrado/15 text-cobrado ring-1 ring-cobrado/40' : 'bg-asfalto text-gris')}>
              <span className="text-xl" aria-hidden>{v.emoji}</span>{v.label.split(' /')[0]}
            </button>
          ))}
        </div>
        <NumberInput prefix="$" value={amount} onChange={setAmount} placeholder="0" autoFocus aria-label="Monto del gasto" onKeyDown={(e) => e.key === 'Enter' && +amount > 0 && save()} />
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)" />
        <Button icon={Check} className="w-full" disabled={!(+amount > 0)} onClick={save}>Guardar gasto</Button>
      </div>
    </Sheet>
  );
}
