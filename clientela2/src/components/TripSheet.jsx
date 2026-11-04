// Registrar (o editar) un viaje realizado en la bitácora. Se abre vacío o precargado desde una cotización.
import { useEffect, useState } from 'react';
import { Banknote, Landmark, CreditCard, Check } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { today, hm } from '../lib/dates.js';
import Sheet from './Sheet.jsx';
import { Field, NumberInput, TextInput, Segmented, Button } from './ui.jsx';

const PAY_OPTIONS = [
  { value: 'efectivo', label: 'Efectivo', icon: Banknote },
  { value: 'spei', label: 'SPEI', icon: Landmark },
  { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
];

const blank = () => ({ date: today(), time: hm(), clientId: '', clientName: '', from: '', to: '', km: '', amount: '', pay: 'efectivo' });

/** prefill: datos iniciales; editing: viaje existente; onSaved(trip) para marcar la cotización. */
export default function TripSheet({ open, onClose, prefill, editing, onSaved }) {
  const { clients, add, update } = useStore();
  const [f, setF] = useState(blank);
  // Solo al abrir: si dependiera de `prefill` (objeto nuevo en cada render) borraría lo que escribes.
  useEffect(() => { if (open) setF({ ...blank(), ...(editing || prefill || {}) }); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (p) => setF((s) => ({ ...s, ...p }));

  function save() {
    const data = { ...f, km: +f.km || 0, amount: +f.amount || 0 };
    const trip = editing ? (update('trips', editing.id, data), { ...editing, ...data }) : add('trips', data);
    onSaved?.(trip);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Editar viaje' : 'Viaje realizado'}>
      <div className="space-y-3">
        <Field label="Cobrado">
          <NumberInput prefix="$" value={f.amount} onChange={(amount) => set({ amount })} placeholder="0" autoFocus aria-label="Monto cobrado" />
        </Field>
        <Segmented value={f.pay} onChange={(pay) => set({ pay })} options={PAY_OPTIONS} />
        <Field label="Cliente">
          <TextInput list="clientes-lista" value={f.clientName} placeholder="Nombre (opcional)"
            onChange={(e) => { const c = clients.find((x) => x.name === e.target.value); set({ clientName: e.target.value, clientId: c?.id || '' }); }} />
          <datalist id="clientes-lista">{clients.map((c) => <option key={c.id} value={c.name} />)}</datalist>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Origen"><TextInput value={f.from} onChange={(e) => set({ from: e.target.value })} placeholder="De" /></Field>
          <Field label="Destino"><TextInput value={f.to} onChange={(e) => set({ to: e.target.value })} placeholder="A" /></Field>
          <Field label="Km recorridos"><NumberInput suffix="km" value={f.km} onChange={(km) => set({ km })} placeholder="0" /></Field>
          <Field label="Fecha"><TextInput type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} /></Field>
        </div>
        <Button icon={Check} className="w-full" disabled={!(+f.amount > 0)} onClick={save}>Guardar en bitácora</Button>
      </div>
    </Sheet>
  );
}
