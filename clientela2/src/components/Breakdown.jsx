// Desglose de la tarifa (líneas que ve el cliente).
import { money } from '../lib/format.js';

export default function Breakdown({ lines, total }) {
  return (
    <dl className="divide-y divide-hueso/5 text-sm">
      {lines.map((l) => (
        <div key={l.key} className="flex justify-between py-2">
          <dt className="text-gris">{l.label}</dt>
          <dd className="font-mono">{money(l.amount)}</dd>
        </div>
      ))}
      {total != null && (
        <div className="flex justify-between pt-3 font-semibold">
          <dt>Total</dt>
          <dd className="font-mono text-ok">{money(total)}</dd>
        </div>
      )}
    </dl>
  );
}
