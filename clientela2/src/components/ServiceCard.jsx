// Tarjeta de servicio estilo app de viaje: ícono, nombre, detalle y precio (y la ganancia neta si es para el conductor).
import { cx } from './ui.jsx';

const TONE = { green: 'text-cobrado', yellow: 'text-tedebe', red: 'text-atrasado' };

export default function ServiceCard({ icon: Icon, title, detail, price, net, tone, selected, onSelect }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onSelect}
      className={cx('flex w-full items-center gap-3 rounded-2xl border bg-[#1C1C23] p-3 text-left', selected ? 'border-hueso ring-1 ring-hueso' : 'border-white/10')}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-tablero"><Icon className="size-5" aria-hidden /></span>
      <span className="min-w-0 flex-1"><b className="block text-[15px]">{title}</b><small className="block truncate text-xs text-gris">{detail}</small></span>
      <span className="text-right">
        <span className="block font-mono text-lg font-bold tabular-nums">{price}</span>
        {net && <span className={cx('block text-xs font-bold', TONE[tone] || 'text-gris')}>neta {net}</span>}
      </span>
    </button>
  );
}
