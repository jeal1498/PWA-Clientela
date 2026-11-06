// Persistencia local de Cartera. Mantiene la clave y la migración del formato anterior.
export function loadData(KEY, DEFAULTS, EXTRA_DEF) {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d) {
      const s = { ...structuredClone(DEFAULTS.settings), ...d.settings };
      // Tarifa anterior (banderazo + km + minuto) → por km y por hora, como en CHECA.
      if (d.settings && d.settings.perHour == null) {
        s.perHour = 180;
        s.extra = { ...structuredClone(EXTRA_DEF), base: { on: !!d.settings.base, v: +d.settings.base || 30 }, minimum: { on: true, v: +d.settings.minimum || 100 } };
        if (d.settings.bank && !d.settings.clabe) Object.assign(s, { clabe: d.settings.bank, bank: '', pays: ['Efectivo', 'Transferencia'] });
        delete s.base; delete s.perMin; delete s.minimum;
      }
      s.extra = { ...structuredClone(EXTRA_DEF), ...s.extra };
      s.share = { ...structuredClone(DEFAULTS.settings.share), ...s.share };
      return { ...DEFAULTS, ...d, settings: s };
    }
  } catch {}
  return structuredClone(DEFAULTS);
}
export function saveData(KEY, data, onError = () => {}) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { onError(); }
}
