// Contacto del conductor en vCard 3.0 (la leen iPhone y Android sin apps).
import { waNumber } from './format.js';

// Escapa los caracteres especiales de vCard.
const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

// Las líneas largas se doblan a 75 caracteres (la foto en base64 lo necesita).
const fold = (line) => line.match(/.{1,74}/g).join('\r\n ');

export function buildVCard({ name, phone, lada = '52', link, photo, city, vehicle }) {
  const car = vehicle && [vehicle.model, vehicle.color, vehicle.plates && `placas ${vehicle.plates}`].filter(Boolean).join(' · ');
  const tel = waNumber(phone, lada);
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${esc(name || 'Mi conductor')}`,
    `N:${esc(name || 'Mi conductor')};;;;`,
    'ORG:Transporte privado',
    tel && `TEL;TYPE=CELL,VOICE:+${tel}`,
    tel && `URL;TYPE=WhatsApp:https://wa.me/${tel}`,
    link && `URL;TYPE=Cotizador:${link}`,
    city && `ADR;TYPE=WORK:;;;${esc(city)};;;`,
    `NOTE:${esc(['Cotiza y pide tu viaje por WhatsApp.', car && `Vehículo: ${car}.`].filter(Boolean).join(' '))}`,
  ];
  // Foto: data URL JPEG → base64 embebido.
  const m = /^data:image\/(jpeg|png);base64,(.+)$/.exec(photo || '');
  if (m) lines.push(`PHOTO;ENCODING=b;TYPE=${m[1].toUpperCase()}:${m[2]}`);
  lines.push('END:VCARD');
  return lines.filter(Boolean).map(fold).join('\r\n');
}

// --- Guardar en el teléfono ---
// Navegadores internos de redes (Instagram, Facebook, TikTok…) suelen bloquear descargas: hay que avisar.
const IN_APP = /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Bytedance|Snapchat|LinkedInApp|Line\//i;
export const isInAppBrowser = (ua = navigator.userAgent) => IN_APP.test(ua);
export const isIOS = (ua = navigator.userAgent, touch = navigator.maxTouchPoints) => /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touch > 1);

/**
 * Abre el contacto para guardarlo. Devuelve cómo se hizo:
 *  · 'ios'      → iPhone/iPad: se abre la vista de contacto de Safari («Crear contacto nuevo»).
 *  · 'download' → Android/computadora: se descarga el .vcf (al abrirlo, «Agregar a contactos»).
 *  · 'inapp'    → navegador interno: se intenta igual, pero conviene abrir en Safari/Chrome.
 */
export function saveVCard(data) {
  const blob = new Blob([buildVCard(data)], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const inApp = isInAppBrowser();
  if (isIOS() && !inApp) {
    // Safari muestra el .vcf como tarjeta de contacto al abrirlo (con «download» solo lo guardaría en Archivos).
    location.href = url;
  } else {
    const name = `${(data.name || 'conductor').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\- ]+/g, '').trim() || 'conductor'}.vcf`;
    const a = Object.assign(document.createElement('a'), { href: url, download: name, rel: 'noopener' });
    document.body.append(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return inApp ? 'inapp' : isIOS() ? 'ios' : 'download';
}

/** Compatibilidad con la fase 2. */
export const downloadVCard = saveVCard;
