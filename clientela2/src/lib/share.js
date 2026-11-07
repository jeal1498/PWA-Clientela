// Enlace público (Linktree y QR del vehículo).
// El cliente no tiene el localStorage del conductor: los datos públicos viajan dentro del enlace (#/?c=…).
// Se comprimen (deflate + base64url, prefijo «z») para que el enlace y el QR sean cortos.
// Solo viajan tarifas, contacto, vehículo y la página; COSTOS, METAS y SOS se quedan en el teléfono del conductor.
import { deflateSync, inflateSync, strToU8, strFromU8 } from 'fflate';
import { withDefaults } from './pricing.js';

const toB64url = (bytes) => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
// Formato anterior (sin comprimir): los enlaces ya compartidos siguen funcionando.
const legacy = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

/** `withPhoto: false` para el QR: la foto es lo más pesado y haría el código difícil de escanear. */
export function publicConfig(cfg, { withPhoto = true } = {}) {
  const { driver, rates, extras, wifi, vehicle, page, currency } = withDefaults(cfg);
  const heavy = String(driver.photo || '').startsWith('data:'); // foto subida (pesada); una URL es corta
  const out = { driver: withPhoto || !heavy ? driver : { ...driver, photo: '' }, rates, extras, vehicle, page };
  if (currency) out.currency = currency; // el pasajero ve los precios en la moneda del conductor
  if (wifi.showPublic && wifi.ssid) out.wifi = { ssid: wifi.ssid, password: wifi.password, security: wifi.security };
  return out;
}

export const encodeConfig = (cfg, opts) => 'z' + toB64url(deflateSync(strToU8(JSON.stringify(publicConfig(cfg, opts))), { level: 9 }));

export function decodeConfig(code) {
  try {
    const json = code.startsWith('z') ? strFromU8(inflateSync(fromB64url(code.slice(1)))) : legacy(code);
    const raw = JSON.parse(json);
    // El Wi-Fi solo cuenta si el conductor lo compartió en el enlace.
    return { ...withDefaults(raw), wifi: raw.wifi ? { ...raw.wifi, showPublic: true } : { ssid: '' } };
  } catch {
    return null;
  }
}

export function publicLink(cfg, opts) {
  const base = location.href.split('#')[0];
  return `${base}#/?c=${encodeConfig(cfg, opts)}`;
}
