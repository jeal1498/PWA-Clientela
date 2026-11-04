// Texto estándar de Wi-Fi para QR: la cámara del teléfono ofrece «Conectarse» al escanearlo.
const esc = (s) => String(s || '').replace(/([\\;,:"])/g, '\\$1');

export function wifiQrText({ ssid, password, security = 'WPA', hidden = false }) {
  const t = password ? security : 'nopass';
  return `WIFI:T:${t};S:${esc(ssid)};${password ? `P:${esc(password)};` : ''}${hidden ? 'H:true;' : ''};`;
}
