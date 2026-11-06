import { test } from 'node:test';
import assert from 'node:assert/strict';
import { periods, goalsOf, resumen, daysLeft } from './stats.js';

const trips = [
  { id: 1, date: '2026-11-09', amount: 600, clientName: 'A', from: 'Casa', to: 'Escuela', pay: 'efectivo' },
  { id: 2, date: '2026-11-10', amount: 400, clientName: 'B', from: 'Centro', to: 'Aeropuerto', pay: '' },
  { id: 3, date: '2026-11-11', amount: 300, clientName: 'A', from: 'Casa', to: 'Escuela', pay: 'spei' },
  { id: 4, date: '2026-11-02', amount: 500, clientName: 'A', pay: 'efectivo' }, // semana anterior
  { id: 5, date: '2026-11-11', amount: 999, status: 'agendado', pay: '' }, // no cuenta
];
const gastos = [{ date: '2026-11-10', amount: 100 }];

test('periodos de semana y mes', () => {
  assert.deepEqual(periods('sem', '2026-11-11'), { desde: '2026-11-09', hasta: '2026-11-15', prev: { desde: '2026-11-02', hasta: '2026-11-08' } });
  const m = periods('mes', '2026-11-11');
  assert.deepEqual([m.desde, m.hasta, m.prev.desde, m.prev.hasta], ['2026-11-01', '2026-11-30', '2026-10-01', '2026-10-31']);
});
test('metas: derivan una de otra', () => {
  assert.deepEqual(goalsOf({ dayNet: 900, weekNet: 5000 }), { dia: 900, sem: 5000, mes: 21667 });
  assert.deepEqual(goalsOf({ dayNet: 0, weekNet: 6000 }), { dia: 1000, sem: 6000, mes: 26000 });
  assert.deepEqual(goalsOf({ dayNet: 500 }), { dia: 500, sem: 3000, mes: 13000 });
  assert.deepEqual(goalsOf({}), { dia: 0, sem: 0, mes: 0 });
});
test('resumen semanal: neto, comparación, barras y rankings', () => {
  const r = resumen(trips, gastos, 'sem', '2026-11-11');
  assert.equal(r.net, 1200); // 1300 de ingresos − 100 de gastos (el agendado no cuenta)
  assert.equal(r.prevNet, 500);
  assert.equal(r.delta, 140);
  assert.deepEqual(r.bars.map((b) => b.net), [600, 300, 300, 0, 0, 0, 0]);
  assert.deepEqual(r.clientes.map((c) => [c.name, c.total, c.n]), [['A', 900, 2], ['B', 400, 1]]);
  assert.deepEqual(r.rutas[0], { name: 'Casa → Escuela', total: 900, n: 2 });
});
test('resumen mensual: barras por semana', () => {
  const r = resumen(trips, gastos, 'mes', '2026-11-11');
  assert.equal(r.bars.length, 6); // el 1 de nov es domingo: S1 tiene un solo día
  assert.equal(r.bars[0].label, 'S1');
  assert.equal(r.net, 1700);
});
test('días que quedan contando hoy', () => {
  assert.equal(daysLeft('sem', '2026-11-11'), 5);
  assert.equal(daysLeft('mes', '2026-11-28'), 3);
});
