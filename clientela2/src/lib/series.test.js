import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weekdayIdx, datesOf, finAfterWeeks, missingCopies, stopPatches, diasTexto, copyId } from './series.js';

const base = { id: 's1', serie: 's1', repite: true, dias: [0, 2, 4], fin: null, status: 'agendado', pay: '', date: '2026-11-09', time: '07:30', dur: 20, clientName: 'A', from: 'Casa', to: 'Escuela', amount: 150 };

test('0 = lunes', () => { assert.equal(weekdayIdx('2026-11-09'), 0); assert.equal(weekdayIdx('2026-11-15'), 6); });
test('datesOf respeta días y fin', () => {
  assert.deepEqual(datesOf('2026-11-09', [0, 2], '2026-11-18'), ['2026-11-09', '2026-11-11', '2026-11-16', '2026-11-18']);
});
test('finAfterWeeks da el último día de la semana N', () => { assert.equal(finAfterWeeks('2026-11-09', 4), '2026-12-06'); });
test('rellena 28 días hacia adelante sin duplicar lo que ya existe', () => {
  const nuevos = missingCopies([base], '2026-11-09');
  assert.equal(nuevos[0].date, '2026-11-11'); // el 9 ya existe
  assert.ok(nuevos.every((t) => t.date <= '2026-12-07'));
  assert.equal(nuevos.length, 12); // L-M-V × 4 semanas, menos el primero
  assert.equal(missingCopies([base, ...nuevos], '2026-11-09').length, 0); // idempotente
});
test('una copia cancelada no reaparece', () => {
  const nuevos = missingCopies([base], '2026-11-09');
  const cancelada = { ...nuevos[0], status: 'cancelado' };
  assert.ok(!missingCopies([base, cancelada, ...nuevos.slice(1)], '2026-11-09').some((t) => t.id === cancelada.id));
});
test('respeta la fecha de fin y no crea nada pasado', () => {
  const corto = { ...base, fin: '2026-11-13' };
  assert.deepEqual(missingCopies([corto], '2026-11-09').map((t) => t.date), ['2026-11-11', '2026-11-13']);
  assert.equal(missingCopies([{ ...base, date: '2026-10-05', id: 's1' }], '2026-11-09').every((t) => t.date >= '2026-11-09'), true);
});
test('detener cancela lo futuro sin avance y pone fin', () => {
  const t2 = { ...base, id: copyId('s1', '2026-11-11'), date: '2026-11-11' };
  const t3 = { ...base, id: copyId('s1', '2026-11-13'), date: '2026-11-13', confirmedAt: 'x' };
  const p = stopPatches([base, t2, t3], 's1', '2026-11-10');
  assert.deepEqual(p.map((x) => [x.id, x.patch.status || null]), [['s1', null], [t2.id, 'cancelado'], [t3.id, null]]);
  assert.ok(p.every((x) => x.patch.fin === '2026-11-10'));
});
test('texto de días', () => { assert.equal(diasTexto([4, 0, 2]), 'lun, mié, vie'); });
