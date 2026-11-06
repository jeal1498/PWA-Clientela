// Mensajes de WhatsApp. Texto plano con *negritas* de WhatsApp, pensado para leerse en el celular.
import { money, kmText, minText, dateText, waNumber } from './format.js';

/** Enlace wa.me. Sin número abre WhatsApp para que el usuario elija el chat. */
export function waLink(phone, text, lada = '52') {
  const n = waNumber(phone, lada);
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

const place = (p) => (p ? p.label || p : '—');

/** Lo que el CLIENTE manda al conductor desde el cotizador público. */
export function clientRequestMessage({ service, from, to, now, date, time, passengers, bags, name, notes, q, hours }) {
  const hourly = service?.key === 'hourly';
  return [
    `¡Hola! Quiero solicitar ${hourly ? 'un servicio por horas' : 'un viaje'} 🚗`,
    service && !hourly ? `🏷️ *Servicio:* ${service.label}` : null,
    '',
    `📍 *${hourly ? 'Recogida' : 'Origen'}:* ${place(from)}`,
    hourly ? (to ? `🏁 *Destino final:* ${place(to)}` : null) : `🏁 *Destino:* ${place(to)}`,
    `📅 *Cuándo:* ${now ? 'Ahora (lo antes posible)' : dateText(date, time) || 'Lo antes posible'}`,
    `👥 *Pasajeros:* ${passengers || 1}  ·  🧳 *Maletas:* ${bags || 0}`,
    '',
    hourly ? `⏱️ ${hours} h de disposición` : `📏 ${kmText(q.km)} · ⏱️ ${minText(q.min)}${q.tolls ? ' · 🛣️ con caseta' : ''}`,
    `💰 *Tarifa estimada:* ${money(q.price)}`,
    notes ? `📝 ${notes}` : null,
    name ? `Soy *${name}*.` : null,
    '',
    '¿Me confirmas disponibilidad? Gracias.',
  ].filter((l) => l != null).join('\n');
}

/** Propuesta que el CONDUCTOR manda al cliente desde el cotizador manual. */
export function driverProposalMessage({ clientName, from, to, via = [], date, time, q, price, driverName, includeBreakdown = false }) {
  const lines = [
    `Hola${clientName ? ` ${clientName}` : ''} 👋, te comparto la cotización de tu viaje:`,
    '',
  ];
  if (from || to) {
    lines.push(`📍 ${place(from)}`);
    if (via.length) lines.push(`📌 Paradas: ${via.map(place).join(' → ')}`);
    lines.push(`🏁 ${place(to)}`);
  }
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

/** Recordatorio de cobro que el CONDUCTOR manda al cliente que le debe. */
export function debtReminderMessage({ clientName, trips, total, driverName }) {
  const lines = [`Hola${clientName ? ` ${clientName}` : ''} 👋, te recuerdo el pago pendiente de tus viajes:`, ''];
  for (const t of trips) lines.push(`• ${dateText(t.date)}${t.from || t.to ? ` · ${[t.from, t.to].filter(Boolean).join(' → ')}` : ''}: ${money(t.amount)}`);
  lines.push('', `💰 *Total pendiente: ${money(total)}*`, '', '¿Me confirmas cuándo puedes pagarlo? Gracias 🙏');
  if (driverName) lines.push(`— ${driverName}`);
  return lines.join('\n');
}

/** Recordatorio del viaje que el CONDUCTOR manda al cliente antes de la hora. `cuando`: «hoy», «mañana» o el día. */
export function tripReminderMessage({ clientName, cuando, time, from, to, amount, driverName }) {
  const lines = [`Hola${clientName ? ` ${clientName}` : ''} 👋, te recuerdo tu viaje de ${cuando} a las ${time}:`];
  if (from) lines.push(`📍 ${from}`);
  if (to) lines.push(`🏁 ${to}`);
  if (+amount > 0) lines.push(`💰 ${money(amount)}`);
  lines.push('', 'Avísame si algo cambia. ¡Nos vemos!');
  if (driverName) lines.push(`— ${driverName}`);
  return lines.join('\n');
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
