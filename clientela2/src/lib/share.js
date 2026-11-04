// Enlace público del cotizador (para el Linktree).
// El cliente no tiene el localStorage del conductor, así que las tarifas viajan dentro del enlace (#/?c=…).
// Solo se comparten tarifas y datos de contacto; COSTOS y METAS se quedan privados en el teléfono del conductor.
import { withDefaults } from './pricing.js';

const b64url = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export function publicConfig(cfg) {
  const { driver, rates, extras } = withDefaults(cfg);
  return { driver, rates, extras };
}

export const encodeConfig = (cfg) => b64url(JSON.stringify(publicConfig(cfg)));

export function decodeConfig(code) {
  try {
    return withDefaults(JSON.parse(unb64url(code)));
  } catch {
    return null;
  }
}

export function publicLink(cfg) {
  const base = location.href.split('#')[0];
  return `${base}#/?c=${encodeConfig(cfg)}`;
}
