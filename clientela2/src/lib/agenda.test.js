import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDone, isScheduled, slot, clashes, stepOf, advancePatch, finishPatch, reopenPatch, upcoming } from './agenda.js';
import { summarize } from './ledger.js';
import { debtsByClient } from './debts.js';

const A = { id: 1, status: 'agendado', date: '2026-11-06', time: '09:00', dur: 45, amount: 480 };
const B = { id: 2, status: 'agendado', date: '2026-11-06', time: '09:30', dur: 20, amount: 150 };
const C = { id: 3, status: 'agendado', date: '2026-11-06', time: '09:45', dur: 20, amount: 100 };

test('sin status = hecho; agendado no cuenta como hecho', () => {
  assert.equal(isDone({ amount: 1 }), true);
  assert.equal(isDone(A), false);
  assert.equal(isScheduled(A), true);
});
test('un viaje ocupa al menos 30 min', () => {
  assert.deepEqual(slot({ time: '10:00', dur: 10 }), [600, 630]);
  assert.deepEqual(slot(A), [540, 585]);
});
test('detecta empalmes del mismo día y no a sí mismo', () => {
  assert.deepEqual(clashes([A, B, C], B).map((t) => t.id), [1, 3]); // B 9:30–10:00 pisa a A (hasta 9:45) y a C (9:45–10:15)
  assert.deepEqual(clashes([A, C], C).map((t) => t.id), []); // A termina 9:45 justo cuando empieza C
  assert.deepEqual(clashes([A], { ...B, date: '2026-11-07' }), []);
});
test('avance: confirmar, llegar, terminar', () => {
  const t = { ...A };
  assert.equal(stepOf(t), 0);
  Object.assign(t, advancePatch(t, 'x1')); assert.equal(stepOf(t), 1);
  Object.assign(t, advancePatch(t, 'x2')); assert.equal(stepOf(t), 2);
  assert.deepEqual(finishPatch('spei', '2026-11-06'), { status: 'hecho', pay: 'spei', paidAt: '2026-11-06' });
  assert.deepEqual(finishPatch('', '2026-11-06'), { status: 'hecho', pay: '', paidAt: null });
  assert.deepEqual(reopenPatch(), { status: 'agendado', pay: '', paidAt: null });
});
test('los agendados no entran a bitácora ni a «Te deben»', () => {
  const trips = [A, { id: 9, date: '2026-11-06', amount: 200, km: 10, pay: 'efectivo' }, { id: 8, date: '2026-11-06', amount: 50, pay: '', clientName: 'X' }];
  assert.equal(summarize(trips, [], ['2026-11-06']).gross, 250);
  const g = debtsByClient([{ ...A, pay: '' }, ...trips], '2026-11-20');
  assert.equal(g.length, 1);
  assert.equal(g[0].total, 50);
});
test('upcoming ordena por fecha y hora', () => {
  assert.deepEqual(upcoming([C, { ...A, date: '2026-11-07' }, B]).map((t) => t.id), [2, 3, 1]);
});
