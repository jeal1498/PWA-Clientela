// Tarjeta de servicio estilo app de viaje: ícono, nombre, detalle y precio (y la ganancia neta si es para el conductor).
import { cx } from './ui.jsx';

const TONE = { green: 'text-ok', yellow: 'text-aviso', red: 'text-malo' };

export default function ServiceCard({ icon: Icon, title, detail, price, net, tone, selected, onSelect }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onSelect}
      className={cx('flex min-h-[68px] w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-left', selected ? 'border-hueso bg-asfalto' : 'border-transparent')}>
      <span className="grid h-11 w-14 shrink-0 place-items-center rounded-xl bg-tablero"><Icon className="size-6" aria-hidden /></span>
      <span className="min-w-0 flex-1"><b className="block font-titulo text-base">{title}</b><small className="block truncate text-[13px] text-gris">{detail}</small></span>
      <span className="text-right">
        <span className="block font-mono text-lg font-bold tabular-nums">{price}</span>
        {net && <span className={cx('block text-xs font-bold', TONE[tone] || 'text-gris')}>neta {net}</span>}
      </span>
    </button>
  );
}
