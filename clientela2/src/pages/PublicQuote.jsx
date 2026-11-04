// Módulo B · Cotizador público autoservicio (/). Pensado para el Linktree del conductor.
// Lee las tarifas del enlace (#/?c=…); si no hay, usa las del propio teléfono (vista previa del conductor).
import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Users, Luggage, CalendarClock, MessageCircle, Loader2, Info, Route, Clock, ArrowDownUp, Settings, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { decodeConfig } from '../lib/share.js';
import { quote } from '../lib/pricing.js';
import { money, kmText, minText } from '../lib/format.js';
import { clientRequestMessage, waLink } from '../lib/whatsapp.js';
import { useRoute } from '../hooks/useRoute.js';
import { Card, Field, TextInput, Stepper, Button, cx } from '../components/ui.jsx';
import PlaceInput from '../components/PlaceInput.jsx';
import Breakdown from '../components/Breakdown.jsx';

export default function PublicQuote() {
  const [params] = useSearchParams();
  const store = useStore();
  const shared = useMemo(() => (params.get('c') ? decodeConfig(params.get('c')) : null), [params]);
  const config = shared || store.config;
  const { driver } = config;
  const isPreview = !shared;

  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [bags, setBags] = useState(0);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [toll, setToll] = useState(false);
  const tollFee = config.extras.tollDefault;

  const r = useRoute(from, to);
  const q = useMemo(() => quote({ km: r.km, min: r.min, bags, tolls: toll ? tollFee : 0 }, config), [r.km, r.min, bags, toll, tollFee, config]);
  const ready = from && to && !r.loading && q.price > 0;
  const msg = ready ? clientRequestMessage({ from, to, date, time, passengers, bags, name, notes, q }) : '';

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pt-8 pb-28">
      {/* Encabezado tipo tarjeta de presentación */}
      <header className="mb-6 text-center">
        <img src="./icon.svg" alt="" className="mx-auto mb-3 size-16" />
        <h1 className="font-titulo text-3xl leading-tight">{driver.name ? `Viaja con ${driver.name}` : 'Cotiza tu viaje'}</h1>
        <p className="mt-1 text-gris">Transporte privado{driver.city ? ` en ${driver.city}` : ''}. Precio al instante, sin apps.</p>
        <div className="mt-3 flex justify-center gap-3 text-xs text-gris">
          <span className="flex items-center gap-1"><ShieldCheck className="size-3.5 text-cobrado" /> Precio claro</span>
          <span className="flex items-center gap-1"><MessageCircle className="size-3.5 text-cobrado" /> Confirmas por WhatsApp</span>
        </div>
      </header>

      {isPreview && (
        <Link to="/app" className="mb-4 flex items-center gap-2 rounded-2xl border border-tedebe/30 bg-tedebe/10 p-3 text-sm text-tedebe">
          <Settings className="size-4 shrink-0" /> Vista previa con tus tarifas. Comparte tu enlace desde el Panel.
        </Link>
      )}

      <div className="space-y-4">
        <Card className="space-y-2">
          <PlaceInput label="Origen" placeholder="¿Dónde te recojo?" value={from} onChange={setFrom} city={driver.city} allowGps />
          <div className="flex justify-center">
            <button type="button" aria-label="Invertir origen y destino" onClick={() => { setFrom(to); setTo(from); }} className="grid size-8 place-items-center rounded-full bg-white/5 text-gris active:scale-95"><ArrowDownUp className="size-4" /></button>
          </div>
          <PlaceInput label="Destino" placeholder="¿A dónde vas?" value={to} onChange={setTo} city={driver.city} dot="bg-atrasado" />
        </Card>

        <Card className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Fecha"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} /></Field>
            <Field label="Hora"><TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
          </div>
          <Stepper label="Pasajeros" icon={Users} value={passengers} onChange={setPassengers} min={1} max={8} />
          <Stepper label="Maletas" icon={Luggage} value={bags} onChange={setBags} max={10} />
          {tollFee > 0 && (
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-asfalto/40 p-3 text-sm text-gris">
              <input type="checkbox" className="size-4 accent-[#22C55E]" checked={toll} onChange={(e) => setToll(e.target.checked)} />
              Ir por autopista de cuota (+{money(tollFee)})
            </label>
          )}
        </Card>

        {/* Resultado */}
        <Card className={cx('transition', !ready && 'opacity-60')} aria-live="polite">
          {r.loading ? (
            <p className="flex items-center justify-center gap-2 py-6 text-gris"><Loader2 className="size-5 animate-spin" /> Calculando tu ruta…</p>
          ) : ready ? (
            <>
              <div className="text-center">
                <div className="text-sm text-gris">Tarifa estimada</div>
                <div className="font-mono text-5xl font-semibold text-cobrado">{money(q.price)}</div>
                <div className="mt-2 flex justify-center gap-4 text-sm text-gris">
                  <span className="flex items-center gap-1"><Route className="size-4" /> {kmText(q.km)}</span>
                  <span className="flex items-center gap-1"><Clock className="size-4" /> {minText(q.min)}</span>
                </div>
                {r.estimated && <p className="mt-2 flex items-center justify-center gap-1 text-xs text-tedebe"><Info className="size-3.5" /> Distancia aproximada; se confirma por WhatsApp.</p>}
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer text-center text-sm text-gris">Ver desglose</summary>
                <div className="mt-2"><Breakdown lines={q.lines} total={q.price} /></div>
              </details>
            </>
          ) : (
            <p className="flex items-center justify-center gap-2 py-6 text-center text-gris"><CalendarClock className="size-5" /> Elige origen y destino para ver tu precio.</p>
          )}
        </Card>

        {ready && (
          <Card className="space-y-2">
            <TextInput placeholder="Tu nombre (opcional)" value={name} onChange={(e) => setName(e.target.value)} />
            <TextInput placeholder="Nota: vuelo, referencia, silla para bebé…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Card>
        )}
      </div>

      {/* CTA fijo al pulgar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/5 bg-asfalto/95 p-3 backdrop-blur" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + .75rem)' }}>
        <div className="mx-auto max-w-lg">
          <Button variant="whatsapp" icon={MessageCircle} className="w-full" as="a" disabled={!ready || !driver.phone} href={ready ? waLink(driver.phone, msg, driver.lada) : undefined} target="_blank" rel="noopener">
            {driver.phone ? 'Solicitar por WhatsApp' : 'Falta el WhatsApp del conductor'}
          </Button>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-gris/60">Precio estimado; puede variar por tráfico, casetas o cambios de ruta.</p>
    </div>
  );
}
