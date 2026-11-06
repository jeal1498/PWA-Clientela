import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estadoAhora } from './estado.js';

const trips = [
  { id: 1, status: 'agendado', date: '2026-11-06', time: '09:00', dur: 45, clientName: 'A' },
  { id: 2, status: 'agendado', date: '2026-11-06', time: '14:00', dur: 60, clientName: 'C' },
  { id: 3, status: 'cancelado', date: '2026-11-06', time: '11:00', dur: 30 },
  { id: 4, date: '2026-11-06', time: '11:00', dur: 30 }, // hecho: no ocupa
];
const at = (h, m) => new Date(2026, 10, 6, h, m);

test('libre antes del primer viaje', () => {
  assert.deepEqual(estadoAhora(trips, at(8, 0)), { ocupado: false, texto: 'Disponible', detalle: 'Siguiente viaje a las 09:00' });
});
test('ocupado dentro del horario del viaje', () => {
  const e = estadoAhora(trips, at(9, 20));
  assert.equal(e.ocupado, true);
  assert.equal(e.detalle, 'En viaje con A hasta 09:45');
});
test('libre entre viajes, y los cancelados o hechos no cuentan', () => {
  assert.equal(estadoAhora(trips, at(11, 10)).detalle, 'Siguiente viaje a las 14:00');
});
test('sin más viajes hoy', () => {
  assert.equal(estadoAhora(trips, at(16, 0)).detalle, 'Sin más viajes hoy');
});
test('si ya llegaste sigues ocupado aunque pase la hora', () => {
  const e = estadoAhora([{ ...trips[0], arrivedAt: 'x' }], at(10, 30));
  assert.equal(e.ocupado, true);
  assert.equal(e.detalle, 'En viaje con A');
});
test('a mano gana a la agenda', () => {
  assert.equal(estadoAhora(trips, at(9, 20), 'libre').ocupado, false);
  assert.equal(estadoAhora(trips, at(8, 0), 'ocupado').ocupado, true);
});
