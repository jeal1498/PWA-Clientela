// Fila de 4 botones de gasto (un toque abre la captura con la categoría elegida).
import { useState } from 'react';
import { EXPENSE_CATS } from '../lib/ledger.js';
import ExpenseSheet from './ExpenseSheet.jsx';

export default function ExpenseQuick({ onSaved }) {
  const [cat, setCat] = useState(null);
  return (
    <>
      <div className="grid grid-cols-4 gap-1.5">
        {Object.entries(EXPENSE_CATS).map(([k, v]) => (
          <button key={k} type="button" onClick={() => setCat(k)} className="flex h-16 flex-col items-center justify-center rounded-2xl bg-asfalto text-xs leading-tight text-gris active:scale-95">
            <span className="text-xl" aria-hidden>{v.emoji}</span>{v.label.split(' /')[0]}
          </button>
        ))}
      </div>
      <ExpenseSheet cat={cat} onClose={() => setCat(null)} onSaved={onSaved} />
    </>
  );
}
