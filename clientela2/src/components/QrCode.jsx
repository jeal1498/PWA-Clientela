// Código QR en SVG (nítido a cualquier tamaño, sin imágenes externas).
import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

export default function QrCode({ text, size = 220, label = 'Código QR' }) {
  const { cells, n } = useMemo(() => {
    // Corrección M (resiste rayones); si el texto no cabe, L; si tampoco, no se dibuja.
    for (const level of ['M', 'L']) {
      try {
        const qr = qrcode(0, level);
        qr.addData(text, 'Byte');
        qr.make();
        const n = qr.getModuleCount();
        const cells = [];
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) cells.push(`M${c} ${r}h1v1h-1z`);
        return { cells: cells.join(''), n };
      } catch { /* demasiado largo para este nivel */ }
    }
    return { cells: '', n: 0 };
  }, [text]);
  if (!n) return <p className="text-center text-sm text-aviso">El enlace es demasiado largo para un QR.</p>;
  const q = 2; // margen blanco (zona de silencio) para que lea bien la cámara
  return (
    <svg role="img" aria-label={label} width={size} height={size} viewBox={`${-q} ${-q} ${n + 2 * q} ${n + 2 * q}`} className="rounded-2xl bg-white" shapeRendering="crispEdges">
      <rect x={-q} y={-q} width={n + 2 * q} height={n + 2 * q} fill="#fff" />
      <path d={cells} fill="#0C0C10" />
    </svg>
  );
}
