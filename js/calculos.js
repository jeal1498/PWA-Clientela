// Reglas de tarifa de Cartera. Funciones de cálculo sin acceso al DOM ni al almacenamiento.
export const numOr = (v, d) => (v === '' || v == null || isNaN(+v) ? d : +v);
export const EXTRAS_INFO = [
  ['base', 'Banderazo', '$', 'Se suma a cada viaje'],
  ['minimum', 'Viaje mínimo', '$', 'Ningún viaje cuesta menos'],
  ['airport', 'Extra aeropuerto', '$', 'Si el viaje sale o llega al aeropuerto'],
  ['night', 'Tarifa nocturna', '%', 'De 10 pm a 6 am'],
  ['wait', 'Tiempo de espera', '$/min', 'Lo agregas en el viaje si te hacen esperar'],
];
export const PRESETS = { 'Económica': [10, 200], 'Estándar': [12, 240], 'Ejecutiva': [15, 300] };
export const isAirport = (...labels) => labels.some((l) => /aeropuerto|airport/i.test(l || ''));
export const isNight = (time) => !!time && (+time.slice(0, 2) >= 22 || +time.slice(0, 2) < 6);
export function calculateQuote(km, min, { airport = false, night = false, wait = 0 } = {}, s, EXTRA_DEF) {
  const X = s.extra || EXTRA_DEF, lines = [];
  const byKm = km * numOr(s.perKm, 12), byHour = (min / 60) * numOr(s.perHour, numOr(s.perKm, 12) * 20);
  let p = Math.max(byKm, byHour);
  lines.push([`Por km · ${km} km × $${s.perKm}`, byKm, byKm >= byHour], [`Por hora · ${min} min a $${s.perHour}/h`, byHour, byHour > byKm]);
  if (X.base.on) { p += +X.base.v; lines.push(['Banderazo', +X.base.v, true]); }
  if (X.airport.on && airport) { p += +X.airport.v; lines.push(['Extra aeropuerto', +X.airport.v, true]); }
  if (X.wait.on && wait) { p += wait * X.wait.v; lines.push([`Espera · ${wait} min`, wait * X.wait.v, true]); }
  if (X.night.on && night) { const n = (p * X.night.v) / 100; p += n; lines.push([`Nocturna +${X.night.v}%`, n, true]); }
  let total = Math.round(p / 10) * 10;
  if (X.minimum.on && total < +X.minimum.v) { total = +X.minimum.v; lines.push(['Sube al viaje mínimo', total, true]); }
  return { total, lines };
}
