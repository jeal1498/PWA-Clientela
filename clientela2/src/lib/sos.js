// Seguridad: aviso con ubicación a un contacto de emergencia por WhatsApp o SMS.
import { waNumber } from './format.js';

export const SOS_MESSAGES = {
  start: 'Estoy iniciando un viaje',
  route: 'En ruta',
  help: '🚨 Necesito ayuda',
};

export function sosText(kind, loc, trackingLink) {
  const where = loc ? `https://maps.google.com/?q=${loc.lat.toFixed(6)},${loc.lon.toFixed(6)}` : 'ubicación no disponible';
  const at = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  return [`${SOS_MESSAGES[kind]} en ${where}`, `🕒 ${at}`, trackingLink && `📡 Rastreo en vivo: ${trackingLink}`].filter(Boolean).join('\n');
}

/** Enlace listo para abrir: wa.me o sms: (el «?&body=» funciona en iPhone y Android). */
export function sosLink({ phone, lada = '52', channel = 'whatsapp' }, text) {
  const n = waNumber(phone, lada);
  return channel === 'sms' ? `sms:+${n}?&body=${encodeURIComponent(text)}` : `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
