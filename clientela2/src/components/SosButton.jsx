// Botón SOS del encabezado.
//  · UN TOQUE  → manda «Estoy iniciando un viaje en [ubicación]» al contacto de emergencia.
//  · MANTENER  → abre la hoja con «En ruta», «Necesito ayuda» y «Llamar al 911».
// Sin contacto configurado, el toque abre la hoja con el enlace a Ajustes.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Loader2, MapPin, Play, Navigation, Siren } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { warmLocation, freshLocation, locateNow } from '../lib/maps.js';
import { sosText, sosLink } from '../lib/sos.js';
import Sheet from './Sheet.jsx';
import { Button } from './ui.jsx';
import { useToast } from './Toast.jsx';

const HOLD_MS = 600;

export default function SosButton() {
  const { config } = useStore();
  const { sos, driver } = config;
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [loc, setLoc] = useState(null);
  const [toast, showToast] = useToast();
  const hold = useRef({ timer: 0, fired: false });
  const ready = !!sos.phone;

  // Si ya hay permiso de ubicación, se mantiene fresca para que el toque sea instantáneo.
  useEffect(() => { if (ready) warmLocation(); }, [ready]);
  // La hoja usa la última ubicación o la pide al abrirse.
  useEffect(() => {
    if (!open || !ready) return;
    setLoc(freshLocation());
    locateNow().then((p) => p && setLoc(p));
  }, [open, ready]);

  const link = (kind, where) => sosLink({ phone: sos.phone, lada: driver.lada, channel: sos.channel }, sosText(kind, where, sos.trackingLink));

  // Abre WhatsApp/SMS. Dentro del toque: pestaña nueva (la app sigue abierta). Fuera del toque: navegación.
  const go = (url, inGesture) => {
    if (inGesture && sos.channel !== 'sms') window.open(url, '_blank', 'noopener');
    else location.href = url;
  };

  async function quickSend() {
    if (!ready) return setOpen(true);
    const fix = freshLocation();
    if (fix) { go(link('start', fix), true); showToast('Aviso listo para enviar'); return; }
    // Primera vez (o ubicación vieja): se pide al momento, máximo 4 s; si no llega, sale sin mapa.
    setSending(true);
    const p = await locateNow(4000);
    setSending(false);
    go(link('start', p), false);
    if (!p) showToast('Sin ubicación: se envió sin mapa');
  }

  // Mantener presionado → hoja de opciones; soltar antes → envío rápido (onClick).
  const down = () => { hold.current.fired = false; hold.current.timer = setTimeout(() => { hold.current.fired = true; navigator.vibrate?.(30); setOpen(true); }, HOLD_MS); };
  const cancel = () => clearTimeout(hold.current.timer);

  return (
    <>
      <button
        type="button"
        aria-label="SOS: un toque avisa que inicias viaje; mantén presionado para más opciones"
        title="Toque: «Estoy iniciando un viaje». Mantén presionado: más opciones."
        disabled={sending}
        onPointerDown={down}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => { if (hold.current.fired) { hold.current.fired = false; return; } quickSend(); }}
        className="flex select-none items-center gap-1 rounded-full bg-atrasado/15 min-h-11 px-4 text-sm font-semibold text-atrasado active:scale-95 disabled:opacity-60"
        style={{ WebkitTouchCallout: 'none' }}
      >
        {sending ? <Loader2 className="size-4 animate-spin" /> : <ShieldAlert className="size-4" />} SOS
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Seguridad">
        {!ready ? (
          <p className="text-sm text-gris">
            Primero agrega tu contacto de emergencia en{' '}
            <Link to="/app/settings#sos" onClick={() => setOpen(false)} className="text-cobrado underline">Ajustes → Seguridad</Link>.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm text-gris">
              <MapPin className={loc ? 'size-4 text-cobrado' : 'size-4 text-tedebe'} />
              {loc ? 'Ubicación lista.' : 'Buscando ubicación… si no llega, se envía sin mapa.'}
            </p>
            <p className="text-xs text-gris">Se envía a <b className="text-hueso">{sos.name || sos.phone}</b> por {sos.channel === 'sms' ? 'SMS' : 'WhatsApp'}. Un toque al botón SOS manda el primero.</p>
            <Button as="a" href={link('start', loc)} target="_blank" rel="noopener" icon={Play} className="w-full">Estoy iniciando un viaje</Button>
            <Button as="a" href={link('route', loc)} target="_blank" rel="noopener" icon={Navigation} variant="ghost" className="w-full">En ruta</Button>
            <Button as="a" href={link('help', loc)} target="_blank" rel="noopener" icon={Siren} variant="danger" className="w-full">Necesito ayuda</Button>
            <Button as="a" href="tel:911" variant="outline" className="w-full">Llamar al 911</Button>
          </div>
        )}
      </Sheet>
      {toast}
    </>
  );
}
