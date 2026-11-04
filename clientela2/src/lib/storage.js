// Persistencia offline en localStorage. Clave propia para no chocar con la app Clientela v2 (`cartera`).
export const KEY = 'clientela2';

export function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* modo privado o sin espacio: la app sigue funcionando en memoria */
  }
}

/** Si el conductor ya usa Clientela (mismo origen), toma su nombre, teléfono y ciudad la primera vez. */
export function importFromCartera() {
  try {
    const s = JSON.parse(localStorage.getItem('cartera'))?.settings || {};
    const d = s.driver || {};
    return { name: d.name || s.name || '', phone: d.phone || s.phone || '', lada: s.lada || '52', city: s.city || '' };
  } catch {
    return null;
  }
}
