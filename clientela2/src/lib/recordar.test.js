import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cuandoDe, sinAvisarManana, avisadoTexto } from './recordar.js';
import { tripReminderMessage } from './whatsapp.js';

test('hoy, mañana y más lejos', () => {
  assert.equal(cuandoDe('2026-11-06', '2026-11-06'), 'hoy');
  assert.equal(cuandoDe('2026-11-07', '2026-11-06'), 'mañana');
  assert.equal(cuandoDe('2026-11-09', '2026-11-06'), null);
});
test('solo cuentan los agendados de mañana sin avisar', () => {
  const t = [
    { id: 1, status: 'agendado', date: '2026-11-07' },
    { id: 2, status: 'agendado', date: '2026-11-07', recordadoAt: 'x' },
    { id: 3, status: 'agendado', date: '2026-11-06' },
    { id: 4, status: 'cancelado', date: '2026-11-07' },
    { id: 5, date: '2026-11-07' },
  ];
  assert.deepEqual(sinAvisarManana(t, '2026-11-06').map((x) => x.id), [1]);
});
test('texto de avisado', () => {
  const now = new Date(2026, 10, 6, 12, 0);
  assert.equal(avisadoTexto(new Date(2026, 10, 6, 8, 5).toISOString(), now), 'Avisado hoy 8:05');
  assert.equal(avisadoTexto(new Date(2026, 10, 5, 20, 30).toISOString(), now), 'Avisado ayer 20:30');
});
test('mensaje de recordatorio', () => {
  const m = tripReminderMessage({ clientName: 'A', cuando: 'mañana', time: '09:00', from: 'Casa', to: 'Escuela', amount: 150, driverName: 'Eduardo' });
  assert.match(m, /Hola A .*mañana a las 09:00/);
  assert.match(m, /📍 Casa\n🏁 Escuela\n💰 \$150/);
  assert.match(m, /— Eduardo$/);
});
