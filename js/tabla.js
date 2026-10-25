// Piezas de la tabla de la familia Checa (igual que Pagos en Finanzas): fecha grande, estatus con ícono y monto en mono.
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const svg = (d) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
export const CT_ICON = {
  late: svg('<path d="M12 3 2.5 20h19z"/><path d="M12 10v4.5M12 17.5v.01"/>'),
  owed: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  ok: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  none: svg('<path d="M8 12h8"/>'),
};
export const ctFecha = (iso) => {
  if (!iso) return '<span class="ct-fecha"><b>—</b></span>';
  const d = new Date(`${iso}T00:00:00`);
  return `<span class="ct-fecha"><b>${d.getDate()}</b><small>${MESES[d.getMonth()]}</small></span>`;
};
export const ctHead = (a, b, c, d) => `<div class="ct-cols ct-th"><span>${a}</span><span>${b}</span><span>${c}</span><span class="r">${d}</span></div>`;
export const ctEstado = (tone, label) => `<span class="ct-est ${tone}" role="img" aria-label="${label}" title="${label}">${CT_ICON[{ danger: 'late', warn: 'owed', ok: 'ok', muted: 'none' }[tone]]}</span>`;
