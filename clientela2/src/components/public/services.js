// Tipos de servicio que el conductor puede ofrecer en su página.
export const SERVICES = [
  { key: 'urban', emoji: '🏙️', short: 'Punto a punto', line: 'Traslados en la ciudad, directo', label: 'Servicio urbano / punto a punto', desc: 'Traslados en la ciudad, directo y sin paradas de más.' },
  { key: 'airport', emoji: '✈️', short: 'Aeropuerto', line: 'Te espero en llegadas', label: 'Traslado al aeropuerto', desc: 'Puntualidad y monitoreo de tu vuelo. Te espero en llegadas.' },
  { key: 'foraneo', emoji: '🛣️', short: 'Foráneo', line: 'A otras ciudades, precio cerrado', label: 'Viaje foráneo / interurbano', desc: 'Rutas regionales a otras ciudades, con precio cerrado.' },
  { key: 'hourly', emoji: '⏱️', short: 'Por horas', line: 'Auto y conductor por tiempo', label: 'Disposición por horas / tour privado', desc: 'El auto y el conductor a tu disposición: compras, eventos, tours.' },
];
