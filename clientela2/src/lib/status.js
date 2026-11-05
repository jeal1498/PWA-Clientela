// Estado del conductor para la página pública.
// Sin servidor no hay «en vivo»: en modo «auto» se calcula con el horario de servicio en el teléfono de quien
// abre la página, así que cambia solo durante el día sin volver a compartir el enlace ni reimprimir el QR.
const toMin = (hhmm) => { const [h, m] = String(hhmm || '0:0').split(':').map(Number); return h * 60 + (m || 0); };

export const STATUS = {
  available: { tone: 'green', label: 'Disponible para viajes' },
  reservations: { tone: 'yellow', label: 'En servicio · Reservas abiertas' },
  off: { tone: 'red', label: 'Fuera de servicio' },
};

/** ¿Está dentro del horario? Admite horarios que cruzan la medianoche (22:00 → 06:00). */
export function inSchedule(page, now = new Date()) {
  const days = page.days || [];
  const t = now.getHours() * 60 + now.getMinutes();
  const a = toMin(page.from), b = toMin(page.to);
  if (a === b) return days.includes(now.getDay()); // 24 h
  if (a < b) return days.includes(now.getDay()) && t >= a && t < b;
  // Cruza medianoche: la madrugada cuenta como el día anterior.
  const prevDay = (now.getDay() + 6) % 7;
  return (t >= a && days.includes(now.getDay())) || (t < b && days.includes(prevDay));
}

export function currentStatus(page, now = new Date()) {
  if (page.statusMode && page.statusMode !== 'auto' && STATUS[page.statusMode]) return { key: page.statusMode, ...STATUS[page.statusMode] };
  const key = inSchedule(page, now) ? 'available' : 'reservations';
  return { key, ...STATUS[key] };
}

const DAY = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** «Lun–Sáb · 07:00–22:00» */
export function scheduleText(page) {
  const d = [...(page.days || [])].sort((x, y) => x - y);
  if (!d.length) return '';
  const consecutive = d.every((x, i) => i === 0 || x === d[i - 1] + 1);
  const days = d.length === 7 ? 'Todos los días' : consecutive && d.length > 2 ? `${DAY[d[0]]}–${DAY[d[d.length - 1]]}` : d.map((x) => DAY[x]).join(', ');
  return `${days} · ${page.from === page.to ? '24 h' : `${page.from}–${page.to}`}`;
}
