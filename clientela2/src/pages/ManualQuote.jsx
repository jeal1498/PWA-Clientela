// Módulo C · Cotizador Exprés para el conductor (/app/manual), estilo app de viaje.
// Paso 1: ruta (lugares guardados, paradas, ⇄, enlace de Maps) y cliente. Paso 2: servicios con su ganancia neta,
// cuándo (siempre programado), lo privado («Solo para ti») y las salidas: agendar, enviar propuesta, guardar.
import { useMemo, useState } from 'react';
import { Search, Keyboard, Luggage, Eye, EyeOff, MessageCircle, Copy, Save, Wand2, Loader2, Info, CheckCheck, BookmarkPlus, Star, Map, CalendarPlus, Car, Clock, Users, Hourglass, ChevronRight } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { quote, hourlyQuote, evaluate, roundUp } from '../lib/pricing.js';
import { money, money2, kmText, minText } from '../lib/format.js';
import { driverProposalMessage, waLink, copyText } from '../lib/whatsapp.js';
import { nextSlot } from '../lib/dates.js';
import { useRoute } from '../hooks/useRoute.js';
import { Card, Field, NumberInput, TextInput, Stepper, Segmented, Button, Stat, cx } from '../components/ui.jsx';
import RoutePlaces from '../components/RoutePlaces.jsx';
import RideMap from '../components/RideMap.jsx';
import WhenPicker from '../components/WhenPicker.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import { directionsLink } from '../lib/maplink.js';
import ProfitBadge, { toneOf } from '../components/ProfitBadge.jsx';
import Breakdown from '../components/Breakdown.jsx';
import { useToast } from '../components/Toast.jsx';
import TripSheet from '../components/TripSheet.jsx';
import AgendaSheet from '../components/AgendaSheet.jsx';

const KM_PER_HOUR = 20; // «Por horas»: km que se estiman por hora para calcular el costo
const fresh = () => ({ mode: 'search', kind: 'trip', hours: 2, from: null, to: null, via: [], km: '', min: '', bags: 0, stops: 0, tolls: '', ...nextSlot(), clientId: '', clientName: '', clientPhone: '' });

export default function ManualQuote() {
  const { config, addQuote, clients, update } = useStore();
  const [tripOpen, setTripOpen] = useState(false);
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [f, setF] = useState(fresh);
  const [editing, setEditing] = useState(false);
  const [more, setMore] = useState(false);
  const [override, setOverride] = useState(null); // precio negociado; null = sugerido
  const [showPrivate, setShowPrivate] = useState(true);
  const [withBreakdown, setWithBreakdown] = useState(false);
  const [toast, showToast] = useToast();
  const set = (patch) => { setF((s) => ({ ...s, ...patch })); setOverride(null); };

  const via = f.via.filter(Boolean);
  const search = f.mode === 'search';
  const r = useRoute(search ? f.from : null, search ? f.to : null, via);
  const km = search ? r.km : +f.km || 0;
  const min = search ? r.min : +f.min || 0;
  const stopsN = search ? via.length : f.stops; // en «Buscar ruta» las paradas son las de la lista
  const hourly = f.kind === 'hourly';
  const hoursN = Math.max(1, +f.hours || 1);

  const tripQ = useMemo(() => quote({ km, min, bags: f.bags, stops: stopsN, tolls: +f.tolls || 0 }, config), [km, min, f.bags, stopsN, f.tolls, config]);
  const hourQ = useMemo(() => hourlyQuote(hoursN, config), [hoursN, config]);
  const evParams = hourly ? { km: hoursN * KM_PER_HOUR, min: hoursN * 60, tolls: 0, foraneo: false } : { km, min, tolls: +f.tolls || 0, foraneo: tripQ.foraneo };
  const q = hourly ? { ...hourQ, km: 0, min: 0, tolls: 0, foraneo: false } : tripQ;
  const price = override ?? q.price;
  const ev = useMemo(() => evaluate(price, evParams, config), [price, hourly, km, min, f.tolls, hoursN, tripQ.foraneo, config]); // eslint-disable-line react-hooks/exhaustive-deps
  const tripNet = useMemo(() => evaluate(tripQ.price, { km, min, tolls: +f.tolls || 0, foraneo: tripQ.foraneo }, config), [tripQ, km, min, f.tolls, config]);
  const hourNet = useMemo(() => evaluate(hourQ.price, { km: hoursN * KM_PER_HOUR, min: hoursN * 60, tolls: 0, foraneo: false }, config), [hourQ, hoursN, config]);
  const ready = price > 0;
  const places = hourly ? !!f.from || !search : search ? !!(f.from && f.to) : km > 0;
  const showOptions = places && !editing;

  // Ajustes rápidos sobre el precio actual.
  const adjust = [
    { label: '−10 %', fn: (p) => Math.round(p * 0.9) },
    { label: '−5 %', fn: (p) => Math.round(p * 0.95) },
    { label: '↓ $50', fn: (p) => Math.floor((p - 1) / 50) * 50 },
    { label: '+ $10', fn: (p) => p + 10 },
  ];

  const message = () => driverProposalMessage({ clientName: f.clientName, from: f.from, to: f.to, via: search && !hourly ? via : [], date: f.date, time: f.time, q: { ...q, km: hourly ? 0 : km, min: hourly ? 0 : min }, price, driverName: config.driver.name, includeBreakdown: withBreakdown });

  // Cliente frecuente elegido (CRM): llena teléfono y ofrece su tarifa preferencial.
  const client = clients.find((c) => c.id === f.clientId);
  const pickClient = (name) => {
    const c = clients.find((x) => x.name.toLowerCase() === name.trim().toLowerCase());
    setF((s) => ({ ...s, clientName: name, clientId: c?.id || '', clientPhone: c?.phone || s.clientPhone }));
  };
  const prefPrice = client && +client.discount > 0 && q.price > 0 ? roundUp(q.price * (1 - client.discount / 100), config.rates.rounding) : 0;
  const shownKm = hourly ? hoursN * KM_PER_HOUR : km;
  const shownMin = hourly ? hoursN * 60 : min;

  function saveRoute() {
    const rt = { id: crypto.randomUUID?.() || String(Date.now()), name: '', from: f.from?.label || '', to: f.to?.label || '', km, min, price: override ?? 0 };
    update('clients', client.id, { routes: [...(client.routes || []), rt] });
    showToast(`Ruta guardada en ${client.name}`);
  }

  function save() {
    addQuote({
      source: 'manual', service: f.kind, clientName: f.clientName, clientPhone: f.clientPhone,
      from: f.from?.label || '', to: f.to?.label || '', date: f.date, time: f.time,
      km: shownKm, min: shownMin, hours: hourly ? hoursN : undefined, bags: f.bags, stops: stopsN, tolls: +f.tolls || 0,
      suggested: q.price, price, net: ev.net, status: 'pendiente', profit: ev.status,
    });
    showToast('Guardada en pendientes');
  }

  const tripLabel = tripQ.foraneo ? 'Foráneo' : 'Punto a punto';
  const hasHourly = config.page.services.hourly;
  const prefill = { clientId: f.clientId, clientName: f.clientName, from: f.from?.label || '', to: f.to?.label || '', km: shownKm, amount: price, dur: Math.round(shownMin) || 30, date: f.date, time: f.time };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-titulo text-2xl">Cotizar</h1>
        <button className="text-sm text-gris underline-offset-4 active:underline" onClick={() => { setF(fresh()); setOverride(null); setEditing(false); }}>Limpiar</button>
      </div>

      <Card className="overflow-hidden p-0">
        {search && <RideMap from={f.from} to={f.to} via={via} />}
        <div className="space-y-3 p-4">
          {!showOptions ? (
            <>
              <Segmented value={f.mode} onChange={(mode) => set({ mode })} options={[{ value: 'search', label: 'Buscar ruta', icon: Search }, { value: 'express', label: 'Km y min', icon: Keyboard }]} />
              {search ? (
                <>
                  <RoutePlaces f={f} set={set} city={config.driver.city} onToast={showToast} />
                  {r.loading && <p className="flex items-center gap-2 text-sm text-gris"><Loader2 className="size-4 animate-spin" /> Calculando ruta…</p>}
                  {r.estimated && !r.loading && <p className="flex items-center gap-2 text-xs text-tedebe"><Info className="size-3.5" /> Sin ruta exacta: distancia estimada.</p>}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Kilómetros"><NumberInput autoFocus suffix="km" value={f.km} onChange={(v) => set({ km: v })} placeholder="0" /></Field>
                  <Field label="Minutos"><NumberInput suffix="min" value={f.min} onChange={(v) => set({ min: v })} placeholder="0" /></Field>
                </div>
              )}
              <Field label="Cliente">
                <TextInput list="mq-clientes" value={f.clientName} onChange={(e) => pickClient(e.target.value)} placeholder="Nombre (opcional)" />
                <datalist id="mq-clientes">{clients.map((c) => <option key={c.id} value={c.name} />)}</datalist>
              </Field>
              {places && <Button className="w-full" onClick={() => setEditing(false)}>Ver servicios</Button>}
            </>
          ) : (
            <>
              <button type="button" onClick={() => setEditing(true)} aria-label="Cambiar ruta" className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#1C1C23] px-3 py-2.5 text-left">
                <span className="size-2.5 shrink-0 rounded-full bg-atrasado" aria-hidden />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{search ? (f.to?.label || f.from?.label) : `${kmText(km)} · ${minText(min)}`}</b>
                  <small className="block truncate text-xs text-gris">{search ? `Desde ${f.from?.label || '—'}${via.length ? ` · ${via.length} parada${via.length > 1 ? 's' : ''}` : ''}` : 'Sin mapa'} · toca para cambiar</small>
                </span>
                <ChevronRight className="size-4 text-gris" aria-hidden />
              </button>

              <div className="text-[10.5px] font-bold tracking-widest text-gris uppercase">Servicio</div>
              <div className="space-y-2" aria-live="polite">
                <ServiceCard icon={Car} title={tripLabel} selected={!hourly} onSelect={() => set({ kind: 'trip' })}
                  detail={`${kmText(km)} · ${minText(min)}`} price={money(tripQ.price)} net={money(tripNet.net)} tone={toneOf(tripNet.status)} />
                {hasHourly && (
                  <ServiceCard icon={Clock} title="Por horas" selected={hourly} onSelect={() => set({ kind: 'hourly' })}
                    detail={`${hoursN} h a tu disposición`} price={money(hourQ.price)} net={money(hourNet.net)} tone={toneOf(hourNet.status)} />
                )}
              </div>

              <WhenPicker date={f.date} time={f.time} onChange={(w) => setF((s) => ({ ...s, ...w }))} />

              <button type="button" aria-expanded={more} onClick={() => setMore((v) => !v)} className="flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-asfalto px-3 text-[13px] font-bold">
                <Luggage className="size-4 text-gris" aria-hidden /> Maletas {f.bags} · Casetas {money(+f.tolls || 0)}{client ? ` · ${client.name}` : ''}
              </button>
              {more && (
                <div className="space-y-2">
                  {hourly && <Stepper label="Horas" icon={Hourglass} value={hoursN} onChange={(hours) => set({ hours })} min={1} max={12} />}
                  <Stepper label="Maletas" icon={Luggage} value={f.bags} onChange={(bags) => set({ bags })} />
                  {!search && !hourly && <Stepper label="Paradas" icon={Users} value={f.stops} onChange={(stops) => set({ stops })} />}
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Casetas">
                      <NumberInput prefix="$" value={f.tolls} onChange={(tolls) => set({ tolls })} placeholder="0" />
                      {config.extras.tollDefault > 0 && (
                        <button type="button" onClick={() => set({ tolls: +f.tolls === config.extras.tollDefault ? '' : config.extras.tollDefault })} className={cx('mt-1.5 h-8 rounded-lg px-2 text-xs', +f.tolls === config.extras.tollDefault ? 'bg-cobrado/15 text-cobrado' : 'bg-asfalto text-gris')}>
                          Caseta habitual {money(config.extras.tollDefault)}
                        </button>
                      )}
                    </Field>
                    <Field label="Cliente">
                      <TextInput list="mq-clientes" value={f.clientName} onChange={(e) => pickClient(e.target.value)} placeholder="Nombre" />
                    </Field>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {showOptions && (
        <>
          {/* Resultado + negociación */}
          <Card className={cx('transition', !ready && 'opacity-50')}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs text-gris">{override == null ? 'Tarifa sugerida' : `Precio negociado · sugerido ${money(q.price)}`}</div>
                <NumberInput className="mt-1 w-40" prefix="$" value={ready ? price : ''} onChange={(v) => setOverride(v === '' ? null : v)} aria-label="Precio final" placeholder="0" />
              </div>
              <div className="pt-1 text-right text-sm text-gris">
                {hourly ? <div>{hoursN} h</div> : <><div>{kmText(km)}</div><div>{minText(min)}</div></>}
                {q.foraneo && <div className="text-tedebe">Foráneo</div>}
              </div>
            </div>

            {search && !hourly && f.from && f.to && (
              <Button variant="outline" icon={Map} className="mt-3 h-10 w-full" as="a" href={directionsLink(f.from, f.to, via)} target="_blank" rel="noopener">Ver ruta en Maps</Button>
            )}

            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {adjust.map((a) => (
                <button key={a.label} type="button" disabled={!ready} onClick={() => setOverride(Math.max(0, a.fn(price)))} className="h-10 rounded-xl bg-asfalto font-mono text-sm active:scale-95 disabled:opacity-40">{a.label}</button>
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              <span className="grid place-items-center text-xs text-gris">Redondear</span>
              {[10, 50, 100].map((step) => (
                <button key={step} type="button" disabled={!ready} onClick={() => setOverride(roundUp(price, step))} className="h-10 rounded-xl bg-asfalto font-mono text-sm active:scale-95 disabled:opacity-40">↑ {step}</button>
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {prefPrice > 0 && (
                <button type="button" onClick={() => setOverride(prefPrice)} className="col-span-2 flex h-10 items-center justify-center gap-1 rounded-xl bg-tedebe/10 text-sm text-tedebe active:scale-95">
                  <Star className="size-4" /> Tarifa preferencial de {client.name} (−{client.discount} %): {money(prefPrice)}
                </button>
              )}
              <button type="button" disabled={!ready} onClick={() => setOverride(ev.minPriceForGoals)} className="flex h-10 items-center justify-center gap-1 rounded-xl bg-asfalto text-sm text-tedebe active:scale-95 disabled:opacity-40"><Wand2 className="size-4" /> Mínimo de mi meta</button>
              <button type="button" disabled={override == null} onClick={() => setOverride(null)} className="h-10 rounded-xl bg-asfalto text-sm text-gris active:scale-95 disabled:opacity-40">Volver al sugerido</button>
            </div>

            {/* Bloque PRIVADO: solo para el conductor. Se puede ocultar si enseña la pantalla. */}
            <div className="mt-4 rounded-2xl border border-white/5 bg-asfalto/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wide text-gris uppercase">Solo para ti</span>
                <button type="button" onClick={() => setShowPrivate((v) => !v)} className="flex items-center gap-1 text-xs text-gris" aria-label="Mostrar u ocultar ganancia">
                  {showPrivate ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{showPrivate ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {showPrivate && (
                <>
                  <ProfitBadge status={ready ? ev.status : 'idle'} />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Stat label="Ganancia neta" value={money(ev.net)} tone={toneOf(ev.status)} />
                    <Stat label="Margen" value={`${ev.margin} %`} />
                    <Stat small label={`Neto por km (meta ${money(config.goals.minPerKm)})`} value={money2(ev.metrics.netPerKm)} tone={ready ? (ev.metrics.okKm ? 'green' : 'red') : undefined} />
                    <Stat small label={`Neto por hora (meta ${money(config.goals.minPerHour)})`} value={money(ev.metrics.netPerHour)} tone={ready ? (ev.metrics.okHour ? 'green' : 'red') : undefined} />
                  </div>
                  <p className="mt-2 text-xs text-gris">
                    Costo: gasolina {money(ev.cost.fuel)} + desgaste {money(ev.cost.wear)}{ev.cost.tolls ? ` + casetas ${money(ev.cost.tolls)}` : ''} = <b className="text-hueso">{money(ev.cost.total)}</b>
                    {q.foraneo && ` (ida y vuelta, ${kmText(ev.drivenKm)})`}. No bajes de <b className="text-tedebe">{money(ev.minPriceForGoals)}</b> para cumplir tus metas.
                  </p>
                </>
              )}
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-gris">Desglose para el cliente</summary>
              <div className="mt-2"><Breakdown lines={q.lines} total={q.price} /></div>
            </details>
          </Card>

          {/* Acciones de salida */}
          <Card className="space-y-2">
            <TextInput type="tel" inputMode="tel" placeholder="WhatsApp del cliente (opcional)" value={f.clientPhone} onChange={(e) => setF((s) => ({ ...s, clientPhone: e.target.value }))} />
            <label className="flex items-center gap-2 py-1 text-sm text-gris">
              <input type="checkbox" className="size-4 accent-[#22C55E]" checked={withBreakdown} onChange={(e) => setWithBreakdown(e.target.checked)} />
              Incluir desglose en el mensaje
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" icon={CalendarPlus} disabled={!ready} onClick={() => setAgendaOpen(true)}>Agendar</Button>
              <Button variant="whatsapp" icon={MessageCircle} disabled={!ready} as="a" href={ready ? waLink(f.clientPhone, message(), config.driver.lada) : undefined} target="_blank" rel="noopener">Enviar propuesta</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" icon={Copy} disabled={!ready} onClick={async () => showToast((await copyText(message())) ? 'Texto copiado' : 'No se pudo copiar')}>Copiar</Button>
              <Button variant="outline" icon={Save} disabled={!ready} onClick={save}>Guardar</Button>
              <Button variant="ghost" icon={CheckCheck} disabled={!ready} onClick={() => setTripOpen(true)}>Ya se hizo</Button>
              <Button variant="ghost" icon={BookmarkPlus} disabled={!client || !(km > 0)} onClick={saveRoute} title={client ? `Guardar esta ruta en ${client.name}` : 'Elige un cliente guardado'}>Guardar ruta</Button>
            </div>
          </Card>
        </>
      )}

      <TripSheet open={tripOpen} onClose={() => setTripOpen(false)} prefill={{ clientId: f.clientId, clientName: f.clientName, from: f.from?.label || '', to: f.to?.label || '', km: shownKm, amount: price, date: f.date }} onSaved={() => showToast('Viaje guardado en bitácora')} />
      <AgendaSheet open={agendaOpen} onClose={() => setAgendaOpen(false)} prefill={prefill} onSaved={() => showToast('Agendado: míralo en Más → Agenda')} />
      {toast}
    </>
  );
}
