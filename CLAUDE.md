# CLAUDE.md — Clientela

PWA de gestión de **clientes privados** para conductores (los que piden viajes por fuera de Uber/DiDi). Usuario: **Eduardo** (Lalo, hombre). Antes «Cartera de clientes»; vivía en `jeal1498/PWA-JEAL` (`clientela/`), movida a este repo el 24-oct-2026.

## Reglas
- Español (México), respuestas **cortas y concisas**. Moneda MXN.
- **Una aprobación de Eduardo por etapa; no se adelanta la siguiente.** Maqueta en artifact antes de cualquier cambio grande. **Nada a `main` sin su OK.**
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
- Datos en `localStorage` clave `cartera`: `clients` (name, phone, places, rate, notes, services, savedPlaces), `trips` (clientId, date, time, from, to, km, price, status `agendado|hecho|cancelado`, pay `''|efectivo|transferencia|tarjeta`; hecho + pay '' = me debe), `settings` (driver, lada 52, city, perKm, bank, extra, savedPlaces…). Exportar/cargar copia JSON (merge por id).
- **Tarifa como CHECA** (`quote()`): precio = mayor entre km×`perKm` y horas×`perHour`; «Más detalles» en `settings.extra` {base, minimum, airport, night %, wait $/min}; redondeo a $10.
- **Búsqueda de lugares** (`mapas.js`): `settings.city` como sesgo; Nominatim «q, ciudad» → «q» → Photon, ordena por cercanía, Nominatim a 1 consulta/s (da 403 sin User-Agent en pruebas con Node). Lo que no está en OpenStreetMap no sale: salida real = Google Places (falta clave).
- **Pegar enlace de Google Maps** (`parseMapLink`): enlaces de Google Maps/Apple/Waze o coordenadas sueltas → sugerencia «Del enlace pegado». Orden: pin `!3d!4d` → `ll`/`q`/`query`/`destination` → `@lat,lon`. Los cortos `maps.app.goo.gl` no se pueden leer (CORS).
- **Paradas entre A y B**: `stops: [{label,lat,lon}]` en viajes y servicios (`stopsField` en `lugares-vista.js`); `route(a, b, via)` (OSRM) recalcula km/min y precio; `directionsLink`, `mapSvg`.
- **Lugares con nombre y menos pasos**: ☆ → Casa/Trabajo/Escuela/otro en `client.savedPlaces` o `settings.savedPlaces`, como `{name, addr, lat, lon}`; barra `placeBar`; ⇄ invierte A↔B. El punto elegido vive en `input._pt` (cámbialo con `setPlace(input, p)`). **El + de la barra abre Cotizar directo.**
- **Pago y Repetir en 1 toque**: con `lastPay`, «Terminar · Efectivo/Transf./Tarjeta» (`data-fpay`); `finishTrip(t, pay)` en `acciones-pago.js` con toast **Deshacer**; `repeatTrip(src)` en `cartera.js`.
- **Empalmes de horario**: `clashes(trips, x)` en `utilidades.js`; cada viaje ocupa `max(30, min de la ruta)` min. Es aviso, no bloqueo (segundo toque «Agendar igual»).
- **Inicio rápido** (`inicio-rapido-*.js`, si `!settings.onboarded`) y **Mi perfil** (`perfil-vistas.js`).

## Probar
`python3 -m http.server 8765` en la raíz y Playwright con Chromium en `/opt/pw-browsers/chromium` a 390 px; sembrar `localStorage` y hacer `reload()`.
