// Semáforo de rentabilidad: verde (cumple metas), amarillo (solo una), rojo (ninguna o pérdida).
import { CircleCheck, TriangleAlert, OctagonX, CircleDashed } from 'lucide-react';
import { STATUS_COPY } from '../lib/pricing.js';
import { cx } from './ui.jsx';

const STYLE = {
  green: { cls: 'bg-cobrado/15 text-ok border-cobrado/30', Icon: CircleCheck },
  yellow: { cls: 'bg-tedebe/15 text-aviso border-tedebe/30', Icon: TriangleAlert },
  red: { cls: 'bg-atrasado/15 text-malo border-atrasado/30', Icon: OctagonX },
  idle: { cls: 'bg-hueso/5 text-gris border-hueso/10', Icon: CircleDashed },
};

export default function ProfitBadge({ status = 'idle', compact }) {
  const { cls, Icon } = STYLE[status];
  const copy = STATUS_COPY[status];
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold', cls)}>
      <Icon className="size-3.5" aria-hidden />
      {copy.label}
      {!compact && <span className="font-normal opacity-80">· {copy.hint}</span>}
    </span>
  );
}

export const toneOf = (status) => (status === 'idle' ? undefined : status);
