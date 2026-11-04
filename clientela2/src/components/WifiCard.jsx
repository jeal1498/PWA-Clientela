// Wi-Fi a bordo: red, contraseña con «Copiar» y QR para conectarse con la cámara.
import { useState } from 'react';
import { Wifi, Copy, QrCode as QrIcon, Eye, EyeOff } from 'lucide-react';
import { wifiQrText } from '../lib/wifi.js';
import { copyText } from '../lib/whatsapp.js';
import { Card, Button } from './ui.jsx';
import QrCode from './QrCode.jsx';

export default function WifiCard({ wifi, onToast, startWithQr = false }) {
  const [showQr, setShowQr] = useState(startWithQr);
  const [showPass, setShowPass] = useState(false);
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
          <span className="flex-1 truncate font-mono">{showPass ? wifi.password : '•'.repeat(Math.min(12, wifi.password.length))}</span>
          <button type="button" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Ocultar contraseña' : 'Ver contraseña'} className="grid size-9 place-items-center text-gris">
            {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button variant="ghost" icon={Copy} disabled={!wifi.password} onClick={async () => onToast?.((await copyText(wifi.password)) ? 'Contraseña copiada' : 'No se pudo copiar')}>Copiar clave</Button>
        <Button variant="ghost" icon={QrIcon} onClick={() => setShowQr((v) => !v)}>{showQr ? 'Ocultar QR' : 'QR rápido'}</Button>
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
