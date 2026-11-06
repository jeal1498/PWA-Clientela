// 1 · Primer pantallazo: quién es, si está disponible, por qué confiar y UN solo botón lleno: pedir el viaje.
import { Car, Clock, MessageCircle } from 'lucide-react';
import { currentStatus, scheduleText } from '../../lib/status.js';
import { waLink } from '../../lib/whatsapp.js';
import { Button, cx } from '../ui.jsx';

const TONE = {
  green: 'bg-cobrado/15 text-cobrado border-cobrado/30',
  yellow: 'bg-white/5 text-hueso border-white/15', // el amarillo y el rojo de la marca son del dinero, no del estado
  red: 'bg-white/5 text-hueso border-white/15',
  gray: 'bg-white/5 text-gris border-white/10',
};
const DOT = { green: 'bg-cobrado', yellow: 'bg-hueso', red: 'bg-gris', gray: 'bg-gris' };

export default function ProfileHeader({ driver, vehicle, page, onSaveContact, onRequest }) {
  const status = currentStatus(page);
  const car = [vehicle.model, vehicle.color].filter(Boolean).join(' · ');
  const hello = 'Hola, vi tu página y quiero información sobre un viaje.';
  const t = page.trust || {};
  const stats = [t.years && { v: `${t.years} ${+t.years === 1 ? 'año' : 'años'}`, l: 'de servicio' }, t.trips && { v: String(t.trips), l: 'viajes' }, t.insured && { v: 'Seguro', l: 'vigente' }].filter(Boolean);
  const initial = (driver.name || '').trim()[0]?.toUpperCase();
  return (
    <header className="text-center">
      {driver.photo ? (
        <img src={driver.photo} alt={driver.name || 'Conductor'} className="mx-auto size-24 rounded-full object-cover ring-4 ring-tablero shadow-[0_0_0_2px_rgba(244,244,239,.35)]" />
      ) : (
        <div className="mx-auto grid size-24 place-items-center rounded-full bg-hueso font-titulo text-5xl font-bold text-asfalto" aria-hidden>{initial || <Car className="size-10" />}</div>
      )}

      <h1 className="mt-3 font-titulo text-3xl leading-tight">{driver.name || 'Conductor privado'}</h1>
      <p className="text-sm text-gris">{driver.name ? 'Conductor privado' : ''}{driver.name && driver.city ? ' · ' : ''}{driver.city || ''}</p>

      {/* Estado: en «auto» cambia solo según el horario de servicio */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold', TONE[status.tone])}>
          <span className={cx('size-2 rounded-full', DOT[status.tone], status.tone === 'green' && 'animate-pulse motion-reduce:animate-none')} aria-hidden />
          {status.label}
        </span>
        {scheduleText(page) && <span className="inline-flex items-center gap-1 text-sm text-gris"><Clock className="size-4" aria-hidden />{scheduleText(page)}</span>}
      </div>

      {stats.length > 0 && (
        <div className="mx-auto mt-4 grid max-w-sm gap-2" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
          {stats.map((x) => (
            <div key={x.l} className="rounded-2xl border border-white/5 bg-tablero px-1 py-2.5">
              <b className="block font-mono text-lg">{x.v}</b>
              <span className="text-[13px] text-gris">{x.l}</span>
            </div>
          ))}
        </div>
      )}
      {t.quote && (
        <figure className="mx-auto mt-3 max-w-sm rounded-2xl bg-tablero p-3 text-left">
          <blockquote className="text-[15px]">“{t.quote}”</blockquote>
          {t.quoteBy && <figcaption className="mt-1 text-[13px] text-gris">{t.quoteBy}</figcaption>}
        </figure>
      )}

      {(car || vehicle.plates) && (
        <div className="mx-auto mt-3 flex max-w-sm items-center gap-3 rounded-2xl border border-white/5 bg-tablero p-3 text-left">
          <div className="grid size-10 place-items-center rounded-xl bg-asfalto text-gris"><Car className="size-5" aria-hidden /></div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] tracking-wide text-gris uppercase">Así es mi auto</div>
            <div className="font-semibold leading-tight">{car || 'Vehículo'}</div>
          </div>
          {vehicle.plates && (
            <span className="rounded-lg border-2 border-hueso/80 bg-hueso px-2 py-1 font-mono text-sm font-bold tracking-wider text-asfalto" aria-label={`Placas ${vehicle.plates}`}>
              {vehicle.plates.toUpperCase()}
            </span>
          )}
        </div>
      )}

      <div className="mx-auto mt-4 grid max-w-sm gap-1">
        <Button id="pedir-cta" className="h-[52px] w-full text-base font-bold" onClick={onRequest}>Pedir mi viaje</Button>
        {driver.phone && (
          <Button variant="outline" icon={MessageCircle} className="w-full" as="a" href={waLink(driver.phone, hello, driver.lada)} target="_blank" rel="noopener">
            Escribirme por WhatsApp
          </Button>
        )}
        <button type="button" onClick={onSaveContact} className="inline-flex min-h-11 items-center justify-center gap-1.5 text-sm text-gris underline underline-offset-4">
          Guardar mi contacto
        </button>
      </div>
    </header>
  );
}
