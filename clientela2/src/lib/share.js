// Enlace público del cotizador (para el Linktree).
// El cliente no tiene el localStorage del conductor, así que las tarifas viajan dentro del enlace (#/?c=…).
// Solo se comparten tarifas y datos de contacto; COSTOS y METAS se quedan privados en el teléfono del conductor.
import { withDefaults } from './pricing.js';

const b64url = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export function publicConfig(cfg) {
  const { driver, rates, extras, wifi } = withDefaults(cfg);
  const out = { driver, rates, extras };
  if (wifi.showPublic && wifi.ssid) out.wifi = { ssid: wifi.ssid, password: wifi.password, security: wifi.security };
  return out;
}

export const encodeConfig = (cfg) => b64url(JSON.stringify(publicConfig(cfg)));

export function decodeConfig(code) {
  try {
    const raw = JSON.parse(unb64url(code));
    // El Wi-Fi solo cuenta si el conductor lo compartió en el enlace.
    return { ...withDefaults(raw), wifi: raw.wifi ? { ...raw.wifi, showPublic: true } : { ssid: '' } };
  } catch {
    return null;
  }
}

export function publicLink(cfg) {
  const base = location.href.split('#')[0];
  return `${base}#/?c=${encodeConfig(cfg)}`;
}
