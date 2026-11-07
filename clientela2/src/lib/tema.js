// Tema de la app: 'auto' (sigue al sistema), 'claro' u 'oscuro'. Se guarda en este dispositivo (no en la nube).
// index.html aplica el tema guardado antes de pintar para que no parpadee.
export const KEY_TEMA = 'clientela2_tema';
export const TEMAS = ['auto', 'claro', 'oscuro'];
const META = { claro: '#F4F4EF', oscuro: '#0C0C10' };

export function temaGuardado() {
  try { const t = localStorage.getItem(KEY_TEMA); return TEMAS.includes(t) ? t : 'auto'; } catch { return 'auto'; }
}
/** ¿Se ve claro ahora? (según lo elegido o, en automático, según el sistema). */
export function esClaro(tema = temaGuardado()) {
  return tema === 'claro' || (tema === 'auto' && typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches);
}
export function aplicarTema(tema = temaGuardado()) {
  const r = document.documentElement;
  if (tema === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', tema === 'claro' ? 'light' : 'dark');
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', META[esClaro(tema) ? 'claro' : 'oscuro']));
}
export function guardarTema(tema) {
  try { localStorage.setItem(KEY_TEMA, tema); } catch { /* sin almacenamiento */ }
  aplicarTema(tema);
}
