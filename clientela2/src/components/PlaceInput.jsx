// Buscador de direcciones con autocompletado (OpenStreetMap) y botón «Mi ubicación».
import { useEffect, useRef, useState } from 'react';
import { Crosshair, Loader2, MapPin, X } from 'lucide-react';
import { searchPlaces, myLocation } from '../lib/maps.js';
import { cx } from './ui.jsx';

export default function PlaceInput({ label, value, onChange, city, placeholder, dot = 'bg-cobrado', allowGps, bare }) {
  const [text, setText] = useState(value?.label || '');
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef();

  useEffect(() => setText(value?.label || ''), [value]);

  // Debounce de 350 ms: rápido al escribir y amable con los servidores gratuitos.
  function onType(t) {
    setText(t);
    if (value) onChange(null);
    clearTimeout(timer.current);
    if (t.trim().length < 3) return setItems([]);
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        setItems(await searchPlaces(t, { city }));
        setOpen(true);
      } catch {
        setItems([]);
      } finally {
        setBusy(false);
      }
    }, 350);
  }

  function pick(p) {
    onChange(p);
    setText(p.label);
    setOpen(false);
  }

  async function gps() {
    setBusy(true);
    try { pick(await myLocation()); } catch { /* permiso negado */ } finally { setBusy(false); }
  }

  return (
    <div className="relative">
      <div className={cx('flex items-center gap-2 px-3', bare ? 'min-h-12 rounded-xl focus-within:bg-white/5' : 'h-12 rounded-2xl border border-white/10 bg-asfalto focus-within:border-cobrado/70')}>
        {!bare && <span className={cx('size-2.5 shrink-0 rounded-full', dot)} aria-hidden />}
        <input
          aria-label={label}
          className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-gris"
          placeholder={placeholder}
          value={text}
          onChange={(e) => onType(e.target.value)}
          onFocus={() => items.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoComplete="off"
        />
        {busy && <Loader2 className="size-4 animate-spin text-gris" />}
        {!busy && text && <button type="button" aria-label="Borrar" onClick={() => { setText(''); onChange(null); setItems([]); }} className="grid size-11 place-items-center"><X className="size-4 text-gris" /></button>}
        {!busy && !text && allowGps && <button type="button" aria-label="Usar mi ubicación" onClick={gps} className="grid size-11 place-items-center"><Crosshair className="size-4 text-gris" /></button>}
      </div>
      {open && items.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-2xl border border-white/10 bg-tablero p-1 shadow-2xl">
          {items.map((p, i) => (
            <li key={i}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(p)} className="flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left active:bg-white/5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gris" />
                <span className="min-w-0">
                  <span className="block truncate">{p.label}</span>
                  {p.sub && <span className="block truncate text-xs text-gris">{p.sub}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
