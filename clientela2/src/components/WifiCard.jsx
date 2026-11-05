// Wi-Fi a bordo: red, contraseña con «Copiar» y QR para conectarse con la cámara.
import { useState } from 'react';
import { Wifi, Copy, Check, QrCode as QrIcon, Eye, EyeOff } from 'lucide-react';
import { wifiQrText } from '../lib/wifi.js';
import { copyText } from '../lib/whatsapp.js';
import { Card, Button } from './ui.jsx';
import QrCode from './QrCode.jsx';

export default function WifiCard({ wifi, onToast, startWithQr = false }) {
  const [showQr, setShowQr] = useState(startWithQr);
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState(false); // alerta visual de copiado (2 s)
  if (!wifi?.ssid) return null;
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-cobrado/15 text-cobrado"><Wifi className="size-5" /></div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-gris">Wi-Fi a bordo</div>
          <div className="truncate font-semibold">{wifi.ssid}</div>
        </div>
      </div>
      {wifi.password && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-asfalto px-3 py-2">
          <span className="flex-1 truncate font-mono select-all">{showPass ? wifi.password : '•'.repeat(Math.min(12, wifi.password.length))}</span>
          <button type="button" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Ocultar contraseña' : 'Ver contraseña'} className="grid size-9 place-items-center text-gris">
            {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      )}
      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
        <Button
          className="whitespace-nowrap"
          variant={copied ? 'primary' : 'ghost'}
          icon={copied ? Check : Copy}
          disabled={!wifi.password}
          aria-live="polite"
          onClick={async () => {
            const ok = await copyText(wifi.password);
            onToast?.(ok ? 'Contraseña copiada ✓' : 'No se pudo copiar: mantén presionada la clave');
            if (ok) { setCopied(true); navigator.vibrate?.(20); setTimeout(() => setCopied(false), 2000); } else setShowPass(true);
          }}
        >
          {copied ? '¡Copiada!' : 'Copiar contraseña'}
        </Button>
        <Button variant="ghost" icon={QrIcon} className="whitespace-nowrap" aria-label={showQr ? 'Ocultar QR' : 'QR para conectarse'} onClick={() => setShowQr((v) => !v)}>QR</Button>
      </div>
      {showQr && (
        <div className="mt-3 flex flex-col items-center gap-2">
          <QrCode text={wifiQrText(wifi)} size={220} label={`QR para conectarse a ${wifi.ssid}`} />
          <p className="text-center text-xs text-gris">Abre la cámara y apunta al código para conectarte.</p>
        </div>
      )}
    </Card>
  );
}
