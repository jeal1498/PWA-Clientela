// Acomoda tarjetas en dos columnas desde tablet (md) en adelante; en teléfono es una sola columna.
// Usa columnas CSS: se balancean solas por altura y cada tarjeta se queda entera en su columna.
import { Children } from 'react';

export default function Columnas({ children }) {
  return (
    <div className="space-y-4 md:block md:columns-2 md:gap-4 md:space-y-0">
      {Children.toArray(children).map((c, i) => (
        <div key={c.key ?? i} className="break-inside-avoid md:mb-4">{c}</div>
      ))}
    </div>
  );
}
