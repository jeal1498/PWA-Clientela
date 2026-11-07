// 3 · Servicios y zonas de cobertura. Lista con ícono, una línea y precio «desde»; tocar una fila la elige en el cotizador y sube hasta él.
import { MapPin, Car, Plane, MapPinned, Clock, ChevronRight } from 'lucide-react';
import { money } from '../../lib/format.js';
import { quote } from '../../lib/pricing.js';
import { SERVICES } from './services.js';
import Section from './Section.jsx';

const ICON = { urban: Car, airport: Plane, foraneo: MapPinned, hourly: Clock };

/** Precio base de cada servicio, sacado de las tarifas del conductor (null si no hay tarifa). */
function desde(s, page, config) {
  if (s.key === 'hourly') return +page.hourlyRate > 0 ? { v: money(page.hourlyRate), u: 'por hora' } : null;
  const km = s.key === 'foraneo' ? +config.extras.foraneoKm || 40 : 1;
  const p = quote({ km, min: Math.round(km * 1.2) }, config).price;
  return p > 0 ? { v: money(p), u: 'desde' } : null;
}

export default function ServicesSection({ page, config, onPick }) {
  const list = SERVICES.filter((s) => page.services[s.key]);
  const zones = String(page.zones || '').split(/[,\n]/).map((z) => z.trim()).filter(Boolean);
  if (!list.length && !zones.length) return null;
  return (
    <Section id="servicios" title="Servicios" subtitle="Toca uno y cotiza al instante.">
      <div className="divide-y divide-hueso/5 overflow-hidden rounded-2xl border border-hueso/5 bg-tablero" role="list">
        {list.map((s) => {
          const Icon = ICON[s.key] || Car;
          const d = desde(s, page, config);
          return (
            <button key={s.key} type="button" role="listitem" onClick={() => onPick(s.key)} className="grid min-h-[68px] w-full grid-cols-[44px_1fr_auto] items-center gap-3 px-3 py-2.5 text-left active:bg-hueso/5">
              <span className="grid size-11 place-items-center rounded-xl bg-asfalto"><Icon className="size-6" strokeWidth={1.8} aria-hidden /></span>
              <span className="min-w-0"><b className="block font-titulo text-base">{s.short}</b><small className="block truncate text-[13.5px] text-gris">{s.line}</small></span>
              <span className="flex items-center gap-1 text-right">
                {d && <span><small className="block text-xs text-gris">{d.u}</small><b className="font-mono text-sm">{d.v}</b></span>}
                <ChevronRight className="size-4 text-gris" aria-hidden />
              </span>
            </button>
          );
        })}
      </div>
      {zones.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-1.5 text-sm text-gris"><MapPin className="size-4" aria-hidden /> Zonas donde atiendo</div>
          <div className="flex flex-wrap gap-1.5">
            {zones.map((z) => <span key={z} className="rounded-full border border-humo px-3 py-1.5 text-sm">{z}</span>)}
          </div>
        </div>
      )}
    </Section>
  );
}
