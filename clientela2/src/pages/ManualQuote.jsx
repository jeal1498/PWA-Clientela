// Módulo C · Cotizador Exprés para el conductor (/app/manual).
// Para cuando el cliente llama o escribe: cotiza en segundos, ve su ganancia real y negocia con datos.
import { useMemo, useState } from 'react';
import { Search, Keyboard, Luggage, Milestone, Eye, EyeOff, MessageCircle, Copy, Save, Wand2, ArrowDownUp, Loader2, Info, CheckCheck, BookmarkPlus, Star } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { quote, evaluate, roundUp } from '../lib/pricing.js';
import { money, money2, kmText, minText } from '../lib/format.js';
import { driverProposalMessage, waLink, copyText } from '../lib/whatsapp.js';
import { useRoute } from '../hooks/useRoute.js';
import { Card, CardTitle, Field, NumberInput, TextInput, Stepper, Segmented, Button, Stat, cx } from '../components/ui.jsx';
import PlaceInput from '../components/PlaceInput.jsx';
import ProfitBadge, { toneOf } from '../components/ProfitBadge.jsx';
import Breakdown from '../components/Breakdown.jsx';
import { useToast } from '../components/Toast.jsx';
import TripSheet from '../components/TripSheet.jsx';

const EMPTY = { mode: 'search', from: null, to: null, km: '', min: '', bags: 0, stops: 0, tolls: '', date: '', time: '', clientId: '', clientName: '', clientPhone: '' };

export default function ManualQuote() {
  const { config, addQuote, clients, update } = useStore();
  const [tripOpen, setTripOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [override, setOverride] = useState(null); // precio negociado; null = sugerido
  const [showPrivate, setShowPrivate] = useState(true);
  const [withBreakdown, setWithBreakdown] = useState(false);
  const [toast, showToast] = useToast();
  const set = (patch) => { setF((s) => ({ ...s, ...patch })); setOverride(null); };

  const r = useRoute(f.mode === 'search' ? f.from : null, f.mode === 'search' ? f.to : null);
  const km = f.mode === 'search' ? r.km : +f.km || 0;
  const min = f.mode === 'search' ? r.min : +f.min || 0;

  const q = useMemo(() => quote({ km, min, bags: f.bags, stops: f.stops, tolls: +f.tolls || 0 }, config), [km, min, f.bags, f.stops, f.tolls, config]);
  const price = override ?? q.price;
  const ev = useMemo(() => (override == null ? q : evaluate(price, q, config)), [override, price, q, config]);
  const ready = price > 0;

  // Ajustes rápidos sobre el precio actual.
  const adjust = [
    { label: '−10 %', fn: (p) => Math.round(p * 0.9) },
    { label: '−5 %', fn: (p) => Math.round(p * 0.95) },
    { label: '↓ $50', fn: (p) => Math.floor((p - 1) / 50) * 50 },
    { label: '+ $10', fn: (p) => p + 10 },
  ];

  const message = () => driverProposalMessage({ clientName: f.clientName, from: f.from, to: f.to, date: f.date, time: f.time, q, price, driverName: config.driver.name, includeBreakdown: withBreakdown });

  // Cliente frecuente elegido (CRM): llena teléfono y ofrece su tarifa preferencial.
  const client = clients.find((c) => c.id === f.clientId);
  const pickClient = (name) => {
    const c = clients.find((x) => x.name.toLowerCase() === name.trim().toLowerCase());
    setF((s) => ({ ...s, clientName: name, clientId: c?.id || '', clientPhone: c?.phone || s.clientPhone }));
  };
  const prefPrice = client && +client.discount > 0 && q.price > 0 ? roundUp(q.price * (1 - client.discount / 100), config.rates.rounding) : 0;

  function saveRoute() {
    const r = { id: crypto.randomUUID?.() || String(Date.now()), name: '', from: f.from?.label || '', to: f.to?.label || '', km, min, price: override ?? 0 };
    update('clients', client.id, { routes: [...(client.routes || []), r] });
    showToast(`Ruta guardada en ${client.name}`);
  }

  function save() {
    addQuote({
      source: 'manual', clientName: f.clientName, clientPhone: f.clientPhone,
      from: f.from?.label || '', to: f.to?.label || '', date: f.date, time: f.time,
      km, min, bags: f.bags, stops: f.stops, tolls: +f.tolls || 0,
      suggested: q.price, price, net: ev.net, status: 'pendiente', profit: ev.status,
    });
    showToast('Guardada en pendientes');
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-titulo text-2xl">Cotizar rápido</h1>
        <button className="text-sm text-gris underline-offset-4 active:underline" onClick={() => { setF(EMPTY); setOverride(null); }}>Limpiar</button>
      </div>

      <Card>
        <Segmented value={f.mode} onChange={(mode) => set({ mode })} options={[{ value: 'search', label: 'Buscar ruta', icon: Search }, { value: 'express', label: 'Km y min', icon: Keyboard }]} />
        <div className="mt-3 space-y-2">
          {f.mode === 'search' ? (
            <>
              <PlaceInput label="Origen" placeholder="¿De dónde sale?" value={f.from} onChange={(from) => set({ from })} city={config.driver.city} allowGps />
              <div className="flex justify-center">
                <button type="button" aria-label="Invertir origen y destino" onClick={() => set({ from: f.to, to: f.from })} className="grid size-8 place-items-center rounded-full bg-white/5 text-gris active:scale-95"><ArrowDownUp className="size-4" /></button>
              </div>
              <PlaceInput label="Destino" placeholder="¿A dónde va?" value={f.to} onChange={(to) => set({ to })} city={config.driver.city} dot="bg-atrasado" />
              {r.loading && <p className="flex items-center gap-2 text-sm text-gris"><Loader2 className="size-4 animate-spin" /> Calculando ruta…</p>}
              {r.estimated && !r.loading && <p className="flex items-center gap-2 text-xs text-tedebe"><Info className="size-3.5" /> Sin ruta exacta: distancia estimada.</p>}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Kilómetros"><NumberInput autoFocus suffix="km" value={f.km} onChange={(v) => set({ km: v })} placeholder="0" /></Field>
              <Field label="Minutos"><NumberInput suffix="min" value={f.min} onChange={(v) => set({ min: v })} placeholder="0" /></Field>
            </div>
          )}
        </div>
      </Card>

      <Card className="space-y-2">
        <Stepper label="Maletas" icon={Luggage} value={f.bags} onChange={(bags) => set({ bags })} />
        <Stepper label="Paradas" icon={Milestone} value={f.stops} onChange={(stops) => set({ stops })} />
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
            <datalist id="mq-clientes">{clients.map((c) => <option key={c.id} value={c.name} />)}</datalist>
          </Field>
          <Field label="Fecha"><TextInput type="date" value={f.date} onChange={(e) => setF((s) => ({ ...s, date: e.target.value }))} /></Field>
          <Field label="Hora"><TextInput type="time" value={f.time} onChange={(e) => setF((s) => ({ ...s, time: e.target.value }))} /></Field>
        </div>
      </Card>

      {/* Resultado + negociación */}
      <Card className={cx('transition', !ready && 'opacity-50')}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs text-gris">{override == null ? 'Tarifa sugerida' : `Precio negociado · sugerido ${money(q.price)}`}</div>
            <NumberInput
              className="mt-1 w-40"
              prefix="$"
              value={ready ? price : ''}
              onChange={(v) => setOverride(v === '' ? null : v)}
              aria-label="Precio final"
              placeholder="0"
            />
          </div>
          <div className="pt-1 text-right text-sm text-gris">
            <div>{kmText(km)}</div>
            <div>{minText(min)}</div>
            {q.foraneo && <div className="text-tedebe">Foráneo</div>}
          </div>
        </div>

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
        <CardTitle icon={MessageCircle}>Enviar propuesta</CardTitle>
        <TextInput type="tel" inputMode="tel" placeholder="WhatsApp del cliente (opcional)" value={f.clientPhone} onChange={(e) => setF((s) => ({ ...s, clientPhone: e.target.value }))} />
        <label className="flex items-center gap-2 py-1 text-sm text-gris">
          <input type="checkbox" className="size-4 accent-[#22C55E]" checked={withBreakdown} onChange={(e) => setWithBreakdown(e.target.checked)} />
          Incluir desglose en el mensaje
        </label>
        <Button variant="whatsapp" icon={MessageCircle} className="w-full" disabled={!ready} as="a" href={ready ? waLink(f.clientPhone, message(), config.driver.lada) : undefined} target="_blank" rel="noopener">
          Enviar por WhatsApp
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" icon={Copy} disabled={!ready} onClick={async () => showToast((await copyText(message())) ? 'Texto copiado' : 'No se pudo copiar')}>Copiar</Button>
          <Button variant="outline" icon={Save} disabled={!ready} onClick={save}>Guardar</Button>
          <Button variant="ghost" icon={CheckCheck} disabled={!ready} onClick={() => setTripOpen(true)}>Ya se hizo</Button>
          <Button variant="ghost" icon={BookmarkPlus} disabled={!client || !(km > 0)} onClick={saveRoute} title={client ? `Guardar esta ruta en ${client.name}` : 'Elige un cliente guardado'}>Guardar ruta</Button>
        </div>
      </Card>
      <TripSheet
        open={tripOpen}
        onClose={() => setTripOpen(false)}
        prefill={{ clientId: f.clientId, clientName: f.clientName, from: f.from?.label || '', to: f.to?.label || '', km, amount: price, ...(f.date ? { date: f.date } : {}) }}
        onSaved={() => showToast('Viaje guardado en bitácora')}
      />
      {toast}
    </>
  );
}
