# Plan de Clientela

Se actualiza en cada avance: `[x]` hecho, `[ ]` pendiente. Última actualización: 5 nov 2026.

## Resultado final
Clientela publicada para conductores de Uber, DiDi, taxi y choferes independientes, gratis por ahora para recibir comentarios:
- **App Android (APK)** con la marca, acceso con Google obligatorio y tus clientes guardados en la nube.
- **Tarjeta digital con QR**, **cotizar en segundos**, agenda, cobros por WhatsApp y **link de reserva con anticipo por Mercado Pago**.
- **Página web** propia para descargarla, con medición sencilla.
- **Marca** de la familia Checa, **cuentas en redes**, plan de contenido y **plantilla de videos** con su skill.

## Reglas
- Una aprobación de Eduardo por etapa; no se adelanta la siguiente.
- Maqueta en artifact antes de cualquier cambio grande.
- Nada a `main` sin el OK de Eduardo. Repo propio desde el 24 oct 2026 (antes vivía en `jeal1498/PWA-JEAL`, carpeta `clientela/`).
- El repo es público: nada de datos personales en el código.

## Etapas

### 1. Skills ✅
- [x] Copiar de Checa las skills de diseño, textos, marketing y videos (`.claude/skills/`).
- [x] Crear `marca-clientela`.

### 2. Contexto del producto ✅
- [x] Preguntas a Eduardo y documento `.agents/product-marketing.md`.

### 3. Identidad de marca ✅
- [x] Decidir: familia Checa.
- [x] Láminas: https://claude.ai/artifact/SwF2P53ZQBTpXnVZCQqzqL
- [x] Aprobada: logo de tarjeta de contacto, lema «Tus clientes, en orden», verde cobrado / amarillo te debe / rojo atrasado, firma «de la familia Checa» en web y videos.
- [x] Carpeta `marca/` (fuente única) y skill `marca-clientela` llena.

### 4. Rediseño de la app (PWA) — publicado, falta probar en tu teléfono
- [x] Auditoría pantalla por pantalla.
- [x] Maqueta aprobada: https://claude.ai/artifact/AmJLsuWugR1ZEeznZxBBmZ
- [x] App movida a `clientela/` (el link viejo redirige; los datos se conservan).
- [x] Parte 1: marca, solo oscuro, instalable y sin internet.
- [x] Parte 2: encabezado con QR, botón + al centro, pantalla Yo.
- [x] Parte 3: agenda con un paso por viaje y «¿Se hizo?».
- [x] Parte 4: Cotizar y mandar precio por WhatsApp.
- [x] Parte 5: Cobros por antigüedad, Clientes, Ficha y Resumen.
- [x] Parte 6: Mi tarjeta en pantalla completa y su página `tarjeta.html`; se borró `perfil-conductor.html`.
- [x] Parte 7: arranque con la marca y repaso a 390 px con Playwright.
- [x] OK de Eduardo para pasarlo a `main` (18 oct).
- [x] Prueba en el teléfono: a Eduardo **no lo convence el diseño de las pantallas** (23 oct).
- [x] Nuevo acomodo de pantallas (https://claude.ai/artifact/LNFP8ikEjpyCwYPuhnnphm): Eduardo eligió la **mezcla sugerida** (4 nov): B en Agenda, Cobros, Cotizar y Ficha; A en Clientes (cuenta de viajes). Resumen, Yo, Mi tarjeta y arranque quedan igual.
- [x] Migrar las pantallas a la mezcla, una por una con su OK: [x] Agenda (un solo foco, 4 nov) · [x] Cobros (B, 4 nov) · [x] Cotizar (B, 4 nov) · [x] Ficha (B, 4 nov) · [x] Clientes (A, 4 nov).

### 5. Acceso con Google y nube
- [x] Maqueta de la pantalla de acceso (falta OK de Eduardo): https://claude.ai/artifact/8GchMPGtNoTpUhSJ4UjVCZ (copia en `docs/maqueta-acceso.html`).
- [x] Decidir: mismo proyecto de Supabase de Checa (4 nov).
- [x] Acceso obligatorio con Google, como Checa (`js/nube.js`, botón de Google sin SDK). **Falta que Eduardo agregue `https://jeal1498.github.io` como origen autorizado del cliente web en Google Cloud.**
- [x] Subir solos los datos del teléfono la primera vez.
- [x] Sincronizar clientes, viajes y ajustes (probado con nube simulada; falta con Google real).
- [x] Prueba de punta a punta (Eduardo dio el OK, 4 nov).

### 6. APK
- [x] Empaquetado elegido: **TWA** (4 nov). Proyecto Gradle propio en `android/` (androidbrowserhelper, paquete `com.jeal1498.clientela`), sin Bubblewrap; compila y firma bien en pruebas locales.
- [x] Compilar con GitHub Actions (`.github/workflows/apk.yml`; corrido el 4 nov con los secretos `CLIENTELA_KEYSTORE_B64` y `CLIENTELA_FIRMA`, que viven solo ahí, nunca en el repo) como `build.yml` de Checa (si el push de `.github/workflows/` se rechaza, Eduardo lo sube a mano).
- [x] Firma para que las actualizaciones se instalen encima (misma llave siempre; Eduardo guarda copia de los dos secretos).
- [x] Release con link directo: https://github.com/jeal1498/PWA-Clientela/releases/latest/download/Clientela.apk (con `assetlinks.json` adjunto).
- [x] Quitar la barra de direcciones: repo `jeal1498/jeal1498.github.io` con `.well-known/assetlinks.json` y `.nojekyll` (4 nov); la app abre a pantalla completa.
- [x] Prueba en el teléfono (4 nov): instala, abre sin barra y con tus datos. Falta probar el login de Google desde cero dentro del APK.

### 7. Link de reserva y anticipo
- [ ] Maqueta.
- [ ] Link para que el cliente cotice y pida su viaje.
- [ ] Anticipo con Mercado Pago (reutilizar lo de Checa).
- [ ] Prueba con un pago real.

### 8. Página web
- [ ] Repo propio, como `checa-web`.
- [ ] Plan, textos y maqueta.
- [ ] Landing con la marca, pensada para descargar.
- [ ] Medición sencilla.
- [ ] Publicar.

### 9. Redes y videos
- [ ] Nombres de cuentas y perfiles.
- [ ] Plan de contenido.
- [ ] Plantilla de video con la marca (molde `checa-marca-v2`).
- [ ] Skill `videos-clientela`.

### 10. Puente con Checa (Supabase compartido) — 4 nov 2026
Checa y Clientela comparten **el mismo proyecto de Supabase** (`gqsadclvftkzwrihfipz`) y la misma cuenta de Google. Cada una conserva su propósito; se enlazan.
- [x] Esquema compartido, listo en `supabase/clientela.sql` (probado en Postgres local; **ya corrido en SQL Editor de Supabase el 4 nov y verificado**; falta copiarlo a `esquema.sql` de `APK-CHECA` para que `supabase.yml` lo mantenga): `perfil_conductor` (moneda, tarifas, teléfono, ciudad, enlace público), `clientes`, `viajes_privados`, `contactos_sos`, `viajes_checa`; todas con RLS por usuario.
- [x] Decidir el rediseño A/B (etapa 4): mezcla sugerida.
- [x] Login con Google y nube (etapa 5) con la misma cuenta de Checa; subir solos los datos de `cartera` la primera vez (falta prueba con Google real).
- [x] Moneda: selector (símbolo, formato, separadores, decimales) en Yo → Moneda, guardado en `perfil_conductor` (`js/moneda.js`); lo usan cotizar, cobros, mensajes y la tarjeta. Falta la prueba en el teléfono.
- [x] Tarjeta con QR leyendo del perfil en la nube: enlace corto `tarjeta.html?c=slug` (función `tarjeta_publica`); el enlace `#j…`/`#z…` anterior sigue funcionando. Falta la prueba en el teléfono.
- [x] Costo de gasolina de `perfil_conductor.gasolina_km` (lo escribe Checa; mientras tanto se pone en Yo → Gasolina) y «Te quedan $x» en Cotizar. **Pendiente en Checa:** escribir `gasolina_km` (precio por litro ÷ km por litro). Falta la prueba en el teléfono.
- [x] APK (etapa 6) · [ ] licencias combinadas con Checa.
- Orden global y razones: `docs/web-y-ventas.md` de `jeal1498/APK-CHECA` («Pendientes de funciones nuevas»).

### 11. Clientela 2.0 · Cotizador (`clientela2/` → `cotiza/`) — 5 nov 2026
React + Vite + Tailwind aislado del resto; se publica en `/cotiza/` y no toca la app de la raíz.
- [x] Motor de cálculo (combustible, desgaste, tiempo, regreso vacío, rentabilidad neta) con pruebas (`npm test`).
- [x] Costos y tarifas (`#/app/settings`): gasolina, rendimiento, desgaste, banderazo, km, minuto, mínima, recargos, caseta habitual y metas $/km y $/h.
- [x] Cotizador público para Linktree (`#/`) con «Solicitar por WhatsApp»; las tarifas viajan en el enlace, costos y metas no.
- [x] Cotizador exprés (`#/app/manual`): ruta o km/min, ganancia neta privada, semáforo, ajustes y redondeo, WhatsApp / copiar / guardar.
- [x] Panel e historial (`#/app`, `#/app/historial`).
- [ ] Prueba en el teléfono (instalar, offline, enlace público en el Linktree).
- [ ] Decidir si la raíz del repo apunta al cotizador o se mantiene la app Clientela.
- [ ] Respaldo en la nube (Supabase) del historial y las tarifas.

## Pendientes sueltos
- [ ] Tu WhatsApp sigue en el historial de git (se borró del código). ¿Limpiar el historial?
- [ ] `cartera/` (versión 1) sigue publicada: ¿la redirigimos a `clientela/`?
- [x] Respaldo en Google Sheets reemplazado por Supabase (4 nov): se quitó `hoja.js` y `apps-script/`.
- [ ] Clave de Google Maps (opcional; hoy se usan mapas gratuitos).
