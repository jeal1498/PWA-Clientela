// «Mi página» (/app/pagina): todo lo que ve el pasajero en la página pública + el QR para el vehículo.
// Se guarda al instante. Tras cambiar algo, el enlace y el QR se generan de nuevo con los datos actuales.
import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Car, Activity, Briefcase, Sofa, Wallet, ScrollText, AtSign, QrCode as QrIcon, Download, ExternalLink, Copy } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { publicLink } from '../lib/share.js';
import { currentStatus, scheduleText } from '../lib/status.js';
import { copyText } from '../lib/whatsapp.js';
import { Card, CardTitle, Field, TextInput, NumberInput, Segmented, Button, cx } from '../components/ui.jsx';
import QrCode from '../components/QrCode.jsx';
import { SERVICES } from '../components/public/services.js';
import { AMENITIES } from '../components/public/AmenitiesSection.jsx';
import { useToast } from '../components/Toast.jsx';

const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const PAYS = [['efectivo', 'Efectivo'], ['spei', 'SPEI'], ['tarjeta', 'Tarjeta']];

/** Interruptor tipo chip (encendido verde). */
function Chip({ on, onClick, children }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={cx('flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border px-3 text-sm transition', on ? 'border-cobrado/50 bg-cobrado/15 text-cobrado' : 'border-white/10 text-gris')}>
      {children}
    </button>
  );
}

export default function PageSettings() {
  const { config, setSection } = useStore();
  const { vehicle, page } = config;
  const [toast, showToast] = useToast();
  const qrBox = useRef(null);
  const setPage = (patch) => setSection('page', patch);
  const toggle = (group, key) => setPage({ [group]: { ...page[group], [key]: !page[group][key] } });

  const link = publicLink(config);
  const qrLink = useMemo(() => publicLink(config, { withPhoto: false }), [config]);
  const status = currentStatus(page);

  // Descarga el QR como SVG (se imprime nítido a cualquier tamaño).
  function downloadQr() {
    const svg = qrBox.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${svg.outerHTML.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')}`], { type: 'image/svg+xml' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'qr-mi-pagina.svg' });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-titulo text-2xl">Mi página</h1>
        <Link to="/" className="flex items-center gap-1 text-sm text-cobrado"><ExternalLink className="size-4" /> Ver</Link>
      </div>
      <p className="-mt-2 text-sm text-gris">Lo que ve tu pasajero al escanear el QR o entrar a tu Linktree. Nombre, foto y WhatsApp están en <Link to="/app/settings" className="text-cobrado underline">Ajustes</Link>.</p>

      <Card>
        <CardTitle icon={Car}>Vehículo</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Modelo"><TextInput value={vehicle.model} onChange={(e) => setSection('vehicle', { model: e.target.value })} placeholder="Nissan Versa 2022" /></Field>
          <Field label="Color"><TextInput value={vehicle.color} onChange={(e) => setSection('vehicle', { color: e.target.value })} placeholder="Gris plata" /></Field>
          <Field label="Placas"><TextInput value={vehicle.plates} onChange={(e) => setSection('vehicle', { plates: e.target.value.toUpperCase() })} placeholder="ABC-123-D" autoCapitalize="characters" /></Field>
        </div>
      </Card>

      <Card>
        <CardTitle icon={Activity}>Estado</CardTitle>
        <Segmented value={page.statusMode} onChange={(statusMode) => setPage({ statusMode })} options={[
          { value: 'auto', label: 'Auto' }, { value: 'available', label: '🟢' }, { value: 'reservations', label: '🟡' }, { value: 'off', label: '⚪' },
        ]} />
        <p className="mt-2 text-sm">Ahora se ve: <b>{status.label}</b></p>
        <p className="mt-1 text-xs text-gris">«Auto» cambia solo con tu horario (🟢 dentro, 🟡 fuera), sin volver a compartir el enlace. Los otros fijan el estado: para cambiarlo, comparte el enlace nuevo; el QR impreso se queda con el que tenía.</p>
        <div className="mt-3 grid grid-cols-7 gap-1">
          {DAYS.map((d, i) => (
            <button key={i} type="button" aria-pressed={page.days.includes(i)} aria-label={['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][i]}
              onClick={() => setPage({ days: page.days.includes(i) ? page.days.filter((x) => x !== i) : [...page.days, i] })}
              className={cx('h-10 rounded-xl text-sm', page.days.includes(i) ? 'bg-cobrado/15 text-cobrado' : 'bg-asfalto text-gris')}>{d}</button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Field label="Desde"><TextInput type="time" value={page.from} onChange={(e) => setPage({ from: e.target.value })} /></Field>
          <Field label="Hasta"><TextInput type="time" value={page.to} onChange={(e) => setPage({ to: e.target.value })} /></Field>
        </div>
        <p className="mt-1 text-xs text-gris">{scheduleText(page) || 'Elige al menos un día.'}</p>
      </Card>

      <Card>
        <CardTitle icon={Briefcase}>Servicios y cobertura</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          {SERVICES.map((s) => <Chip key={s.key} on={page.services[s.key]} onClick={() => toggle('services', s.key)}><span aria-hidden>{s.emoji}</span>{s.short}</Chip>)}
        </div>
        {page.services.hourly && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Field label="Tarifa por hora"><NumberInput prefix="$" suffix="/ h" value={page.hourlyRate} onChange={(hourlyRate) => setPage({ hourlyRate })} /></Field>
            <Field label="Mínimo de horas"><NumberInput suffix="h" step="1" value={page.minHours} onChange={(minHours) => setPage({ minHours })} /></Field>
          </div>
        )}
        <div className="mt-3"><Field label="Zonas de cobertura" hint="Separadas por comas."><TextInput value={page.zones} onChange={(e) => setPage({ zones: e.target.value })} placeholder="Cancún, Playa del Carmen, Tulum" /></Field></div>
      </Card>

      <Card>
        <CardTitle icon={Sofa}>Amenidades a bordo</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES.map(({ key, icon: Icon, label }) => <Chip key={key} on={page.amenities[key]} onClick={() => toggle('amenities', key)}><Icon className="size-4" />{label}</Chip>)}
        </div>
        <p className="mt-2 text-xs text-gris">El Wi-Fi se configura en <Link to="/app/settings#wifi" className="text-cobrado underline">Ajustes → Wi-Fi</Link>.</p>
      </Card>

      <Card>
        <CardTitle icon={Wallet}>Pagos aceptados</CardTitle>
        <div className="grid grid-cols-3 gap-2">
          {PAYS.map(([k, l]) => <Chip key={k} on={page.payments[k]} onClick={() => toggle('payments', k)}>{l}</Chip>)}
        </div>
      </Card>

      <Card>
        <CardTitle icon={ScrollText}>Políticas</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Validez de cotización"><NumberInput suffix="h" step="1" value={page.validityHours} onChange={(validityHours) => setPage({ validityHours })} /></Field>
          <Field label="Tolerancia de espera"><NumberInput suffix="min" step="1" value={page.waitMin} onChange={(waitMin) => setPage({ waitMin })} /></Field>
        </div>
        <div className="mt-2"><Field label="Reglas de reserva"><TextInput value={page.bookingNote} onChange={(e) => setPage({ bookingNote: e.target.value })} /></Field></div>
      </Card>

      <Card>
        <CardTitle icon={AtSign}>Redes</CardTitle>
        <div className="space-y-2">
          {[['tiktok', 'TikTok'], ['instagram', 'Instagram'], ['facebook', 'Facebook']].map(([k, l]) => (
            <Field key={k} label={l}><TextInput value={page.social[k]} onChange={(e) => setPage({ social: { ...page.social, [k]: e.target.value } })} placeholder="@usuario o enlace" autoCapitalize="none" /></Field>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle icon={QrIcon}>QR para tu vehículo</CardTitle>
        <div ref={qrBox} className="flex justify-center"><QrCode text={qrLink} size={240} label="QR de tu página" /></div>
        <p className="mt-2 text-center text-xs text-gris">Sin foto para que se lea fácil ({qrLink.length} caracteres). Imprímelo de al menos 4 × 4 cm.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="ghost" icon={Download} onClick={downloadQr}>Descargar QR</Button>
          <Button variant="ghost" icon={Copy} onClick={async () => showToast((await copyText(link)) ? 'Enlace copiado' : 'No se pudo copiar')}>Copiar enlace</Button>
        </div>
        <p className="mt-2 text-xs text-gris/70">Si cambias datos de la página, vuelve a imprimir el QR y a copiar el enlace (el estado «Auto» no lo necesita).</p>
      </Card>
      {toast}
    </>
  );
}
