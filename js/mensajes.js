// Mensajes y enlaces de contacto de Cartera.
// La lógica se mantiene aislada del DOM y recibe las funciones de formato desde la aplicación.
export function createMessaging({ getSettings, firstName, dayLabel, hour12, money, fdate, cap, byWhen }) {
  const phoneIntl = (p) => {
    const d = String(p || '').replace(/\D/g, '');
    const settings = getSettings();
    return d.length === 10 ? (settings.lada || '52') + d : d;
  };
  const waLink = (c, text) => `https://wa.me/${phoneIntl(c.phone)}?text=${encodeURIComponent(text)}`;
  const payTo = () => {
    const s = getSettings();
    return (s.pays || []).includes('Transferencia') && s.clabe ? [s.bank, s.clabe].filter(Boolean).join(' ') : '';
  };
  const sign = () => {
    const settings = getSettings();
    return settings.driver ? `\n— ${settings.driver}` : '';
  };
  // Un lugar con nombre («Casa») se manda con su dirección real.
  const at = (text, pt) => (pt && pt.addr) || text;
  const MSG = {
    confirm: (c, t) => `Hola ${firstName(c)}, te confirmo tu viaje ${dayLabel(t.date)}${t.time ? ' a las ' + hour12(t.time) : ''}${t.from || t.to ? `: ${[at(t.from, t.fromPt) || '…', ...(t.stops || []).map((s) => s.addr || s.label), at(t.to, t.toPt) || '…'].join(' → ')}` : ''}. Costo ${money(t.price)}. ¡Gracias!${sign()}`,
    // Cotización sin agendar: c puede faltar (se elige el contacto en WhatsApp).
    quote: (c, t) => {
      const short = (l) => (l || '…').split(',')[0];
      const via = (t.stops || []).map((s) => short(s.addr || s.label));
      return `Hola${c ? ' ' + firstName(c) : ''}, el viaje${t.from || t.to ? ` de ${short(at(t.from, t.fromPt))} a ${short(at(t.to, t.toPt))}${via.length ? ` con ${via.length === 1 ? 'una parada' : via.length + ' paradas'} (${via.join(', ')})` : ''}` : ''} ${t.date ? dayLabel(t.date) + ' ' : ''}${t.time ? 'a las ' + hour12(t.time) + ' ' : ''}te queda en ${money(t.price)}. ¿Te lo agendo?${sign()}`;
    },
    arrived: (c, t) => `Hola ${firstName(c)}, ya estoy afuera${t.from ? ' en ' + at(t.from, t.fromPt) : ''}. 🚗`,
    charge: (c, list) => {
      const transfer = payTo();
      return `Hola ${firstName(c)}, te comparto lo pendiente:\n${list.map((t) => `• ${fdate(t.date, { day: 'numeric', month: 'short' })}${t.to ? ' · ' + (t.from ? at(t.from, t.fromPt) + ' → ' : '') + at(t.to, t.toPt) : ''}: ${money(t.price)}`).join('\n')}\nTotal: ${money(list.reduce((s, t) => s + +t.price, 0))}.${transfer ? `\nTransferencia: ${transfer}` : ''}\n¡Gracias!${sign()}`;
    },
    week: (c, list) => {
      const short = (l) => (l || '…').split(',')[0];
      const days = [...new Set(list.map((t) => t.date))];
      const lines = days.map((d) => `• ${cap(fdate(d, { weekday: 'short', day: 'numeric', month: 'short' }))}: ${list.filter((t) => t.date === d).sort(byWhen).map((t) => `${t.time ? hour12(t.time) + ' ' : ''}${short(at(t.from, t.fromPt))} → ${short(at(t.to, t.toPt))}`).join(' · ')}`).join('\n');
      return `Hola ${firstName(c)}, te confirmo tus viajes:\n${lines}\nSon ${list.length} viaje${list.length === 1 ? '' : 's'} (${money(list.reduce((s, t) => s + +t.price, 0))}). ¡Gracias!${sign()}`;
    },
    hello: (c) => `Hola ${firstName(c)}, ¿cómo estás? Te recuerdo que sigo a tus órdenes para tus viajes. Cuando lo necesites, escríbeme y lo agendamos.${sign()}`,
  };
  return { phoneIntl, waLink, payTo, sign, MSG };
}
