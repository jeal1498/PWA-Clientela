// «Mi página» (/app/pagina): panel de administración de la página pública (landing / QR del vehículo).
//
// Cómo se guarda:
//  · Cada cambio se guarda al instante en el estado global y en localStorage, y se ve en la vista pública
//    (también en otra pestaña abierta, gracias al evento `storage` de AppStore).
//  · «Guardar cambios» confirma y marca tu enlace actual como publicado; si después cambias algo, el panel
//    avisa que tu enlace/QR ya no está al día (los pasajeros leen los datos del enlace, no de tu teléfono).
//  · «Restablecer» vuelve la página a valores predeterminados (conserva nombre, foto, WhatsApp y Wi-Fi).
import { sym } from '../lib/moneda.js';
import { useMemo, useRef, useState } from 'react';
import EstadoAhora from '../components/EstadoAhora.jsx';
import { PublicLinkCard } from '../components/PanelBlocks.jsx';
import { Link } from 'react-router-dom';
import {
  IdCard, Car, Activity, Wifi, Sofa, AtSign, Wallet, ScrollText, Briefcase, QrCode as QrIcon,
  Camera, Trash2, Link2, ShieldCheck, Download, ExternalLink, Copy, Check, RotateCcw, Save, CircleAlert, CircleCheck,
} from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { publicLink, encodeConfig } from '../lib/share.js';
import { currentStatus, scheduleText } from '../lib/status.js';
import { copyText } from '../lib/whatsapp.js';
import { resizePhoto } from '../lib/image.js';
import { Card, CardTitle, Field, TextInput, TextArea, NumberInput, Segmented, Button, cx } from '../components/ui.jsx';
import QrCode from '../components/QrCode.jsx';
import { SERVICES } from '../components/public/services.js';
import { AMENITIES } from '../components/public/AmenitiesSection.jsx';
import { useToast } from '../components/Toast.jsx';
import WifiCard from '../components/WifiCard.jsx';

const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const PAYS = [['efectivo', 'Efectivo'], ['spei', 'Transferencia SPEI'], ['tarjeta', 'Tarjeta']];
const STATUS_OPTIONS = [
  ['auto', '⏱️ Automático según mi horario'],
  ['available', '🟢 Disponible para viajes'],
  ['reservations', '🟡 En servicio / Reservas abiertas'],
  ['off', '🔴 Fuera de servicio'],
];

/** Fila con casilla: más fácil de tocar que una casilla sola. */
function Check2({ checked, onChange, children, sub }) {
  return (
    <label className={cx('flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2 transition', checked ? 'border-cobrado/40 bg-cobrado/10' : 'border-hueso/10')}>
      <input type="checkbox" className="size-5 shrink-0 accent-[#22C55E]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="min-w-0 text-sm leading-tight">{children}{sub && <span className="block text-xs text-gris">{sub}</span>}</span>
    </label>
  );
}

export default function PageSettings() {
  const { config, setSection, resetPublic, markPublished, published } = useStore();
  const { driver, vehicle, page, wifi } = config;
  const [toast, showToast] = useToast('bottom-40');
  const [savedFx, setSavedFx] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(/^https?:/.test(driver.photo) ? driver.photo : '');
  const [photoBroken, setPhotoBroken] = useState(false);
  const qrBox = useRef(null);

  const setPage = (patch) => setSection('page', patch);
  const setGroup = (group, key, on) => setPage({ [group]: { ...page[group], [key]: on } });
  const text = (section, key, transform = (v) => v) => ({ value: config[section][key] ?? '', onChange: (e) => setSection(section, { [key]: transform(e.target.value) }) });

  const code = useMemo(() => encodeConfig(config), [config]);
  const link = useMemo(() => publicLink(config), [config]);
  const qrLink = useMemo(() => publicLink(config, { withPhoto: false }), [config]);
  const upToDate = published?.code === code;
  const status = currentStatus(page);

  function save() {
    markPublished(code);
    setSavedFx(true);
    navigator.vibrate?.(20);
    showToast('Cambios guardados ✓');
    setTimeout(() => setSavedFx(false), 2500);
  }

  function reset() {
    if (!confirm('¿Restablecer la página a los valores predeterminados?\n\nSe borran vehículo, estado, horario, servicios, amenidades, pagos, políticas y redes. Se conservan tu nombre, foto, WhatsApp y Wi-Fi.')) return;
    resetPublic();
    showToast('Página restablecida');
  }

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
        <Button variant="ghost" icon={ExternalLink} className="h-11 text-sm" onClick={() => window.open('#/?vista=1', '_blank')}>Vista previa</Button>
      </div>

      <EstadoAhora />

      {!config.driver.phone && (
        <div className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-humo bg-tablero p-3 text-sm" role="status"><CircleAlert className="size-4 shrink-0" aria-hidden />Agrega tu WhatsApp para que los clientes te escriban.</div>
      )}

      <PublicLinkCard />

      {/* Estado del enlace: los pasajeros ven lo que trae el enlace, no lo que hay en tu teléfono. */}
      <div className={cx('flex items-start gap-2 rounded-2xl border p-3 text-sm', 'border-humo bg-tablero text-hueso')} role="status">
        {upToDate ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-ok" /> : <CircleAlert className="mt-0.5 size-4 shrink-0" />}
        <div className="flex-1">
          {upToDate ? 'Tu enlace y tu QR están al día.' : published ? 'Hay cambios: toca «Guardar cambios» y vuelve a compartir tu enlace (y a imprimir el QR).' : 'Cada cambio ya se ve en tu vista previa. Al terminar, toca «Guardar cambios» y comparte tu enlace.'}
          {upToDate && <button type="button" onClick={async () => showToast((await copyText(link)) ? 'Enlace copiado' : 'No se pudo copiar')} className="mt-1 flex items-center gap-1 text-xs underline"><Copy className="size-3.5" /> Copiar enlace</button>}
        </div>
      </div>

      {/* ── 1 · Identidad y vehículo ───────────────────────────── */}
      <Card>
        <CardTitle icon={IdCard}>Identidad</CardTitle>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {driver.photo && !photoBroken
              ? <img src={driver.photo} alt="Tu foto" className="size-16 rounded-full object-cover" onError={() => setPhotoBroken(true)} />
              : <div className="grid size-16 place-items-center rounded-full bg-asfalto text-gris"><Camera className="size-6" /></div>}
            <label className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-hueso/5 px-4 text-sm">
              <Camera className="size-4" /> {driver.photo ? 'Cambiar foto' : 'Subir foto'}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) { setSection('driver', { photo: await resizePhoto(f) }); setPhotoUrl(''); setPhotoBroken(false); }
                e.target.value = '';
              }} />
            </label>
            {driver.photo && <button type="button" aria-label="Quitar foto" onClick={() => { setSection('driver', { photo: '' }); setPhotoUrl(''); }} className="grid size-11 place-items-center rounded-2xl bg-hueso/5"><Trash2 className="size-4 text-malo" /></button>}
          </div>
          <Field label="…o pega la URL de tu foto" hint={photoBroken ? 'No se pudo cargar esa imagen; revisa la URL.' : 'Debe empezar con https://. Ocupa menos que subir el archivo y también sale en el QR.'}>
            <div className="relative">
              <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gris" />
              <TextInput className="pl-9" type="url" inputMode="url" value={photoUrl} placeholder="https://…/mi-foto.jpg"
                onChange={(e) => { setPhotoUrl(e.target.value); setPhotoBroken(false); if (/^https:\/\/\S+$/.test(e.target.value.trim())) setSection('driver', { photo: e.target.value.trim() }); }} />
            </div>
          </Field>
          <Field label="Nombre del conductor"><TextInput {...text('driver', 'name')} placeholder="Eduardo «Lalo»" autoComplete="name" /></Field>
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <Field label="Lada"><TextInput inputMode="numeric" {...text('driver', 'lada', (v) => v.replace(/\D/g, ''))} /></Field>
            <Field label="WhatsApp de atención"><TextInput type="tel" inputMode="tel" {...text('driver', 'phone')} placeholder="998 123 4567" /></Field>
          </div>
          <Field label="Ciudad base" hint="Sale bajo tu nombre y ayuda a encontrar direcciones."><TextInput {...text('driver', 'city')} placeholder="Cancún" /></Field>
        </div>
      </Card>

      {/* ── Confianza: todo opcional; lo que no llenes no se muestra ───────── */}
      <Card>
        <CardTitle icon={ShieldCheck}>Confianza</CardTitle>
        <p className="mb-3 text-sm text-gris">Datos reales que ayudan a un pasajero nuevo a decidir. Todo es opcional.</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Años de servicio"><TextInput inputMode="numeric" value={page.trust.years} onChange={(e) => setPage({ trust: { ...page.trust, years: e.target.value.replace(/\D/g, '') } })} placeholder="6" /></Field>
            <Field label="Viajes hechos"><TextInput inputMode="numeric" value={page.trust.trips} onChange={(e) => setPage({ trust: { ...page.trust, trips: e.target.value.replace(/\D/g, '') } })} placeholder="1240" /></Field>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[#22C55E]" checked={!!page.trust.insured} onChange={(e) => setPage({ trust: { ...page.trust, insured: e.target.checked } })} /> Tengo seguro de pasajeros vigente</label>
          <Field label="Una reseña corta" hint="Solo si el cliente te dio permiso de compartirla."><TextInput value={page.trust.quote} onChange={(e) => setPage({ trust: { ...page.trust, quote: e.target.value } })} placeholder="Puntual y muy amable." maxLength={140} /></Field>
          <Field label="¿Quién la dijo?"><TextInput value={page.trust.quoteBy} onChange={(e) => setPage({ trust: { ...page.trust, quoteBy: e.target.value } })} placeholder="Sra. Martínez · hace 2 semanas" maxLength={60} /></Field>
        </div>
      </Card>


      <Card>
        <CardTitle icon={Car}>Vehículo</CardTitle>
        <div className="space-y-2">
          <Field label="Modelo"><TextInput {...text('vehicle', 'model')} placeholder="Chevrolet Cavalier 2020 LS" /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Color"><TextInput {...text('vehicle', 'color')} placeholder="Blanco" /></Field>
            <Field label="Placas"><TextInput {...text('vehicle', 'plates', (v) => v.toUpperCase())} placeholder="ABC-123-D" autoCapitalize="characters" /></Field>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle icon={Activity}>Estado actual</CardTitle>
        <select value={page.statusMode} onChange={(e) => setPage({ statusMode: e.target.value })} aria-label="Estado actual"
          className="h-12 w-full rounded-2xl border border-hueso/10 bg-asfalto px-3 text-hueso outline-none focus:border-cobrado/70">
          {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <p className="mt-2 text-sm">Ahora se ve: <b>{status.label}</b></p>
        {page.statusMode === 'auto' ? (
          <>
            <p className="mt-1 text-xs text-gris">🟢 dentro de tu horario, 🟡 fuera. Cambia solo, sin volver a compartir el enlace.</p>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {DAYS.map((d, i) => (
                <button key={i} type="button" aria-pressed={page.days.includes(i)} aria-label={DAY_NAMES[i]}
                  onClick={() => setPage({ days: page.days.includes(i) ? page.days.filter((x) => x !== i) : [...page.days, i] })}
                  className={cx('h-11 rounded-xl text-sm', page.days.includes(i) ? 'bg-cobrado/15 text-ok' : 'bg-asfalto text-gris')}>{d}</button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Field label="Desde"><TextInput type="time" value={page.from} onChange={(e) => setPage({ from: e.target.value })} /></Field>
              <Field label="Hasta"><TextInput type="time" value={page.to} onChange={(e) => setPage({ to: e.target.value })} /></Field>
            </div>
            <p className="mt-1 text-xs text-gris">{scheduleText(page) || 'Elige al menos un día.'}</p>
          </>
        ) : (
          <p className="mt-1 text-xs text-gris">Estado fijo: viaja dentro del enlace. Para cambiarlo después, guarda y comparte el enlace nuevo; un QR ya impreso conserva el estado con el que se imprimió. Para el QR del auto conviene «Automático».</p>
        )}
      </Card>

      {/* ── 2 · Wi-Fi y amenidades ─────────────────────────────── */}
      <Card id="wifi" className="scroll-mt-20">
        <CardTitle icon={Wifi}>Wi-Fi a bordo</CardTitle>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Nombre de la red (SSID)"><TextInput {...text('wifi', 'ssid')} placeholder="AutoLalo" autoComplete="off" autoCapitalize="none" /></Field>
            <Field label="Contraseña"><TextInput {...text('wifi', 'password')} placeholder="Sin contraseña" autoComplete="off" autoCapitalize="none" /></Field>
          </div>
          <Segmented value={wifi.security} onChange={(security) => setSection('wifi', { security })} options={[{ value: 'WPA', label: 'WPA/WPA2' }, { value: 'WEP', label: 'WEP' }]} />
          <Check2 checked={wifi.showPublic} onChange={(showPublic) => setSection('wifi', { showPublic })} sub="Quien tenga tu enlace verá la contraseña. Apagado, la enseñas desde aquí mismo con el QR.">
            Mostrar el Wi-Fi en mi página
          </Check2>
          {wifi.ssid && <WifiCard wifi={wifi} onToast={showToast} startWithQr />}
        </div>
      </Card>

      <Card>
        <CardTitle icon={Sofa}>Amenidades</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES.map(({ key, label, sub }) => (
            <Check2 key={key} checked={!!page.amenities[key]} onChange={(on) => setGroup('amenities', key, on)} sub={sub}>{label}</Check2>
          ))}
        </div>
      </Card>

      {/* ── 3 · Redes y pagos ──────────────────────────────────── */}
      <Card>
        <CardTitle icon={AtSign}>Redes sociales</CardTitle>
        <div className="space-y-2">
          {[['tiktok', 'TikTok', '@checa.driver'], ['instagram', 'Instagram', '@usuario'], ['facebook', 'Facebook', 'usuario o enlace']].map(([k, l, ph]) => (
            <Field key={k} label={l}>
              <TextInput value={page.social[k]} onChange={(e) => setGroup('social', k, e.target.value)} placeholder={ph} autoCapitalize="none" autoComplete="off" />
            </Field>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle icon={Wallet}>Métodos de pago</CardTitle>
        <div className="space-y-2">
          {PAYS.map(([k, l]) => <Check2 key={k} checked={!!page.payments[k]} onChange={(on) => setGroup('payments', k, on)}>{l}</Check2>)}
        </div>
      </Card>

      {/* ── 4 · Políticas y textos ─────────────────────────────── */}
      <Card>
        <CardTitle icon={ScrollText}>Políticas</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Tolerancia de espera"><NumberInput suffix="min" step="1" value={page.waitMin} onChange={(waitMin) => setPage({ waitMin })} /></Field>
          <Field label="Validez de cotización"><NumberInput suffix="h" step="1" value={page.validityHours} onChange={(validityHours) => setPage({ validityHours })} /></Field>
        </div>
        <div className="mt-2">
          <Field label="Reglas de reserva" hint={`${page.bookingNote.length}/240`}>
            <TextArea value={page.bookingNote} maxLength={240} onChange={(e) => setPage({ bookingNote: e.target.value })} placeholder="Reserva con 2 h de anticipación. Cancela sin costo hasta 1 h antes." />
          </Field>
        </div>
        <p className="mt-2 text-xs text-gris">Pon 0 en espera o validez para ocultar esa política.</p>
      </Card>

      {/* ── Extra · Servicios y cobertura ──────────────────────── */}
      <Card>
        <CardTitle icon={Briefcase}>Servicios y cobertura</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          {SERVICES.map((s) => <Check2 key={s.key} checked={!!page.services[s.key]} onChange={(on) => setGroup('services', s.key, on)}><span aria-hidden>{s.emoji}</span> {s.short}</Check2>)}
        </div>
        {page.services.hourly && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Field label="Tarifa por hora"><NumberInput prefix={sym()} suffix="/ h" value={page.hourlyRate} onChange={(hourlyRate) => setPage({ hourlyRate })} /></Field>
            <Field label="Mínimo de horas"><NumberInput suffix="h" step="1" value={page.minHours} onChange={(minHours) => setPage({ minHours })} /></Field>
          </div>
        )}
        <div className="mt-3"><Field label="Zonas de cobertura" hint="Separadas por comas."><TextInput value={page.zones} onChange={(e) => setPage({ zones: e.target.value })} placeholder="Cancún, Playa del Carmen, Tulum" /></Field></div>
      </Card>

      <Card>
        <CardTitle icon={QrIcon}>QR para tu vehículo</CardTitle>
        <div ref={qrBox} className="flex justify-center"><QrCode text={qrLink} size={240} label="QR de tu página" /></div>
        <p className="mt-2 text-center text-xs text-gris">{qrLink.length} caracteres{String(driver.photo).startsWith('data:') ? ' · sin foto para que se lea fácil (con foto por URL sí sale)' : ''}. Imprímelo de al menos 4 × 4 cm.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="ghost" icon={Download} onClick={downloadQr}>Descargar QR</Button>
          <Button variant="ghost" icon={Copy} onClick={async () => showToast((await copyText(link)) ? 'Enlace copiado' : 'No se pudo copiar')}>Copiar enlace</Button>
        </div>
      </Card>

      <p className="text-center text-xs text-gris">Tarifas y costos: <Link to="/app/settings" className="text-ok underline">Ajustes</Link>.</p>
      <div className="h-16" aria-hidden />

      {/* Barra de acciones: siempre a la mano, encima de la navegación */}
      <div className="fixed inset-x-0 z-20 border-t border-hueso/5 bg-asfalto/95 px-4 py-2 backdrop-blur" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <div className="mx-auto grid max-w-lg grid-cols-[auto_1fr] gap-2">
          <Button variant="ghost" icon={RotateCcw} className="h-11 px-3 text-sm" onClick={reset}>Restablecer</Button>
          <Button icon={savedFx ? Check : Save} className={cx('h-11', savedFx && 'bg-hueso text-asfalto')} onClick={save}>
            {savedFx ? '¡Guardado!' : upToDate ? 'Guardado' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
      {toast}
    </>
  );
}
