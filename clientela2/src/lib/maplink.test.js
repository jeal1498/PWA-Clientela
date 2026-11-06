import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMapLink, directionsLink } from './maplink.js';
import { driverProposalMessage } from './whatsapp.js';

test('lee el pin exacto de un enlace de Google Maps', () => {
  const r = parseMapLink('https://www.google.com/maps/place/Plaza+Principal/@19.43,-99.13,17z/data=!3d19.4326!4d-99.1332');
  assert.deepEqual(r, { lat: 19.4326, lon: -99.1332, name: 'Plaza Principal' });
});
test('lee coordenadas sueltas', () => {
  assert.deepEqual(parseMapLink('19.4326, -99.1332'), { lat: 19.4326, lon: -99.1332 });
});
test('enlace corto no se puede leer y texto normal da null', () => {
  assert.deepEqual(parseMapLink('https://maps.app.goo.gl/abc'), { unreadable: true });
  assert.equal(parseMapLink('Plaza Principal'), null);
});
test('directionsLink incluye las paradas', () => {
  const u = directionsLink({ lat: 1, lon: 2 }, { lat: 3, lon: 4 }, [{ lat: 5, lon: 6 }, { lat: 7, lon: 8 }]);
  assert.match(u, /origin=1,2&destination=3,4&waypoints=5,6%7C7,8&travelmode=driving/);
});
test('el mensaje del conductor lista las paradas en orden', () => {
  const q = { km: 10, min: 20, lines: [], tolls: 0 };
  const m = driverProposalMessage({ from: 'A', to: 'B', via: ['P1', 'P2'], q, price: 100 });
  assert.ok(m.indexOf('A') < m.indexOf('Paradas: P1 → P2') && m.indexOf('Paradas') < m.indexOf('B'));
});
