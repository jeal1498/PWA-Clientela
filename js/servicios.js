// Helpers para nombrar servicios frecuentes y preparar un viaje desde ellos.
export function createServiceHelpers({ suggestPrice, isAirport }) {
  const autoName = (sv) => [sv.a?.label, sv.b?.label].map((l) => (l || '…').split(',')[0]).join(' → ') + (sv.stops?.length ? ` (+${sv.stops.length})` : '');
  const svcCtx = (sv) => ({ airport: isAirport(sv.a?.label, sv.b?.label) });
  const svcPrice = (sv) => sv.price ?? (sv.km ? suggestPrice(sv.km, sv.min, svcCtx(sv)) : 0);
  const fromService = (c, sv) => ({ clientId: c.id, from: sv.a?.label || '', to: sv.b?.label || '', fromPt: sv.a, toPt: sv.b, stops: sv.stops || [], km: sv.km || '', min: sv.min || '', path: sv.path, price: svcPrice(sv) });
  return { autoName, svcCtx, svcPrice, fromService };
}
