# CLAUDE.md — Clientela

PWA de gestión de **clientes privados** para conductores (los que piden viajes por fuera de Uber/DiDi). Usuario: **Eduardo** (Lalo, hombre). Antes «Cartera de clientes»; vivía en `jeal1498/PWA-JEAL` (`clientela/`), movida a este repo el 24-oct-2026.

## Reglas
- Español (México), respuestas **cortas y concisas**. Moneda MXN.
- **Modo TDAH permanente** (pedido por Eduardo el 5-nov-2026; skill `i-have-adhd`): en cada respuesta, **la primera línea es la acción**; pasos numerados (uno por línea); al final **un solo siguiente paso de menos de 2 min**; sin saludos, recaps ni temas extra; tiempos concretos («15 min»); lo logrado se muestra con cómo probarlo; errores con causa y arreglo; listas de máx. 5 elementos. Si pide «explica», se puede alargar con títulos. Solo se apaga si dice «stop adhd mode» o «normal mode».
- **Una aprobación de Eduardo por etapa; no se adelanta la siguiente.** Maqueta en artifact antes de cualquier cambio grande. **Nada a `main` sin su OK, salvo el flujo autorizado el 24-oct-2026: tras cada cambio se abre el PR y se hace merge a `main` sin preguntar** (la rama se reinicia desde `main` si el PR anterior ya se fusionó).
- Repo público: nada de datos personales en el código.
- Sin build ni dependencias. **Sube `CACHE` (`clientela-vN`) en `sw.js` en cada cambio** o el teléfono no se actualiza; la lista `ASSETS` debe tener todos los módulos de `js/`.
- Publicada en https://jeal1498.github.io/PWA-Clientela/ (GitHub Pages). Mismo origen (`jeal1498.github.io`) que `PWA-JEAL`: **comparte `localStorage` `cartera`** con el link viejo (`/JEAL/clientela/`, que redirige aquí) y con `cartera/` v1.
- Plan y avance: `PLAN.md` (marcar `[x]` en cada avance y cambiar la fecha). Contexto: `.agents/product-marketing.md` (gratis por ahora para recibir comentarios; sin ciudad ni país en la marca).
- Pushes a `.github/workflows/` pueden rechazarse (token sin scope `workflow`): avisar qué subir a mano. `git push` a veces da 403: reintentar.

## Marca
Familia Checa; logo A (tarjeta de contacto con luz verde y ✓), lema «Tus clientes, en orden», verde cobrado / amarillo te debe / rojo atrasado (≥ 15 días), firma «de la familia Checa» solo en web y videos. **Fuente única `marca/`** (tokens, SVG, PNG, fuentes woff2); la app carga `marca/tokens.css`, no copiar valores. Skill `marca-clientela`. Láminas: https://claude.ai/artifact/SwF2P53ZQBTpXnVZCQqzqL

Skills en `.claude/skills/` (ui-ux-pro-max, copywriting, copy-editing, product-marketing, marketing-psychology, cro, pricing, ab-testing, social, video, media-use, `hyperframes*`, `marca-clientela`); `skills-lock.json` en la raíz.

## Orden del plan (aprobado 18 oct)
1 skills ✅ · 2 contexto ✅ · 3 marca ✅ · 4 rediseño PWA ✅ (falta su OK) · 5 **acceso con Google obligatorio + nube** (Supabase, como Checa; los datos locales se suben solos la primera vez; maqueta antes) · 6 APK · 7 link de reserva + anticipo con Mercado Pago · 8 web (repo propio) · 9 redes y videos (`videos-clientela`, molde `videos-checa`). Referencia: repo `jeal1498/Mi-Ruta` (CHECA, solo lectura, con su CLAUDE.md y skills).

## App (v2.0, rediseño del 18 oct)
Maqueta aprobada: https://claude.ai/artifact/AmJLsuWugR1ZEeznZxBBmZ. Solo oscuro. Instalable (`manifest.webmanifest` + `sw.js`).

- `index.html` + `css/cartera.css` + `js/cartera.js` (orquesta) y módulos: `interfaz.js` (encabezado con QR y avatar; barra con **botón + central**), `agenda-vista.js` (Hoy, franja «Te deben», «¿Se hizo?» Sí/No), `viaje-vistas.js` (tarjeta de viaje con **un paso**: Confirmar → Ya llegué → Terminar; `t.confirmedAt`), Cotizar (`quoteForm` en `cartera.js`), `cobros-vista.js` (amarillo reciente, rojo `lateDebt` ≥ 15 días, sello «Cobrado» con `t.paidAt`), `clientes-vista.js`, `cliente-detalle-vista.js`, `resumen.js`, `yo-vista.js` (perfil + ajustes, `settings.lastBackup`), `tarjeta-vista.js` (`#/tarjeta`, QR grande, wake lock) y `tarjeta.html` (página pública que lee los datos del enlace `#j…`/`#z…`, guardar contacto .vcf, pedir viaje por WhatsApp).
- Datos en `localStorage` clave `cartera`: `clients` (name, phone, places, rate, notes, services, savedPlaces), `trips` (clientId, date, time, from, to, km, price, status `agendado|hecho|cancelado`, pay `''|efectivo|transferencia|tarjeta`; hecho + pay '' = me debe), `settings` (driver, lada 52, city, perKm, bank, extra, savedPlaces…). El respaldo manual (copia JSON) ya no está en Yo; `pickBackup` queda solo en el inicio rápido.
- **Tarifa como CHECA** (`quote()`): precio = mayor entre km×`perKm` y horas×`perHour`; «Más detalles» en `settings.extra` {base, minimum, airport, night %, wait $/min}; redondeo a $10.
- **Búsqueda de lugares** (`mapas.js`): `settings.city` como sesgo; Nominatim «q, ciudad» → «q» → Photon, ordena por cercanía, Nominatim a 1 consulta/s (da 403 sin User-Agent en pruebas con Node). Lo que no está en OpenStreetMap no sale: salida real = Google Places (falta clave).
- **Pegar enlace de Google Maps** (`parseMapLink`): enlaces de Google Maps/Apple/Waze o coordenadas sueltas → sugerencia «Del enlace pegado». Orden: pin `!3d!4d` → `ll`/`q`/`query`/`destination` → `@lat,lon`. Los cortos `maps.app.goo.gl` no se pueden leer (CORS).
- **Paradas entre A y B**: `stops: [{label,lat,lon}]` en viajes y servicios (`stopsField` en `lugares-vista.js`); `route(a, b, via)` (OSRM) recalcula km/min y precio; `directionsLink`, `mapSvg`.
- **Lugares con nombre y menos pasos**: ☆ → Casa/Trabajo/Escuela/otro en `client.savedPlaces` o `settings.savedPlaces`, como `{name, addr, lat, lon}`; barra `placeBar`; ⇄ invierte A↔B. El punto elegido vive en `input._pt` (cámbialo con `setPlace(input, p)`). **El + de la barra abre Cotizar directo.**
- **Pago y Repetir en 1 toque**: con `lastPay`, «Terminar · Efectivo/Transf./Tarjeta» (`data-fpay`); `finishTrip(t, pay)` en `acciones-pago.js` con toast **Deshacer**; `repeatTrip(src)` en `cartera.js`.
- **Empalmes de horario**: `clashes(trips, x)` en `utilidades.js`; cada viaje ocupa `max(30, min de la ruta)` min. Es aviso, no bloqueo (segundo toque «Agendar igual»).
- **Inicio rápido** (`inicio-rapido-*.js`, si `!settings.onboarded`) y **Mi perfil** (`perfil-vistas.js`).

## Densidad compacta
Bloque final de `css/cartera.css`, mismas alturas que Finanzas: campos de 38 px con fondo y borde hueso tenue, botones de 44 px, barra inferior de 56 px (+ de 52), «Te deben» y mosaicos de 78 px, fila de tabla ~44 px. No volver a alturas de 50–52 px.

## Tabla Checa y tarjeta amarilla
- **Cobros** y **Clientes** usan la misma tabla que Pagos en Finanzas (`.ct-*` en `cartera.css`, piezas en `js/tabla.js`): fecha grande + mes, estatus con ícono (triángulo rojo atrasado ≥ 15 días, reloj amarillo te debe, palomita al día), cliente con nota debajo y monto en mono; atrasados teñidos de rojo. En Cobros cada fila es un `<details>` que abre sus viajes y las acciones (Recordar / Ya me pagó).
- «Te deben» en la Agenda (`.strip`) es una tarjeta amarilla llena (roja si hay atrasados), como «Atención inmediata» en Finanzas.

## Cuenta y nube (Supabase)
Acceso con Google obligatorio (`js/nube.js`, botón GIS sin SDK → `id_token` en Supabase, proyecto compartido con Checa `gqsadclvftkzwrihfipz`; origen `https://jeal1498.github.io` autorizado en Google Cloud). Se sincronizan clientes, viajes y ajustes (tablas `clientes`, `viajes_privados`, `perfil_conductor`; esquema en `supabase/clientela.sql`, con RLS por usuario). Huella por fila, borrados marcados, mezcla por cambio más reciente; funciona sin internet y sube después. El respaldo en Google Sheets se quitó (4 nov): lo reemplaza la nube.
- **Moneda** (`js/moneda.js`, Yo → Moneda): `settings.currency`, también en `perfil_conductor`; usar siempre `money()`/`rate()`/`sym()`, nunca `$` fijo.
- **Tarjeta**: enlace corto `tarjeta.html?c=<slug>` (RPC `tarjeta_publica`); el `#j…`/`#z…` anterior sigue valiendo.
- **Gasolina** (`settings.gasKm`, `perfil_conductor.gasolina_km`, la escribe Checa): «Te quedan $x» en Cotizar.
- **APK**: TWA en `android/` (`com.jeal1498.clientela`), workflow `apk.yml` con los secretos `CLIENTELA_KEYSTORE_B64` y `CLIENTELA_FIRMA`; `assetlinks.json` vive en el repo `jeal1498/jeal1498.github.io`.

## Probar
`python3 -m http.server 8765` en la raíz y Playwright con Chromium en `/opt/pw-browsers/chromium` a 390 px; sembrar `localStorage` y hacer `reload()`.

## Clientela 2.0 · Cotizador (`clientela2/` → `cotiza/`)
Excepción a «sin build»: React 18 + Vite + Tailwind 4 + lucide-react, aislado en `clientela2/`; `npm run build` escribe `cotiza/` (se sube al repo). HashRouter: `#/` público (landing en 6 bloques, `src/components/public/`; datos en `#/?c=z…` comprimido con fflate —los `#/?c=` sin «z» siguen valiendo—: driver, rates, extras, vehicle, page y Wi-Fi si `wifi.showPublic`; sin costos, metas ni SOS; estado 🟢/🟡 automático por horario en `lib/status.js`; .vcf según plataforma en `lib/vcard.js`; anclas con `scrollIntoView`, nunca `href="#…"`), `#/app/pagina` (panel de la landing: identidad —nombre, foto archivo/URL, WhatsApp, ciudad—, vehículo, estado auto/🟢/🟡/🔴, Wi-Fi, amenidades, redes, pagos, políticas, servicios y QR del auto sin foto subida; autoguardado + sincronía entre pestañas por evento `storage`; «Guardar cambios» = `markPublished(code)` y aviso si el enlace ya no está al día; «Restablecer» = `resetPublic()`), `#/app` (Hoy), `#/app/manual`, `#/app/bitacora`, `#/app/clientes`, `#/app/mas`, `#/app/gastos`, `#/app/historial`, `#/app/wifi`, `#/app/settings`. SOS en el encabezado: **un toque** manda «Estoy iniciando un viaje en [ubicación]» (usa la última ubicación guardada para abrir WhatsApp dentro del toque; si no hay, la pide ≤ 4 s y sale igual), **mantener presionado** abre «En ruta / Necesito ayuda / 911». `localStorage` `clientela2`: `config`, `history`, `clients`, `trips`, `expenses` (importa nombre/teléfono/ciudad de `cartera` la 1.ª vez). Hojas modales con portal (`Sheet.jsx`): dentro de `backdrop-blur` el `fixed` se rompe. Motor en `src/lib/pricing.js` (`npm test`). Sube `CACHE` en `clientela2/public/sw.js` en cada cambio.
