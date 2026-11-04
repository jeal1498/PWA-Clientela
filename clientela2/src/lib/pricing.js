// Motor de cálculo de Clientela 2.0. Funciones puras (sin React) para poder probarlas con `npm test`.
//
// Ideas clave:
//  - El PRECIO al cliente sale de las tarifas (banderazo + km + minutos + adicionales).
//  - El COSTO del conductor sale de combustible + desgaste + casetas, sobre los km que de verdad maneja
//    (en un foráneo también regresa vacío, así que los km y el tiempo se duplican).
//  - La GANANCIA NETA = precio − costo. La rentabilidad se mide contra las metas $/km y $/hora.

/** Configuración por defecto (MXN). El conductor la cambia en /app/settings. */
export const DEFAULT_CONFIG = {
  driver: { name: '', phone: '', lada: '52', city: '' },
  costs: {
    gasPrice: 24.5, // $ por litro
    kmPerLitre: 12, // rendimiento real del vehículo
    wearPerKm: 1.2, // llantas, aceite, frenos, depreciación… por km
  },
  rates: {
    base: 35, // banderazo
    perKm: 9,
    perMin: 2, // espera o tráfico
    minimum: 80, // tarifa mínima del viaje
    rounding: 10, // redondea hacia arriba a múltiplos de… (0 = sin redondeo)
  },
  extras: {
    foraneoKm: 40, // a partir de estos km el viaje se considera foráneo
    emptyReturnPct: 50, // % de la tarifa por km que se cobra por regresar vacío
    freeBags: 2, // maletas incluidas
    bagFee: 20, // $ por maleta extra
    stopFee: 30, // $ por parada intermedia
  },
  goals: { minPerKm: 10, minPerHour: 200 },
};

const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const round2 = (n) => Math.round(n * 100) / 100;

/** Redondea hacia arriba al múltiplo indicado (step 0 = solo centavos). */
export const roundUp = (n, step) => (step > 0 ? Math.ceil(n / step) * step : round2(n));

/** Costo de combustible por km = precio litro / km por litro. */
export const fuelPerKm = (costs) => (num(costs.kmPerLitre) > 0 ? num(costs.gasPrice) / num(costs.kmPerLitre) : 0);

/** Costo operativo total por km (combustible + desgaste). */
export const costPerKm = (costs) => fuelPerKm(costs) + num(costs.wearPerKm);

/** Mezcla profunda sencilla: garantiza que configs viejas o incompletas tengan todas las llaves. */
export function withDefaults(cfg = {}) {
  const out = {};
  for (const k of Object.keys(DEFAULT_CONFIG)) out[k] = { ...DEFAULT_CONFIG[k], ...(cfg[k] || {}) };
  return out;
}

/**
 * Calcula la tarifa sugerida y su desglose.
 * @param {{km:number, min:number, bags?:number, stops?:number, tolls?:number}} trip
 * @param {object} config
 */
export function quote(trip, config) {
  const { rates, extras } = withDefaults(config);
  const km = Math.max(0, num(trip.km));
  const min = Math.max(0, num(trip.min));
  const bags = Math.max(0, Math.round(num(trip.bags)));
  const stops = Math.max(0, Math.round(num(trip.stops)));
  const tolls = Math.max(0, num(trip.tolls));
  const foraneo = num(extras.foraneoKm) > 0 && km >= num(extras.foraneoKm);

  const lines = [];
  const add = (key, label, amount) => amount > 0 && lines.push({ key, label, amount: round2(amount) });

  add('base', 'Banderazo', num(rates.base));
  add('km', `Distancia (${km.toFixed(1)} km)`, km * num(rates.perKm));
  add('min', `Tiempo (${Math.round(min)} min)`, min * num(rates.perMin));
  if (foraneo) add('return', `Regreso vacío (${num(extras.emptyReturnPct)} %)`, (km * num(rates.perKm) * num(extras.emptyReturnPct)) / 100);
  const extraBags = Math.max(0, bags - num(extras.freeBags));
  add('bags', `Equipaje extra (${extraBags})`, extraBags * num(extras.bagFee));
  add('stops', `Paradas (${stops})`, stops * num(extras.stopFee));
  add('tolls', 'Casetas', tolls);

  const subtotal = round2(lines.reduce((s, l) => s + l.amount, 0));
  const floor = Math.max(subtotal, num(rates.minimum));
  if (floor > subtotal) lines.push({ key: 'minimum', label: 'Ajuste a tarifa mínima', amount: round2(floor - subtotal) });
  const price = km > 0 || min > 0 ? roundUp(floor, num(rates.rounding)) : 0;
  if (price > floor) lines.push({ key: 'round', label: 'Redondeo', amount: round2(price - floor) });

  return { km, min, bags, stops, tolls, foraneo, lines, subtotal, price, ...evaluate(price, { km, min, tolls, foraneo }, config) };
}

/**
 * Evalúa la rentabilidad de un PRECIO cualquiera (sirve también cuando el conductor negocia o sobrescribe).
 * Devuelve costos, neto, métricas y semáforo.
 */
export function evaluate(price, { km, min, tolls = 0, foraneo = false }, config) {
  const { costs, goals } = withDefaults(config);
  const factor = foraneo ? 2 : 1; // en foráneo regresa vacío: maneja el doble
  const drivenKm = num(km) * factor;
  const hours = (num(min) * factor) / 60;

  const fuel = round2(drivenKm * fuelPerKm(costs));
  const wear = round2(drivenKm * num(costs.wearPerKm));
  const totalCost = round2(fuel + wear + num(tolls));
  const net = round2(num(price) - totalCost);

  const netPerKm = drivenKm > 0 ? round2(net / drivenKm) : 0;
  const netPerHour = hours > 0 ? round2(net / hours) : 0;
  const okKm = netPerKm >= num(goals.minPerKm);
  const okHour = netPerHour >= num(goals.minPerHour);

  // Precio mínimo para cumplir AMBAS metas: dato clave antes de ofrecer un descuento.
  const breakEven = totalCost + Math.max(drivenKm * num(goals.minPerKm), hours * num(goals.minPerHour));

  return {
    cost: { fuel, wear, tolls: round2(num(tolls)), total: totalCost },
    net,
    margin: price > 0 ? Math.round((net / price) * 1000) / 10 : 0,
    drivenKm: round2(drivenKm),
    hours: round2(hours),
    metrics: { netPerKm, netPerHour, okKm, okHour },
    status: price <= 0 ? 'idle' : net <= 0 ? 'red' : okKm && okHour ? 'green' : okKm || okHour ? 'yellow' : 'red',
    minPriceForGoals: Math.ceil(breakEven),
  };
}

export const STATUS_COPY = {
  green: { label: 'Rentable', hint: 'Cumple tus dos metas' },
  yellow: { label: 'Justo', hint: 'Cumple solo una meta' },
  red: { label: 'No conviene', hint: 'Debajo de tus metas' },
  idle: { label: 'Sin datos', hint: 'Captura km y minutos' },
};
