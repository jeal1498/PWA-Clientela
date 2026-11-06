import { test } from 'node:test';
import assert from 'node:assert/strict';
import { debtsByClient, debtTotals, daysSince, paidPatch, unpaidPatch } from './debts.js';

const trips = [
  { id: 1, date: '2026-10-16', clientId: 'a', clientName: 'A', amount: 480, pay: '' },
  { id: 2, date: '2026-10-20', clientId: 'a', clientName: 'A', amount: 220, pay: '' },
  { id: 3, date: '2026-11-03', clientName: 'B', amount: 150, pay: '' },
  { id: 4, date: '2026-11-04', clientName: ' b ', amount: 100, pay: '' },
  { id: 5, date: '2026-10-01', clientName: 'C', amount: 999, pay: 'efectivo' }, // ya pagado
];

test('daysSince cuenta días y no baja de cero', () => {
  assert.equal(daysSince('2026-10-16', '2026-11-06'), 21);
  assert.equal(daysSince('2026-11-10', '2026-11-06'), 0);
});

test('agrupa por cliente, suma y marca atrasados desde 15 días', () => {
  const g = debtsByClient(trips, '2026-11-06');
  assert.equal(g.length, 2);
  assert.equal(g[0].name, 'A');
  assert.equal(g[0].total, 700);
  assert.equal(g[0].days, 21);
  assert.equal(g[0].late, true);
  assert.equal(g[1].total, 250); // B y « b » son el mismo cliente
  assert.equal(g[1].late, false);
  assert.deepEqual(debtTotals(g), { total: 950, late: 700 });
});

test('15 días justos ya es atraso y 14 no', () => {
  assert.equal(debtsByClient([{ date: '2026-10-22', amount: 1, pay: '' }], '2026-11-06')[0].late, true);
  assert.equal(debtsByClient([{ date: '2026-10-23', amount: 1, pay: '' }], '2026-11-06')[0].late, false);
});

test('sin deudas no hay grupos', () => {
  assert.deepEqual(debtsByClient([{ date: '2026-11-01', amount: 5, pay: 'spei' }], '2026-11-06'), []);
});

test('cobrar y deshacer', () => {
  assert.deepEqual(paidPatch('spei', '2026-11-06'), { pay: 'spei', paidAt: '2026-11-06' });
  assert.deepEqual(unpaidPatch(), { pay: '', paidAt: null });
});
