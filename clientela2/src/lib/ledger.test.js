import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daySummary, weekSummary } from './ledger.js';
import { weekDays } from './dates.js';

const trips = [
  { date: '2026-11-02', amount: 300, km: 20, pay: 'efectivo' },
  { date: '2026-11-04', amount: 500, km: 40, pay: 'spei' },
  { date: '2026-11-04', amount: 200, km: 10, pay: 'tarjeta' },
  { date: '2026-11-10', amount: 999, km: 99, pay: 'efectivo' }, // otra semana
];
const expenses = [
  { date: '2026-11-04', cat: 'combustible', amount: 400 },
  { date: '2026-11-04', cat: 'hormiga', amount: 50 },
];

test('balance del día: ingresos − gastos', () => {
  const d = daySummary(trips, expenses, '2026-11-04');
  assert.equal(d.gross, 700);
  assert.equal(d.spent, 450);
  assert.equal(d.net, 250);
  assert.equal(d.km, 50);
  assert.equal(d.grossPerKm, 14);
  assert.equal(d.byPay.spei, 500);
  assert.equal(d.byCat.combustible, 400);
});

test('semana de lunes a domingo', () => {
  assert.deepEqual(weekDays(new Date('2026-11-04T12:00')), ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08']);
  const w = weekSummary(trips, expenses, new Date('2026-11-04T12:00'));
  assert.equal(w.total.gross, 1000);
  assert.equal(w.total.trips, 3);
  assert.equal(w.days[0].gross, 300);
});
