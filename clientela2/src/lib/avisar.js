// «Agendar y avisar»: abre WhatsApp con el recordatorio del viaje recién agendado.
import { tripReminderMessage, waLink } from './whatsapp.js';
import { cuandoDe } from './recordar.js';
import { dayLong, today } from './dates.js';

export function avisarPorWhatsApp(t, config) {
  const msg = tripReminderMessage({ clientName: t.clientName, cuando: cuandoDe(t.date, today()) || dayLong(t.date), time: t.time, from: t.from, to: t.to, amount: t.amount, driverName: config.driver.name });
  window.open(waLink(t.clientPhone || '', msg, config.driver.lada), '_blank', 'noopener');
}
