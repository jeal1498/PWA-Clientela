// 1 · Primer pantallazo: foto, nombre, estado, vehículo y los dos accesos de contacto.
import { UserPlus, MessageCircle, Car, Wifi, Clock } from 'lucide-react';
import { currentStatus, scheduleText } from '../../lib/status.js';
import { waLink } from '../../lib/whatsapp.js';
import { Button, cx } from '../ui.jsx';

const TONE = {
  green: 'bg-cobrado/15 text-cobrado border-cobrado/30',
  yellow: 'bg-tedebe/15 text-tedebe border-tedebe/30',
  red: 'bg-atrasado/15 text-atrasado border-atrasado/30',
  gray: 'bg-white/5 text-gris border-white/10',
};
const DOT = { green: 'bg-cobrado', yellow: 'bg-tedebe', red: 'bg-atrasado', gray: 'bg-gris' };

export default function ProfileHeader({ driver, vehicle, page, hasWifi, onSaveContact }) {
  const status = currentStatus(page);
  const car = [vehicle.model, vehicle.color].filter(Boolean).join(' · ');
  const hello = 'Hola, vi tu página y quiero información sobre un viaje.';
  return (
    <header className="text-center">
      {driver.photo ? (
        <img src={driver.photo} alt={driver.name || 'Conductor'} className="mx-auto size-24 rounded-full object-cover ring-4 ring-tablero shadow-[0_0_0_2px_rgba(34,197,94,.45)]" />
      ) : (
        <div className="mx-auto grid size-24 place-items-center rounded-full bg-tablero ring-1 ring-white/10"><img src="./icon.svg" alt="" className="size-12" /></div>
      )}

      <h1 className="mt-3 font-titulo text-3xl leading-tight">{driver.name || 'Tu conductor privado'}</h1>
      <p className="text-sm text-gris">Transporte privado{driver.city ? ` · ${driver.city}` : ''}</p>

      {/* Estado: en «auto» cambia solo según el horario de servicio */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold', TONE[status.tone])}>
          <span className={cx('size-2 rounded-full', DOT[status.tone], status.tone === 'green' && 'animate-pulse')} aria-hidden />
          {status.label}
        </span>
        {scheduleText(page) && <span className="inline-flex items-center gap-1 text-xs text-gris"><Clock className="size-3.5" />{scheduleText(page)}</span>}
      </div>

      {(car || vehicle.plates) && (
        <div className="mx-auto mt-4 flex max-w-sm items-center gap-3 rounded-2xl border border-white/5 bg-tablero p-3 text-left">
          <div className="grid size-10 place-items-center rounded-xl bg-asfalto text-gris"><Car className="size-5" /></div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] tracking-wide text-gris uppercase">Tu vehículo</div>
            <div className="font-semibold leading-tight">{car || 'Vehículo'}</div>
          </div>
          {vehicle.plates && (
            <span className="rounded-lg border-2 border-hueso/80 bg-hueso px-2 py-1 font-mono text-sm font-bold tracking-wider text-asfalto" aria-label={`Placas ${vehicle.plates}`}>
              {vehicle.plates.toUpperCase()}
            </span>
          )}
        </div>
      )}

      <div className="mx-auto mt-4 grid max-w-sm gap-2">
        <Button icon={UserPlus} className="w-full text-base" onClick={onSaveContact}>Guardar contacto en el teléfono</Button>
        {driver.phone && (
          <Button variant="outline" icon={MessageCircle} className="w-full border-[#25D366]/40 text-[#25D366]" as="a" href={waLink(driver.phone, hello, driver.lada)} target="_blank" rel="noopener">
            WhatsApp directo
          </Button>
        )}
      </div>

      {hasWifi && (
        // Botón (no <a href="#…">): con HashRouter un ancla cambiaría de ruta.
        <button type="button" onClick={() => document.getElementById('a-bordo')?.scrollIntoView({ behavior: 'smooth' })} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-cobrado/10 px-3 py-1.5 text-xs text-cobrado">
          <Wifi className="size-3.5" /> ¿Vas a bordo? Conéctate al Wi-Fi
        </button>
      )}
    </header>
  );
}
