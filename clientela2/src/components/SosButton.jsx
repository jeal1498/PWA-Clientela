// Botón SOS del encabezado. Al abrir ya busca la ubicación; el aviso sale con un toque.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Loader2, MapPin, Play, Navigation, Siren } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { myLocation } from '../lib/maps.js';
import { sosText, sosLink } from '../lib/sos.js';
import Sheet from './Sheet.jsx';
import { Button } from './ui.jsx';

export default function SosButton() {
  const { config } = useStore();
  const { sos, driver } = config;
  const [open, setOpen] = useState(false);
  const [loc, setLoc] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | locating | ok | fail

  useEffect(() => {
    if (!open) return;
    setStatus('locating');
    myLocation().then((p) => { setLoc(p); setStatus('ok'); }).catch(() => setStatus('fail'));
  }, [open]);

  const ready = !!sos.phone;
  const link = (kind) => sosLink({ phone: sos.phone, lada: driver.lada, channel: sos.channel }, sosText(kind, loc, sos.trackingLink));

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Seguridad: compartir ubicación" className="flex items-center gap-1 rounded-full bg-atrasado/15 px-3 py-1.5 text-xs font-semibold text-atrasado active:scale-95">
        <ShieldAlert className="size-4" /> SOS
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
              {status === 'locating' ? <Loader2 className="size-4 animate-spin" /> : <MapPin className={status === 'ok' ? 'size-4 text-cobrado' : 'size-4 text-tedebe'} />}
              {status === 'locating' && 'Buscando tu ubicación…'}
              {status === 'ok' && 'Ubicación lista.'}
              {status === 'fail' && 'Sin ubicación: se envía sin mapa' + (sos.trackingLink ? ', con tu enlace de rastreo.' : '.')}
            </p>
            <p className="text-xs text-gris">Se envía a <b className="text-hueso">{sos.name || sos.phone}</b> por {sos.channel === 'sms' ? 'SMS' : 'WhatsApp'}.</p>
            <Button as="a" href={link('start')} target="_blank" rel="noopener" icon={Play} className="w-full" disabled={status === 'locating'}>Estoy iniciando un viaje</Button>
            <Button as="a" href={link('route')} target="_blank" rel="noopener" icon={Navigation} variant="ghost" className="w-full" disabled={status === 'locating'}>En ruta</Button>
            <Button as="a" href={link('help')} target="_blank" rel="noopener" icon={Siren} variant="danger" className="w-full" disabled={status === 'locating'}>Necesito ayuda</Button>
            <Button as="a" href="tel:911" variant="outline" className="w-full">Llamar al 911</Button>
          </div>
        )}
      </Sheet>
    </>
  );
}
