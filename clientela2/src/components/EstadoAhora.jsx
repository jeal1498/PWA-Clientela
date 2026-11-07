// Indicador Disponible / Ocupado del conductor (solo para él). Se recalcula cada minuto.
import { useEffect, useState } from 'react';
import { useStore } from '../store/AppStore.jsx';
import { estadoAhora, MODOS } from '../lib/estado.js';
import Sheet from './Sheet.jsx';
import { Button, cx } from './ui.jsx';

export default function EstadoAhora() {
  const { trips, config, setSection } = useStore();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(i); }, []);
  const modo = config.app?.statusMode || 'auto';
  const e = estadoAhora(trips, now, modo);

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl border border-hueso/10 bg-elev px-3.5 py-3" role="status">
        <span className={cx('size-3.5 shrink-0 rounded-full', e.ocupado ? 'bg-atrasado' : 'bg-cobrado')} aria-hidden />
        <div className="min-w-0 flex-1"><b className={cx('block text-lg', e.ocupado ? 'text-malo' : 'text-ok')}>{e.texto}</b><small className="block truncate text-xs text-gris">{e.detalle}</small></div>
        <Button variant="outline" className="h-11" onClick={() => setOpen(true)}>Cambiar</Button>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title="Mi estado">
        <div className="space-y-2">
          {MODOS.map((m) => (
            <button key={m.key} type="button" aria-pressed={modo === m.key} onClick={() => { setSection('app', { statusMode: m.key }); setOpen(false); }}
              className={cx('h-12 w-full rounded-xl border px-3.5 text-left text-sm font-bold', modo === m.key ? 'border-hueso bg-tablero' : 'border-hueso/10 bg-asfalto text-gris')}>{m.label}</button>
          ))}
          <p className="pt-1 text-xs text-gris">Solo lo ves tú. La página que ve el cliente sigue con su estado por horario.</p>
        </div>
      </Sheet>
    </>
  );
}
