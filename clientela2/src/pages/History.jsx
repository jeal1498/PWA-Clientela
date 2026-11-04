// Historial de cotizaciones (offline). Marca aceptada/rechazada para medir tu tasa de cierre.
import { Check, X, Trash2, MessageCircle, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/AppStore.jsx';
import { money, kmText, minText, dateText } from '../lib/format.js';
import { driverProposalMessage, waLink } from '../lib/whatsapp.js';
import { Card, cx } from '../components/ui.jsx';
import ProfitBadge from '../components/ProfitBadge.jsx';

const STATUS = {
  pendiente: 'bg-tedebe/15 text-tedebe',
  aceptada: 'bg-cobrado/15 text-cobrado',
  rechazada: 'bg-white/5 text-gris',
};

export default function History() {
  const { history, updateQuote, removeQuote, config } = useStore();

  if (!history.length) {
    return (
      <Card className="py-10 text-center text-gris">
        <Inbox className="mx-auto mb-2 size-8" />
        Aún no guardas cotizaciones.
        <Link to="/app/manual" className="mt-3 block text-cobrado">Cotizar un viaje</Link>
      </Card>
    );
  }

  return (
    <>
      <h1 className="font-titulo text-2xl">Historial</h1>
      {history.map((h) => {
        const msg = driverProposalMessage({ clientName: h.clientName, from: h.from, to: h.to, date: h.date, time: h.time, q: { km: h.km, min: h.min, tolls: h.tolls, lines: [] }, price: h.price, driverName: config.driver.name });
        const icon = 'grid size-9 place-items-center rounded-xl bg-asfalto active:scale-95';
        return (
          <Card key={h.id} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-semibold">{h.clientName || 'Sin nombre'}</div>
                <div className="truncate text-xs text-gris">{[h.from, h.to].filter(Boolean).join(' → ') || `${kmText(h.km)} · ${minText(h.min)}`}</div>
                <div className="text-xs text-gris">{h.date ? dateText(h.date, h.time) : new Date(h.createdAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg">{money(h.price)}</div>
                <div className={cx('font-mono text-xs', h.net > 0 ? 'text-cobrado' : 'text-atrasado')}>neto {money(h.net)}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cx('rounded-full px-2.5 py-1 text-xs font-semibold capitalize', STATUS[h.status])}>{h.status}</span>
              {h.profit && <ProfitBadge status={h.profit} compact />}
              <div className="ml-auto flex gap-1.5">
                <a className={icon} href={waLink(h.clientPhone, msg, config.driver.lada)} target="_blank" rel="noopener" aria-label="Reenviar por WhatsApp"><MessageCircle className="size-4 text-[#25D366]" /></a>
                <button className={icon} onClick={() => updateQuote(h.id, { status: 'aceptada' })} aria-label="Marcar aceptada"><Check className="size-4 text-cobrado" /></button>
                <button className={icon} onClick={() => updateQuote(h.id, { status: 'rechazada' })} aria-label="Marcar rechazada"><X className="size-4 text-gris" /></button>
                <button className={icon} onClick={() => confirm('¿Borrar esta cotización?') && removeQuote(h.id)} aria-label="Borrar"><Trash2 className="size-4 text-atrasado" /></button>
              </div>
            </div>
          </Card>
        );
      })}
    </>
  );
}
