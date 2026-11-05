// 3 · Servicios y zonas de cobertura. Tocar un servicio lo elige en el cotizador y sube hasta él.
import { MapPin, ChevronRight } from 'lucide-react';
import { money } from '../../lib/format.js';
import { SERVICES } from './services.js';
import Section from './Section.jsx';

export default function ServicesSection({ page, onPick }) {
  const list = SERVICES.filter((s) => page.services[s.key]);
  const zones = String(page.zones || '').split(/[,\n]/).map((z) => z.trim()).filter(Boolean);
  if (!list.length && !zones.length) return null;
  return (
    <Section id="servicios" title="Servicios" subtitle="Elige uno y cotiza al instante.">
      <div className="grid grid-cols-2 gap-2">
        {list.map((s) => (
          <button key={s.key} type="button" onClick={() => onPick(s.key)} className="group flex flex-col rounded-3xl border border-white/5 bg-tablero p-4 text-left transition active:scale-[.98]">
            <span className="text-3xl" aria-hidden>{s.emoji}</span>
            <span className="mt-2 font-semibold leading-tight">{s.short}</span>
            <span className="mt-1 flex-1 text-xs leading-snug text-gris">{s.desc}</span>
            {s.key === 'hourly' && +page.hourlyRate > 0 && <span className="mt-2 font-mono text-xs text-cobrado">{money(page.hourlyRate)} / hora</span>}
            <span className="mt-2 flex items-center gap-0.5 text-xs text-cobrado">Cotizar <ChevronRight className="size-3.5" /></span>
          </button>
        ))}
      </div>
      {zones.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-1.5 text-sm text-gris"><MapPin className="size-4" /> Zonas de cobertura</div>
          <div className="flex flex-wrap gap-1.5">
            {zones.map((z) => <span key={z} className="rounded-full border border-white/10 bg-tablero px-3 py-1 text-sm">{z}</span>)}
          </div>
        </div>
      )}
    </Section>
  );
}
