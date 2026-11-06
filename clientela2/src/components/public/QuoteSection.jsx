// 2 · Cotizador estilo app de viaje. Paso 1: ¿A dónde vas? Paso 2: elige servicio, cuándo (siempre programado) y pide por WhatsApp.
// El precio sale de las tarifas del conductor (banderazo, km, minuto, recargos, caseta) o de su tarifa por hora.
import { useEffect, useMemo, useState } from 'react';
import { Users, Luggage, Loader2, Info, Car, Plane, Route, Clock, MessageCircle, Hourglass, ChevronRight } from 'lucide-react';
import { quote, hourlyQuote } from '../../lib/pricing.js';
import { money, kmText, minText } from '../../lib/format.js';
import { clientRequestMessage, waLink } from '../../lib/whatsapp.js';
import { useRoute } from '../../hooks/useRoute.js';
import { nextSlot } from '../../lib/dates.js';
import { Card, Stepper, TextInput, Button } from '../ui.jsx';
import PlaceInput from '../PlaceInput.jsx';
import Breakdown from '../Breakdown.jsx';
import RideMap from '../RideMap.jsx';
import WhenPicker from '../WhenPicker.jsx';
import ServiceCard from '../ServiceCard.jsx';
import { SERVICES } from './services.js';

export default function QuoteSection({ config, service, onService, onState }) {
  const { driver, page, extras } = config;
  const enabled = SERVICES.filter((s) => page.services[s.key]);
  const svc = SERVICES.find((s) => s.key === service) || enabled[0] || SERVICES[0];
  const hourly = svc.key === 'hourly';
  const tripKey = hourly ? enabled.find((s) => s.key !== 'hourly')?.key : svc.key; // servicio «de viaje» que representa la primera tarjeta
  const hasTrip = !!tripKey, hasHourly = enabled.some((s) => s.key === 'hourly');

  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [editing, setEditing] = useState(false);
  const [slot, setSlot] = useState(nextSlot);
  const [passengers, setPassengers] = useState(1);
  const [bags, setBags] = useState(svc.key === 'airport' ? 1 : 0);
  const [hours, setHours] = useState(+page.minHours || 2);
  const [more, setMore] = useState(false);
  const [toll, setToll] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const r = useRoute(hourly ? null : from, hourly ? null : to);
  const tollFee = +extras.tollDefault || 0;
  const tripQ = useMemo(() => quote({ km: r.km, min: r.min, bags, tolls: toll ? tollFee : 0 }, config), [r.km, r.min, bags, toll, tollFee, config]);
  const hourQ = useMemo(() => ({ ...hourlyQuote(hours, config), km: 0, min: 0 }), [hours, config]);
  const q = hourly ? hourQ : tripQ;
  const places = hourly ? !!from : !!(from && to);
  const ready = places && !!slot.time && !(r.loading && !hourly) && q.price > 0;
  const href = ready && driver.phone
    ? waLink(driver.phone, clientRequestMessage({ service: svc, from, to, now: false, date: slot.date, time: slot.time, passengers, bags, name, notes, q, hours: q.hours }), driver.lada)
    : null;

  // La barra fija de abajo refleja si ya hay un viaje listo para pedir.
  useEffect(() => onState?.({ ready, href, price: q.price }), [ready, href, q.price, onState]);

  const showOptions = places && !editing;
  const tripLabel = tripQ.foraneo && enabled.some((s) => s.key === 'foraneo') ? 'Foráneo' : tripKey === 'airport' ? 'Aeropuerto' : tripKey === 'foraneo' ? 'Foráneo' : 'Punto a punto';
  const TripIcon = tripKey === 'airport' ? Plane : tripKey === 'foraneo' ? Route : Car;

  return (
    <Card className="overflow-hidden p-0">
      <RideMap from={from} to={hourly ? null : to} />
      <div className="relative -mt-5 space-y-3 rounded-t-3xl border-t border-white/10 bg-tablero p-4 pt-2.5">
        <div className="mx-auto h-1 w-10 rounded-full bg-white/15" aria-hidden />
        {!showOptions ? (
          <>
            <h3 className="font-titulo text-xl">{hourly ? '¿Dónde te recojo?' : '¿A dónde vas?'}</h3>
            <PlaceInput label="Origen" placeholder={svc.key === 'airport' ? 'Aeropuerto, hotel o domicilio' : '¿Dónde te recojo?'} value={from} onChange={(p) => { setFrom(p); if (p) setEditing(false); }} city={driver.city} allowGps />
            {!hourly && <PlaceInput label="Destino" placeholder={svc.key === 'foraneo' ? '¿A qué ciudad vas?' : '¿A dónde vas?'} value={to} onChange={(p) => { setTo(p); if (p) setEditing(false); }} city={driver.city} dot="bg-atrasado" />}
            {places && <Button className="w-full" onClick={() => setEditing(false)}>Ver servicios</Button>}
            {hasHourly && !hourly && <button type="button" onClick={() => onService('hourly')} className="text-sm text-gris underline underline-offset-4">¿Necesitas el auto por horas?</button>}
            {hourly && hasTrip && <button type="button" onClick={() => onService(tripKey)} className="text-sm text-gris underline underline-offset-4">Prefiero un viaje de A a B</button>}
          </>
        ) : (
          <>
            <button type="button" onClick={() => setEditing(true)} aria-label="Cambiar ruta" className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#1C1C23] px-3 py-2.5 text-left">
              <span className="size-2.5 shrink-0 rounded-full bg-atrasado" aria-hidden />
              <span className="min-w-0 flex-1"><b className="block truncate text-sm">{hourly ? from.label : to.label}</b><small className="text-xs text-gris">{hourly ? 'Recogida' : `Desde ${from.label}`} · toca para cambiar</small></span>
              <ChevronRight className="size-4 text-gris" aria-hidden />
            </button>

            <div className="text-[10.5px] font-bold tracking-widest text-gris uppercase">Elige tu servicio</div>
            <div className="space-y-2" aria-live="polite">
              {hasTrip && (
                <ServiceCard icon={TripIcon} title={tripLabel} selected={!hourly} onSelect={() => !hourly || onService(tripKey)}
                  detail={r.loading ? 'Calculando tu ruta…' : `${kmText(tripQ.km)} · ${minText(tripQ.min)}`} price={r.loading ? '…' : money(tripQ.price)} />
              )}
              {hasHourly && (
                <ServiceCard icon={Clock} title="Por horas" selected={hourly} onSelect={() => hourly || onService('hourly')}
                  detail={`${Math.max(hours, +page.minHours || 1)} h a tu disposición`} price={money(hourQ.price)} />
              )}
            </div>
            {r.estimated && !hourly && !r.loading && <p className="flex items-center gap-1 text-xs text-tedebe"><Info className="size-3.5" /> Distancia aproximada; se confirma por WhatsApp.</p>}

            <WhenPicker date={slot.date} time={slot.time} onChange={setSlot} />

            <button type="button" aria-expanded={more} onClick={() => setMore((v) => !v)} className="flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-asfalto px-3 text-[13px] font-bold">
              <Users className="size-4 text-gris" aria-hidden /> Pasajeros {passengers} · <Luggage className="size-4 text-gris" aria-hidden /> Maletas {bags}
            </button>
            {more && (
              <div className="space-y-2">
                {hourly && <Stepper label={`Horas (mín. ${page.minHours})`} icon={Hourglass} value={Math.max(hours, +page.minHours || 1)} onChange={setHours} min={+page.minHours || 1} max={12} />}
                <Stepper label="Pasajeros" icon={Users} value={passengers} onChange={setPassengers} min={1} max={8} />
                <Stepper label="Maletas" icon={Luggage} value={bags} onChange={setBags} max={10} />
                {!hourly && tollFee > 0 && (
                  <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-asfalto/40 p-3 text-sm text-gris">
                    <input type="checkbox" className="size-4 accent-[#22C55E]" checked={toll} onChange={(e) => setToll(e.target.checked)} />
                    Ir por autopista de cuota (+{money(tollFee)})
                  </label>
                )}
              </div>
            )}

            <details>
              <summary className="cursor-pointer text-sm text-gris">Ver desglose · válido por {page.validityHours} h</summary>
              <div className="mt-2"><Breakdown lines={q.lines} total={q.price} /></div>
            </details>

            <div className="space-y-2">
              <TextInput placeholder="Tu nombre (opcional)" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              <TextInput placeholder={svc.key === 'airport' ? 'Número de vuelo / terminal' : 'Nota: referencia, silla para bebé…'} value={notes} onChange={(e) => setNotes(e.target.value)} />
              <Button variant="whatsapp" icon={MessageCircle} className="w-full text-base" as="a" disabled={!href} href={href || undefined} target="_blank" rel="noopener">
                {driver.phone ? `Solicitar por WhatsApp · ${money(q.price)}` : 'Falta el WhatsApp del conductor'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
