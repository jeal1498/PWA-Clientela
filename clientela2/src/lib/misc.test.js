import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildVCard } from './vcard.js';
import { wifiQrText } from './wifi.js';
import { sosText, sosLink } from './sos.js';

test('vCard con teléfono, WhatsApp, cotizador y foto doblada', () => {
  const v = buildVCard({ name: 'Lalo; Chofer', phone: '998 123 4567', link: 'https://x.io/#/?c=abc', photo: 'data:image/jpeg;base64,' + 'A'.repeat(200) });
  assert.match(v, /^BEGIN:VCARD\r\nVERSION:3\.0/);
  assert.ok(v.includes('FN:Lalo\\; Chofer'));
  assert.match(v, /TEL;TYPE=CELL,VOICE:\+529981234567/);
  assert.match(v, /URL;TYPE=WhatsApp:https:\/\/wa\.me\/529981234567/);
  assert.match(v, /PHOTO;ENCODING=b;TYPE=JPEG:/);
  assert.ok(v.split('\r\n').every((l) => l.length <= 75));
});

test('QR de Wi-Fi escapa caracteres especiales', () => {
  assert.equal(wifiQrText({ ssid: 'Auto;Lalo', password: 'a:b' }), 'WIFI:T:WPA;S:Auto\\;Lalo;P:a\\:b;;');
  assert.equal(wifiQrText({ ssid: 'Libre' }), 'WIFI:T:nopass;S:Libre;;');
});

test('SOS por WhatsApp y SMS con ubicación', () => {
  const t = sosText('start', { lat: 21.1, lon: -86.8 }, 'https://rastreo.io/x');
  assert.match(t, /^Estoy iniciando un viaje en https:\/\/maps\.google\.com\/\?q=21\.100000,-86\.800000/);
  assert.match(t, /Rastreo en vivo/);
  assert.match(sosLink({ phone: '9981234567' }, 'hola'), /^https:\/\/wa\.me\/529981234567\?text=hola$/);
  assert.match(sosLink({ phone: '9981234567', channel: 'sms' }, 'hola'), /^sms:\+529981234567\?&body=hola$/);
});
