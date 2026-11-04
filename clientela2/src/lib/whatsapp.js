// Mensajes de WhatsApp. Texto plano con *negritas* de WhatsApp, pensado para leerse en el celular.
import { money, kmText, minText, dateText, waNumber } from './format.js';

/** Enlace wa.me. Sin número abre WhatsApp para que el usuario elija el chat. */
export function waLink(phone, text, lada = '52') {
  const n = waNumber(phone, lada);
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

const place = (p) => (p ? p.label || p : '—');

/** Lo que el CLIENTE manda al conductor desde el cotizador público. */
export function clientRequestMessage({ from, to, date, time, passengers, bags, name, notes, q }) {
  return [
    '¡Hola! Quiero solicitar un viaje 🚗',
    '',
    `📍 *Origen:* ${place(from)}`,
    `🏁 *Destino:* ${place(to)}`,
    `📅 *Fecha:* ${dateText(date, time) || 'Lo antes posible'}`,
    `👥 *Pasajeros:* ${passengers || 1}  ·  🧳 *Maletas:* ${bags || 0}`,
    '',
    `📏 ${kmText(q.km)} · ⏱️ ${minText(q.min)}${q.tolls ? ' · 🛣️ con caseta' : ''}`,
    `💰 *Tarifa estimada:* ${money(q.price)}`,
    notes ? `📝 ${notes}` : null,
    name ? `Soy *${name}*.` : null,
    '',
    '¿Me confirmas disponibilidad? Gracias.',
  ].filter((l) => l != null).join('\n');
}

/** Propuesta que el CONDUCTOR manda al cliente desde el cotizador manual. */
export function driverProposalMessage({ clientName, from, to, date, time, q, price, driverName, includeBreakdown = false }) {
  const lines = [
    `Hola${clientName ? ` ${clientName}` : ''} 👋, te comparto la cotización de tu viaje:`,
    '',
  ];
  if (from || to) lines.push(`📍 ${place(from)}`, `🏁 ${place(to)}`);
  if (date || time) lines.push(`📅 ${dateText(date, time)}`);
  if (q.km) lines.push(`📏 ${kmText(q.km)} · ⏱️ aprox. ${minText(q.min)}`);
  if (includeBreakdown) {
    lines.push('');
    for (const l of q.lines) lines.push(`• ${l.label}: ${money(l.amount)}`);
  }
  lines.push('', `💰 *Total: ${money(price)}*`, q.tolls ? '(Incluye casetas)' : '', '', '¿Te lo agendo? ✅');
  if (driverName) lines.push(`— ${driverName}`);
  return lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
}

/** Copia al portapapeles con respaldo para navegadores viejos. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
