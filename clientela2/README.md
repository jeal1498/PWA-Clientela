# Clientela 2.0 · Cotizador

Cotizador inteligente y multicanal para conductores privados. React 18 + Vite + Tailwind 4 + Lucide. Offline (PWA) y datos en `localStorage` (clave `clientela2`).

Publicado en **https://jeal1498.github.io/PWA-Clientela/cotiza/** (el build vive en `/cotiza`, la app Clientela de la raíz no cambia).

## Rutas (HashRouter)
| Ruta | Para quién | Qué hace |
|---|---|---|
| `#/` | Cliente | Cotizador público (Linktree): origen/destino, fecha, pasajeros, maletas → precio y **Solicitar por WhatsApp**. Lee las tarifas del enlace `#/?c=…`. |
| `#/app` | Conductor | **Hoy**: balance en vivo (ingresos − gastos = neta real), viaje cobrado y gastos en 1 toque, enlace público. |
| `#/app/manual` | Conductor | Cotizador exprés: ruta o km/min, **ganancia neta privada**, semáforo, ajustes, tarifa preferencial del cliente, WhatsApp / copiar / guardar / «Ya se hizo» → bitácora. |
| `#/app/bitacora` | Conductor | Viajes realizados (monto, Efectivo / SPEI / Tarjeta, origen/destino, km); semana con barras bruto vs. km. |
| `#/app/clientes` | Conductor | Clientes frecuentes: teléfono, notas, % de tarifa preferencial, rutas habituales y **Re-cotizar** por WhatsApp. |
| `#/app/mas` | Conductor | Gastos, cotizaciones, Wi-Fi a bordo, seguridad, ajustes. |
| `#/app/gastos` · `#/app/historial` · `#/app/wifi` · `#/app/settings` | Conductor | Gastos de la semana · cotizaciones · QR del Wi-Fi · costos, perfil (foto), Wi-Fi y contacto SOS. |

En la página pública también: **Guardar contacto** (.vcf con nombre, teléfono, WhatsApp, enlace y foto) y **Wi-Fi a bordo** (copiar clave + QR). El botón rojo **SOS** del encabezado manda «Estoy iniciando un viaje / En ruta en [ubicación]» al contacto de emergencia por WhatsApp o SMS.

**Datos** (`localStorage` `clientela2`): `config` (driver, costs, rates, extras, goals, wifi, sos), `history`, `clients`, `trips`, `expenses`.

## Estructura
```
src/
  lib/pricing.js     motor de cálculo (puro, con pruebas)
  lib/whatsapp.js    mensajes y enlaces wa.me, copiar
  lib/maps.js        Photon/Nominatim + OSRM, con estimación si no hay red
  lib/share.js       enlace público: solo tarifas y contacto (costos y metas NO salen del teléfono)
  lib/storage.js     localStorage (+ importa nombre/teléfono de Clientela la 1.ª vez)
  lib/ledger.js      bitácora y gastos: resumen del día y la semana (con pruebas)
  lib/vcard.js       contacto .vcf · lib/wifi.js texto del QR · lib/sos.js aviso de seguridad
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
