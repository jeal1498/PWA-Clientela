// 2 · Cotizador autoservicio: tipo de servicio, origen/destino, cuándo, pasajeros y maletas → precio en vivo.
// El precio sale de las tarifas del conductor (banderazo, km, minuto, recargos, caseta) o de su tarifa por hora.
import { useEffect, useMemo, useState } from 'react';
import { Users, Luggage, Loader2, Info, Route, Clock, ArrowDownUp, MessageCircle, Zap, CalendarDays, Hourglass } from 'lucide-react';
import { quote, hourlyQuote } from '../../lib/pricing.js';
import { money, kmText, minText } from '../../lib/format.js';
import { clientRequestMessage, waLink } from '../../lib/whatsapp.js';
import { useRoute } from '../../hooks/useRoute.js';
import { today } from '../../lib/dates.js';
import { Card, Field, TextInput, Stepper, Segmented, Button, cx } from '../ui.jsx';
import PlaceInput from '../PlaceInput.jsx';
import Breakdown from '../Breakdown.jsx';
import { SERVICES } from './services.js';

export default function QuoteSection({ config, service, onService, onState }) {
  const { driver, page, extras } = config;
  const enabled = SERVICES.filter((s) => page.services[s.key]);
  const svc = SERVICES.find((s) => s.key === service) || enabled[0] || SERVICES[0];
  const hourly = svc.key === 'hourly';

  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [when, setWhen] = useState('now');
  const [date, setDate] = useState(today());
  const [time, setTime] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [bags, setBags] = useState(svc.key === 'airport' ? 1 : 0);
  const [hours, setHours] = useState(+page.minHours || 2);
  const [toll, setToll] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const r = useRoute(hourly ? null : from, hourly ? null : to);
  const tollFee = +extras.tollDefault || 0;
  const q = useMemo(
    () => (hourly ? { ...hourlyQuote(hours, config), km: 0, min: 0 } : quote({ km: r.km, min: r.min, bags, tolls: toll ? tollFee : 0 }, config)),
    [hourly, hours, r.km, r.min, bags, toll, tollFee, config],
  );
  const ready = hourly ? !!from && q.price > 0 : !!(from && to && !r.loading && q.price > 0);
  const href = ready && driver.phone
    ? waLink(driver.phone, clientRequestMessage({ service: svc, from, to, now: when === 'now', date, time, passengers, bags, name, notes, q, hours: q.hours }), driver.lada)
    : null;

  // La barra fija de abajo refleja si ya hay un viaje listo para pedir.
  useEffect(() => onState?.({ ready, href, price: q.price }), [ready, href, q.price, onState]);

  return (
    <Card className="space-y-3">
      {/* Tipo de servicio */}
      {enabled.length > 1 && (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Tipo de servicio">
          {enabled.map((s) => (
            <button key={s.key} type="button" role="tab" aria-selected={s.key === svc.key} onClick={() => onService(s.key)}
              className={cx('flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition', s.key === svc.key ? 'border-cobrado/50 bg-cobrado/15 text-cobrado' : 'border-white/10 text-gris')}>
              <span aria-hidden>{s.emoji}</span>{s.short}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <PlaceInput label="Origen" placeholder={svc.key === 'airport' ? 'Aeropuerto, hotel o domicilio' : '¿Dónde te recojo?'} value={from} onChange={setFrom} city={driver.city} allowGps />
        {!hourly && (
          <>
            <div className="flex justify-center">
              <button type="button" aria-label="Invertir origen y destino" onClick={() => { setFrom(to); setTo(from); }} className="grid size-8 place-items-center rounded-full bg-white/5 text-gris active:scale-95"><ArrowDownUp className="size-4" /></button>
            </div>
            <PlaceInput label="Destino" placeholder={svc.key === 'foraneo' ? '¿A qué ciudad vas?' : '¿A dónde vas?'} value={to} onChange={setTo} city={driver.city} dot="bg-atrasado" />
          </>
        )}
      </div>

      {/* Cuándo: inmediato o programado */}
      <Segmented value={when} onChange={setWhen} options={[{ value: 'now', label: 'Ahora', icon: Zap }, { value: 'later', label: 'Programar', icon: CalendarDays }]} />
      {when === 'later' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Fecha"><TextInput type="date" value={date} min={today()} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Hora"><TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        </div>
      )}

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

      {/* Resultado en vivo */}
      <div className={cx('rounded-2xl bg-asfalto/60 p-4 transition', !ready && 'opacity-60')} aria-live="polite">
        {r.loading ? (
          <p className="flex items-center justify-center gap-2 py-4 text-gris"><Loader2 className="size-5 animate-spin" /> Calculando tu ruta…</p>
        ) : ready ? (
          <>
            <div className="text-center">
              <div className="text-sm text-gris">Precio estimado</div>
              <div className="font-mono text-5xl font-semibold text-cobrado">{money(q.price)}</div>
              <div className="mt-2 flex justify-center gap-4 text-sm text-gris">
                {hourly ? (
                  <span className="flex items-center gap-1"><Hourglass className="size-4" /> {q.hours} h a tu disposición</span>
                ) : (
                  <>
                    <span className="flex items-center gap-1"><Route className="size-4" /> {kmText(q.km)}</span>
                    <span className="flex items-center gap-1"><Clock className="size-4" /> {minText(q.min)}</span>
                  </>
                )}
              </div>
              {r.estimated && !hourly && <p className="mt-2 flex items-center justify-center gap-1 text-xs text-tedebe"><Info className="size-3.5" /> Distancia aproximada; se confirma por WhatsApp.</p>}
              <p className="mt-2 text-xs text-gris">Cotización válida por {page.validityHours} h.</p>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-center text-sm text-gris">Ver desglose</summary>
              <div className="mt-2"><Breakdown lines={q.lines} total={q.price} /></div>
            </details>
          </>
        ) : (
          <p className="py-4 text-center text-sm text-gris">{hourly ? 'Elige dónde te recojo para ver tu precio.' : 'Elige origen y destino para ver tu precio.'}</p>
        )}
      </div>

      {ready && (
        <div className="space-y-2">
          <TextInput placeholder="Tu nombre (opcional)" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <TextInput placeholder={svc.key === 'airport' ? 'Número de vuelo / terminal' : 'Nota: referencia, silla para bebé…'} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button variant="whatsapp" icon={MessageCircle} className="w-full text-base" as="a" disabled={!href} href={href || undefined} target="_blank" rel="noopener">
            {driver.phone ? 'Solicitar este viaje por WhatsApp' : 'Falta el WhatsApp del conductor'}
          </Button>
        </div>
      )}
    </Card>
  );
}
