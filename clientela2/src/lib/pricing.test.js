import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quote, evaluate, fuelPerKm, DEFAULT_CONFIG as C } from './pricing.js';

test('combustible por km = precio / rendimiento', () => {
  assert.equal(fuelPerKm({ gasPrice: 24, kmPerLitre: 12 }), 2);
});

test('viaje urbano: banderazo + km + min, redondeado a 10', () => {
  const q = quote({ km: 10, min: 20 }, C); // 35 + 90 + 40 = 165 → 170
  assert.equal(q.subtotal, 165);
  assert.equal(q.price, 170);
  assert.equal(q.foraneo, false);
  assert.equal(q.drivenKm, 10);
});

test('tarifa mínima', () => {
  const q = quote({ km: 1, min: 3 }, C); // 35 + 9 + 6 = 50 → 80
  assert.equal(q.price, 80);
  assert.ok(q.lines.some((l) => l.key === 'minimum'));
});

test('foráneo: cobra regreso vacío y cuesta el doble de km', () => {
  const q = quote({ km: 100, min: 80 }, C);
  assert.equal(q.foraneo, true);
  assert.ok(q.lines.find((l) => l.key === 'return').amount === 450); // 100×9×50 %
  assert.equal(q.drivenKm, 200);
});

test('maletas extra, paradas y casetas', () => {
  const q = quote({ km: 10, min: 20, bags: 4, stops: 1, tolls: 50 }, C);
  assert.equal(q.lines.find((l) => l.key === 'bags').amount, 40);
  assert.equal(q.lines.find((l) => l.key === 'stops').amount, 30);
  assert.equal(q.cost.tolls, 50);
});

test('semáforo de rentabilidad', () => {
  const trip = { km: 10, min: 20 };
  assert.equal(evaluate(400, trip, C).status, 'green');
  assert.equal(evaluate(20, trip, C).status, 'red');
  const e = evaluate(150, trip, C); // neto ≈ 150 − 36.4 = 113.6 → 11.4 $/km ✓, 340 $/h ✓
  assert.equal(e.status, 'green');
  assert.equal(evaluate(140, { km: 10, min: 40 }, C).status, 'yellow'); // neto 107.6: 10.8 $/km ✓, 161 $/h ✗
});

test('precio mínimo para metas cumple las metas', () => {
  const trip = { km: 25, min: 35 };
  const e = evaluate(1, trip, C);
  assert.equal(evaluate(e.minPriceForGoals, trip, C).status, 'green');
});
