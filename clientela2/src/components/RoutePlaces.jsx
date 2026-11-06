// Ruta del cotizador: lugares guardados, origen, paradas entre medio, ⇄, destino y enlace de Maps.
import { useState } from 'react';
import { ArrowDownUp, Crosshair, Home, Briefcase, GraduationCap, MapPin, Plus, Star, X, Link2 } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { myLocation } from '../lib/maps.js';
import { parseMapLink } from '../lib/maplink.js';
import PlaceInput from './PlaceInput.jsx';
import Sheet from './Sheet.jsx';
import { Button, TextInput, cx } from './ui.jsx';

const ICONS = { Casa: Home, Trabajo: Briefcase, Escuela: GraduationCap };
const NAMES = ['Casa', 'Trabajo', 'Escuela'];
const samePlace = (a, b) => a && b && Math.abs(a.lat - b.lat) < 1e-4 && Math.abs(a.lon - b.lon) < 1e-4;

/** f.from, f.to: lugar o null; f.via: arreglo de lugar o null. `set(patch)` actualiza el formulario. */
export default function RoutePlaces({ f, set, city, onToast }) {
  const { places, add, remove } = useStore();
  const [saving, setSaving] = useState(null); // 'from' | 'to'
  const [otro, setOtro] = useState('');
  const [link, setLink] = useState('');
  const parsed = link.trim() ? parseMapLink(link) : null;

  const saved = (p) => p && places.find((x) => samePlace(x, p));

  function usePlace(p) {
    const pt = { label: p.label, sub: p.sub, lat: p.lat, lon: p.lon };
    set(f.from ? { to: pt } : { from: pt }); // primero el origen; si ya está, el destino
  }
  async function aqui() {
    try { set({ from: await myLocation() }); } catch { onToast('No pude leer tu ubicación'); }
  }
  function toggleStar(which) {
    const p = f[which];
    if (!p) return;
    const s = saved(p);
    if (s) { remove('places', s.id); onToast(`Quitado: ${s.name}`); } else { setOtro(''); setSaving(which); }
  }
  function guardar(name) {
    name = name.trim();
    const p = f[saving];
    if (!name || !p) return;
    places.filter((x) => x.name.toLowerCase() === name.toLowerCase()).forEach((x) => remove('places', x.id));
    add('places', { name, label: p.label, sub: p.sub || '', lat: p.lat, lon: p.lon });
    setSaving(null);
    onToast(`Guardado como ${name}`);
  }
  function fromLink() {
    if (!parsed || parsed.unreadable) return;
    set({ to: { label: parsed.name || 'Punto del enlace', sub: `${parsed.lat.toFixed(5)}, ${parsed.lon.toFixed(5)}`, lat: parsed.lat, lon: parsed.lon } });
    setLink('');
  }

  const star = (which) => (
    <button type="button" aria-label={saved(f[which]) ? 'Quitar de mis lugares' : 'Guardar como lugar'} aria-pressed={!!saved(f[which])} disabled={!f[which]} onClick={() => toggleStar(which)}
      className={cx('grid size-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-asfalto disabled:opacity-40', saved(f[which]) ? 'border-tedebe/50 text-tedebe' : 'text-gris')}>
      <Star className="size-[18px]" fill={saved(f[which]) ? 'currentColor' : 'none'} aria-hidden />
    </button>
  );
  const setVia = (i, p) => set({ via: f.via.map((x, j) => (j === i ? p : x)) });

  return (
    <div className="space-y-2">
      <div className="text-[10.5px] font-bold tracking-widest text-gris uppercase">Tus lugares</div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {places.map((p) => {
          const Icon = ICONS[p.name] || MapPin;
          return <button key={p.id} type="button" onClick={() => usePlace(p)} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-asfalto px-3 text-[13px] font-bold active:scale-95"><Icon className="size-4 text-gris" aria-hidden />{p.name}</button>;
        })}
        <button type="button" onClick={aqui} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-asfalto px-3 text-[13px] font-bold active:scale-95"><Crosshair className="size-4 text-gris" aria-hidden />Aquí</button>
      </div>
      {!places.length && <p className="text-xs text-gris">Toca ☆ junto a un lugar para guardarlo como Casa, Trabajo, Escuela u otro.</p>}

      <div className="flex gap-2">
        <div className="min-w-0 flex-1"><PlaceInput label="Origen" placeholder="¿De dónde sale?" value={f.from} onChange={(from) => set({ from })} city={city} allowGps /></div>
        {star('from')}
      </div>

      {f.via.map((v, i) => (
        <div key={i} className="flex gap-2">
          <div className="min-w-0 flex-1"><PlaceInput label={`Parada ${i + 1}`} placeholder={`Parada ${i + 1}`} value={v} onChange={(p) => setVia(i, p)} city={city} dot="bg-gris" /></div>
          <button type="button" aria-label={`Quitar parada ${i + 1}`} onClick={() => set({ via: f.via.filter((_, j) => j !== i) })} className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-asfalto text-gris"><X className="size-[18px]" aria-hidden /></button>
        </div>
      ))}

      <button type="button" onClick={() => set({ via: [...f.via, null] })} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/20 text-[13px] font-bold text-gris active:scale-[.99]">
        <Plus className="size-4" aria-hidden />{f.via.length ? 'Otra parada' : 'Agregar parada'}
      </button>

      <div className="flex justify-center">
        <button type="button" aria-label="Invertir origen y destino" onClick={() => set({ from: f.to, to: f.from, via: [...f.via].reverse() })} className="grid h-8 w-11 place-items-center rounded-xl border border-white/10 bg-asfalto text-gris active:scale-95"><ArrowDownUp className="size-4" aria-hidden /></button>
      </div>

      <div className="flex gap-2">
        <div className="min-w-0 flex-1"><PlaceInput label="Destino" placeholder="¿A dónde va?" value={f.to} onChange={(to) => set({ to })} city={city} dot="bg-atrasado" /></div>
        {star('to')}
      </div>

      <div className="flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-asfalto px-3">
        <Link2 className="size-4 shrink-0 text-gris" aria-hidden />
        <input aria-label="Pegar enlace de Google Maps" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Pegar enlace de Google Maps" className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-gris/60" />
      </div>
      {parsed && !parsed.unreadable && (
        <button type="button" onClick={fromLink} className="flex w-full items-center gap-2.5 rounded-2xl border border-white/10 bg-asfalto px-3 py-2.5 text-left">
          <MapPin className="size-[18px] shrink-0 text-gris" aria-hidden />
          <span className="min-w-0"><b className="block truncate text-sm">{parsed.name || 'Punto del enlace'}</b><small className="text-xs text-gris">Del enlace pegado · toca para usarlo de destino</small></span>
        </button>
      )}
      {parsed?.unreadable && <p className="text-xs text-tedebe">No pude leer ese enlace. Los cortos (maps.app.goo.gl) no se abren desde aquí: ábrelo y copia el enlace largo.</p>}

      <Sheet open={!!saving} onClose={() => setSaving(null)} title="Guardar lugar">
        <p className="mb-3 truncate text-sm text-gris">{f[saving]?.label}</p>
        <div className="grid grid-cols-3 gap-2">
          {NAMES.map((n) => <Button key={n} variant="outline" className="px-2" onClick={() => guardar(n)}>{n}</Button>)}
        </div>
        <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); guardar(otro); }}>
          <TextInput value={otro} onChange={(e) => setOtro(e.target.value)} placeholder="Otro nombre (Gym, Mamá…)" aria-label="Otro nombre" />
          <Button disabled={!otro.trim()} type="submit">Guardar</Button>
        </form>
      </Sheet>
    </div>
  );
}
