// 5 · Métodos de pago aceptados y políticas breves.
import { Banknote, Landmark, CreditCard, BadgeCheck, Timer, CalendarCheck } from 'lucide-react';
import Section from './Section.jsx';
import { cx } from '../ui.jsx';

const PAYS = [
  { key: 'efectivo', icon: Banknote, label: 'Efectivo' },
  { key: 'spei', icon: Landmark, label: 'Transferencia SPEI' },
  { key: 'tarjeta', icon: CreditCard, label: 'Tarjeta' },
];

export default function PaymentsPolicies({ page }) {
  const policies = [
    +page.validityHours > 0 && { icon: BadgeCheck, title: 'Validez de la cotización', text: `El precio estimado se respeta por ${page.validityHours} h, salvo cambios de ruta o paradas extra.` },
    +page.waitMin > 0 && { icon: Timer, title: 'Tolerancia de espera', text: `Te espero ${page.waitMin} min sin costo; después se cobra el tiempo de espera.` },
    page.bookingNote && { icon: CalendarCheck, title: 'Reservas', text: page.bookingNote },
  ].filter(Boolean);
  return (
    <Section id="pagos" title="Pagos y políticas">
      <div className="grid grid-cols-3 gap-2">
        {PAYS.map(({ key, icon: Icon, label }) => {
          const on = page.payments[key];
          return (
            <div key={key} className={cx('flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center text-xs', on ? 'border-white/5 bg-tablero' : 'border-dashed border-white/10 text-gris')}>
              <Icon className={cx('size-6', on ? 'text-hueso' : '')} aria-hidden />
              <span>{label}</span>
              <span className="sr-only">{on ? 'aceptado' : 'no aceptado'}</span>
              {!on && <span className="text-xs">No disponible</span>}
            </div>
          );
        })}
      </div>
      {policies.length > 0 && (
        <ul className="mt-3 divide-y divide-white/5 rounded-3xl border border-white/5 bg-tablero px-4">
          {policies.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3 py-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-gris" aria-hidden />
              <div><div className="text-sm font-semibold">{title}</div><p className="text-sm text-gris">{text}</p></div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
