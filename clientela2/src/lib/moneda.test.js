import test from 'node:test';
import assert from 'node:assert/strict';
import { setMoneda, money, money2, rate, sym, MONEDAS, MONEDA_MXN } from './moneda.js';
import { fuelPerKm, withDefaults, hourlyQuote, DEFAULT_CONFIG } from './pricing.js';
import { publicConfig, decodeConfig, encodeConfig } from './share.js';

test.afterEach(() => setMoneda(MONEDA_MXN));

test('pesos por defecto', () => {
  assert.equal(money(1250), '$1,250');
  assert.equal(money2(2.04), '$2.04');
  assert.equal(rate(9.5), '$9.50');
  assert.equal(sym(), '$');
});

test('euro: símbolo después y coma decimal', () => {
  setMoneda(MONEDAS.find((m) => m.code === 'EUR'));
  assert.equal(money(1250), '1.250,00 €');
  assert.equal(money2(2.04), '2,04 €');
  assert.equal(sym(), '€');
});

test('colombiano: punto como separador de miles', () => {
  setMoneda(MONEDAS.find((m) => m.code === 'COP'));
  assert.equal(money(1250000), '$1.250.000');
});

test('negativos y datos inválidos', () => {
  assert.equal(money(-50), '-$50');
  assert.equal(money(undefined), '$0');
  setMoneda({ code: 'xx', sym: '', thou: 'zz', dec: ',' });
  assert.equal(money(1000), '$1.000,00'.replace(',00', '')); // moneda inválida cae a MXN con separadores válidos
});

test('gasolina por km de Checa manda sobre litro y rendimiento', () => {
  const costs = { gasPrice: 24, kmPerLitre: 12, wearPerKm: 1 };
  assert.equal(fuelPerKm(costs), 2);
  assert.equal(fuelPerKm({ ...costs, fuelKm: 3.5 }), 3.5);
  assert.equal(fuelPerKm({ ...costs, fuelKm: 0 }), 2);
});

test('la moneda sobrevive a withDefaults y al enlace público', () => {
  const eur = MONEDAS.find((m) => m.code === 'EUR');
  const cfg = { ...DEFAULT_CONFIG, currency: eur };
  assert.deepEqual(withDefaults(cfg).currency, eur);
  assert.equal(withDefaults({}).currency, undefined);
  assert.deepEqual(publicConfig(cfg).currency, eur);
  assert.equal(publicConfig(DEFAULT_CONFIG).currency, undefined);
  assert.deepEqual(decodeConfig(encodeConfig(cfg)).currency, eur);
});

test('el cobro por horas usa el símbolo de la moneda', () => {
  assert.match(hourlyQuote(2, DEFAULT_CONFIG).lines[0].label, /\$300/);
  setMoneda(MONEDAS.find((m) => m.code === 'BRL'));
  assert.match(hourlyQuote(2, DEFAULT_CONFIG).lines[0].label, /R\$300/);
});
