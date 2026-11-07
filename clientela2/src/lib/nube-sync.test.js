import test from 'node:test';
import assert from 'node:assert/strict';
import { hash, mezclarColeccion, aplicarOps, mezclarConfig, planSubida, CFG } from './nube-sync.js';

const row = (id, datos, borrado = false) => ({ id, datos: { id, ...datos }, borrado });

test('hash no depende del orden de las llaves', () => {
  assert.equal(hash({ a: 1, b: { c: 2, d: [1, 2] } }), hash({ b: { d: [1, 2], c: 2 }, a: 1 }));
  assert.notEqual(hash({ a: 1 }), hash({ a: 2 }));
});

test('un cliente nuevo de la nube se agrega y queda como conocido', () => {
  const k = {};
  const ops = mezclarColeccion('clients', [], [row('c1', { name: 'Ana' })], k);
  assert.deepEqual(ops.upsert.map((x) => x.id), ['c1']);
  assert.ok('clients/c1' in k);
  assert.deepEqual(aplicarOps([], ops).map((x) => x.name), ['Ana']);
});

test('lo borrado en la nube se quita aquí', () => {
  const k = { 'trips/t1': 'x' };
  const ops = mezclarColeccion('trips', [{ id: 't1' }], [row('t1', {}, true)], k);
  assert.deepEqual(ops.remove, ['t1']);
  assert.ok(!('trips/t1' in k));
  assert.deepEqual(aplicarOps([{ id: 't1' }, { id: 't2' }], ops).map((x) => x.id), ['t2']);
});

test('si cambié aquí y la nube es más vieja, gana lo de aquí', () => {
  const local = { id: 't1', price: 500, updatedAt: 200 };
  const k = { 'trips/t1': hash({ id: 't1', price: 400, updatedAt: 100 }) };
  const ops = mezclarColeccion('trips', [local], [row('t1', { price: 400, updatedAt: 100 })], k);
  assert.equal(ops.upsert.length, 0);
  const plan = planSubida('trips', [local], k);
  assert.equal(plan.filas.length, 1);
});

test('si no cambié aquí, gana lo de la nube', () => {
  const local = { id: 't1', price: 400, updatedAt: 100 };
  const k = { 'trips/t1': hash(local) };
  const ops = mezclarColeccion('trips', [local], [row('t1', { price: 450, updatedAt: 300 })], k);
  assert.equal(ops.upsert[0].price, 450);
});

test('lo que borré aquí no reaparece y se avisa a la nube', () => {
  const k = { 'clients/c1': 'x' };
  const ops = mezclarColeccion('clients', [], [row('c1', { name: 'Ana' })], k);
  assert.equal(ops.upsert.length, 0);
  const plan = planSubida('clients', [], k);
  assert.deepEqual(plan.borrar.map((b) => b.id), ['c1']);
  assert.equal(plan.borrar[0].borrado, true);
});

test('lo ya subido no se vuelve a subir', () => {
  const x = { id: 'g1', amount: 50 };
  assert.equal(planSubida('expenses', [x], { 'expenses/g1': hash(x) }).filas.length, 0);
  assert.equal(planSubida('expenses', [x], {}).filas.length, 1);
});

test('configuración: teléfono vacío toma la de la nube; con datos conserva la suya', () => {
  const nube = { driver: { name: 'Eduardo' } }, local = { driver: { name: '' } };
  assert.deepEqual(mezclarConfig(local, { datos: nube }, {}, true), nube);
  assert.equal(mezclarConfig(local, { datos: nube }, {}, false), null);
});

test('configuración: si no la cambié aquí, toma la de la nube', () => {
  const local = { a: 1 }, k = { [CFG]: hash(local) };
  assert.deepEqual(mezclarConfig(local, { datos: { a: 2 } }, k, false), { a: 2 });
  const k2 = { [CFG]: 'otra' };
  assert.equal(mezclarConfig(local, { datos: { a: 2 } }, k2, false), null);
});
