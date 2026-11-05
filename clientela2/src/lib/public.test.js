import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inSchedule, currentStatus, scheduleText } from './status.js';
import { hourlyQuote, withDefaults } from './pricing.js';
import { encodeConfig, decodeConfig } from './share.js';

const page = { statusMode: 'auto', days: [1, 2, 3, 4, 5, 6], from: '07:00', to: '22:00' };
const at = (iso) => new Date(iso);

test('estado automático según horario', () => {
  assert.equal(currentStatus(page, at('2026-11-04T10:00')).key, 'available'); // miércoles
  assert.equal(currentStatus(page, at('2026-11-04T23:00')).key, 'reservations');
  assert.equal(currentStatus(page, at('2026-11-08T10:00')).key, 'reservations'); // domingo
  assert.equal(currentStatus({ ...page, statusMode: 'off' }).key, 'off');
});

test('horario que cruza medianoche', () => {
  const night = { days: [5], from: '20:00', to: '04:00' }; // viernes noche
  assert.equal(inSchedule(night, at('2026-11-06T23:30')), true);
  assert.equal(inSchedule(night, at('2026-11-07T02:00')), true); // madrugada del sábado
  assert.equal(inSchedule(night, at('2026-11-07T05:00')), false);
});

test('texto del horario', () => {
  assert.equal(scheduleText(page), 'Lun–Sáb · 07:00–22:00');
});

test('disposición por horas con mínimo', () => {
  assert.equal(hourlyQuote(1, {}).hours, 2);
  assert.equal(hourlyQuote(3, {}).price, 900);
});

test('enlace comprimido: ida y vuelta, más corto y sin costos', () => {
  const cfg = withDefaults({ driver: { name: 'Lalo', phone: '9981234567' }, vehicle: { model: 'Versa', plates: 'ABC-123' }, costs: { gasPrice: 99 } });
  const code = encodeConfig(cfg);
  assert.ok(code.startsWith('z'));
  const back = decodeConfig(code);
  assert.equal(back.driver.name, 'Lalo');
  assert.equal(back.vehicle.plates, 'ABC-123');
  assert.equal(back.costs.gasPrice, 24.5); // los costos no viajan: vuelve el valor por defecto
  const plain = Buffer.from(JSON.stringify(cfg)).toString('base64').length;
  assert.ok(code.length < plain / 2, `${code.length} vs ${plain}`);
});
