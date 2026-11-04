// Contacto del conductor en vCard 3.0 (la leen iPhone y Android sin apps).
import { waNumber } from './format.js';

// Escapa los caracteres especiales de vCard.
const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

// Las líneas largas se doblan a 75 caracteres (la foto en base64 lo necesita).
const fold = (line) => line.match(/.{1,74}/g).join('\r\n ');

export function buildVCard({ name, phone, lada = '52', link, photo, city }) {
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
    'NOTE:Cotiza y pide tu viaje por WhatsApp.',
  ];
  // Foto: data URL JPEG → base64 embebido.
  const m = /^data:image\/(jpeg|png);base64,(.+)$/.exec(photo || '');
  if (m) lines.push(`PHOTO;ENCODING=b;TYPE=${m[1].toUpperCase()}:${m[2]}`);
  lines.push('END:VCARD');
  return lines.filter(Boolean).map(fold).join('\r\n');
}

/** Descarga el .vcf (el teléfono ofrece «Agregar a contactos»). */
export function downloadVCard(data) {
  const blob = new Blob([buildVCard(data)], { type: 'text/vcard;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${(data.name || 'conductor').replace(/[^\w\- ]+/g, '').trim() || 'conductor'}.vcf` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
