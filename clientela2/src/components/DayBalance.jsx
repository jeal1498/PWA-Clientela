// Balance en vivo del día: Ingresos (bitácora) − Gastos = Ganancia neta real.
import { useStore } from '../store/AppStore.jsx';
import { daySummary } from '../lib/ledger.js';
import { today } from '../lib/dates.js';
import { money } from '../lib/format.js';
import { cx } from './ui.jsx';

export default function DayBalance({ day = today() }) {
  const { trips, expenses } = useStore();
  const d = daySummary(trips, expenses, day);
  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1 text-center">
        <div><div className="text-xs text-gris">Ingresos</div><div className="font-mono text-lg">{money(d.gross)}</div></div>
        <span className="text-gris">−</span>
        <div><div className="text-xs text-gris">Gastos</div><div className="font-mono text-lg text-aviso">{money(d.spent)}</div></div>
        <span className="text-gris">=</span>
        <div><div className="text-xs text-gris">Neta real</div><div className={cx('font-mono text-lg font-semibold', d.net > 0 ? 'text-ok' : d.net < 0 ? 'text-malo' : '')}>{money(d.net)}</div></div>
      </div>
      <p className="mt-2 text-center text-xs text-gris">{d.trips} {d.trips === 1 ? 'viaje' : 'viajes'} · {d.km} km</p>
    </div>
  );
}
