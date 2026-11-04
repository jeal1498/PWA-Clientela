# Clientela 2.0 · Cotizador

Cotizador inteligente y multicanal para conductores privados. React 18 + Vite + Tailwind 4 + Lucide. Offline (PWA) y datos en `localStorage` (clave `clientela2`).

Publicado en **https://jeal1498.github.io/PWA-Clientela/cotiza/** (el build vive en `/cotiza`, la app Clientela de la raíz no cambia).

## Rutas (HashRouter)
| Ruta | Para quién | Qué hace |
|---|---|---|
| `#/` | Cliente | Cotizador público (Linktree): origen/destino, fecha, pasajeros, maletas → precio y **Solicitar por WhatsApp**. Lee las tarifas del enlace `#/?c=…`. |
| `#/app` | Conductor | Panel: enlace público para compartir, rentabilidad del historial, tus números. |
| `#/app/manual` | Conductor | Cotizador exprés: ruta o km/min a mano, **ganancia neta privada**, semáforo, ajustes rápidos, WhatsApp / copiar / guardar. |
| `#/app/historial` | Conductor | Cotizaciones guardadas: pendiente / aceptada / rechazada. |
| `#/app/settings` | Conductor | Costos (gasolina, rendimiento, desgaste), tarifas, recargos y metas. |

## Estructura
```
src/
  lib/pricing.js     motor de cálculo (puro, con pruebas)
  lib/whatsapp.js    mensajes y enlaces wa.me, copiar
  lib/maps.js        Photon/Nominatim + OSRM, con estimación si no hay red
  lib/share.js       enlace público: solo tarifas y contacto (costos y metas NO salen del teléfono)
  lib/storage.js     localStorage (+ importa nombre/teléfono de Clientela la 1.ª vez)
  store/AppStore.jsx estado global persistente
  components/        UI (tarjetas, inputs, semáforo, buscador de lugares)
  pages/             PublicQuote, Dashboard, ManualQuote, History, Settings
```

## Fórmulas
- Precio = banderazo + km × $/km + min × $/min + regreso vacío (si km ≥ foráneo: km × $/km × %) + maletas extra + paradas + casetas → mínimo → redondeo hacia arriba.
- Costo = km manejados × (gasolina ÷ rendimiento + desgaste) + casetas. En foráneo se maneja ida y vuelta (km y tiempo × 2).
- Neto = precio − costo. Semáforo: **verde** cumple meta $/km y $/h, **amarillo** una, **rojo** ninguna o pérdida.
- «Mínimo de mi meta» = costo + máx(km × meta $/km, horas × meta $/h).

## Desarrollo
```bash
cd clientela2
npm install
npm run dev     # http://localhost:5173
npm test        # pruebas del motor
npm run build   # escribe ../cotiza (se sube al repo; Pages lo sirve tal cual)
```
Tras cada cambio: `npm run build`, sube `CACHE` en `public/sw.js` y haz commit de `clientela2/` **y** `cotiza/`.
