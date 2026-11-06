// Mapa esquemático de la ruta: origen (verde), paradas (gris) y destino (rojo) sobre una cuadrícula. Sin mosaicos externos.
const W = 400, H = 150, PAD = 28;

export default function RideMap({ from, to, via = [], className = '' }) {
  const pts = [from, ...via.filter(Boolean), to].filter(Boolean);
  const label = pts.length ? 'Mapa de la ruta' : 'Mapa: elige un origen para empezar';
  let xy = [];
  if (pts.length === 1) xy = [[W / 2, H / 2]];
  else if (pts.length > 1) {
    const lons = pts.map((p) => p.lon), lats = pts.map((p) => p.lat);
    const [x0, x1, y0, y1] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
    const k = Math.min((W - 2 * PAD) / (x1 - x0 || 1e-6), (H - 2 * PAD) / (y1 - y0 || 1e-6));
    const ox = (W - (x1 - x0) * k) / 2, oy = (H - (y1 - y0) * k) / 2;
    xy = pts.map((p) => [ox + (p.lon - x0) * k, H - (oy + (p.lat - y0) * k)]);
  }
  const line = xy.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
  return (
    <div className={`bg-[#1C1C23] ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="block h-36 w-full" role="img" aria-label={label}>
        {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M0 ${i * 25}H${W}M${i * 67} 0V${H}`} stroke="#F4F4EF" strokeOpacity=".05" />)}
        {!pts.length && <text x={W / 2} y={H / 2 + 4} textAnchor="middle" fill="#A3A3AD" fontSize="13" fontFamily="DM Sans, Arial, sans-serif">Elige origen y destino para ver la ruta</text>}
        {xy.length > 1 && <polyline points={line} fill="none" stroke="#F4F4EF" strokeOpacity=".85" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
        {xy.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="9" stroke="#0C0C10" strokeWidth="3" fill={i === 0 ? '#22C55E' : i === xy.length - 1 ? '#EF4444' : '#A3A3AD'} />
        ))}
      </svg>
    </div>
  );
}
