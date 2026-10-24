# Identidad de marca Clientela v1

**Fuente única de la marca.** Vive aquí (`marca/` del repo `jeal1498/PWA-Clientela`). La app (Clientela), el APK, la web y los videos la leen de aquí; no llevan copias propias con otros valores. Aprobada por Eduardo el 18 oct 2026. Láminas: artifact «Clientela: identidad de marca» (https://claude.ai/artifact/SwF2P53ZQBTpXnVZCQqzqL).

**Familia Checa.** Comparte con Checa (repo `jeal1498/checa-web`, carpeta `marca/`) el asfalto, el hueso, las letras, la voz, la raya de carretera y los tres puntos. Lo propio: el símbolo de la tarjeta y el significado del color.

- **Nombre y lema:** Clientela · «Tus clientes, en orden.»
- **Logo (opción A, tarjeta de contacto):** tarjeta oscura con la luz verde de Checa y su ✓ (el cliente palomeado) y dos renglones. SVG: `logo-*.svg` (símbolo + «Clientela»: oscuro, claro, una tinta negra y blanca), `simbolo*.svg`, `icono-app.svg` (esquinas redondeadas) e `icono-maskable.svg` (fondo completo, símbolo en la zona segura para Android).
- **Texto del logo:** los SVG llaman a *Bricolage Grotesque 800*; si no está, cae a Arial Black. Para imprenta, convertir el texto a trazos.
- **Reglas del logo:** espacio libre = ancho de la luz verde; mínimo 32 px completo y 24 px el símbolo; luz siempre verde con ✓; no estirar, girar, recolorear ni poner sombras; nunca fundirlo con el semáforo de Checa.
- **Color (habla de la lana):** verde `#22C55E` = cobrado; amarillo `#FACC15` = te debe (menos de 15 días); rojo `#EF4444` = atrasado (más de 15 días sin pagar) o cancelado. Agendado y confirmado van en hueso. Base: asfalto `#0C0C10`, tablero `#16161C`, hueso `#F4F4EF`, humo `#3A3A45`, gris de texto `#A3A3AD`. Botones de WhatsApp en hueso, nunca en el verde de WhatsApp.
- **Letras:** Bricolage Grotesque 800 (títulos ≥ 22 px y montos), DM Sans (texto), JetBrains Mono (horas, km, etiquetas). En `fonts/` (woff2 autohospedadas, licencia SIL OFL; las mismas de `checa-web/fonts/`). Escala 34/22/16/14/12.
- **Medidas:** radios 28/20 y píldora; toque mínimo 48 px; íconos de línea con trazo 2.2.
- **Voz:** la app te habla de tú, directa, de compañero («Te deben $1,450 de 3 clientes»). Los mensajes al cliente van con el nombre del conductor: amables y claros. Nunca promesas de ganancia, tecnicismos, ciudad o país, nombres de competencia ni regaños por cobrar. En marketing: «cuando te piden tu número», nunca «saca pasajeros de Uber/DiDi».
- **Recursos:** raya de carretera (de Checa), sellos inclinados «Cobrado» y «Te debe», tres puntos de la familia, botones en píldora hueso.
- **Movimiento:** la luz se enciende y se dibuja la ✓ en 1.2 s, curva `cubic-bezier(.2,.8,.2,1)`, sin rebote; con «reducir movimiento», sin animación.
- **Tarjeta digital:** el QR que genera la app abre la página del conductor; su nombre es el protagonista y Clientela firma abajo («Hecho con Clientela»).
- **Firma de familia:** «de la familia Checa» va en la web y en la pantalla final de los videos (no en la app).
- **Tokens:** `tokens.json` y `tokens.css` (incluye los `@font-face`).
- **PNG:** `png/icono-app-32|180|192|512.png` y `png/icono-maskable-192|512.png`, generados de los SVG con Chromium.
- **Pendiente:** sonidos (se pueden heredar de `checa-web/marca/sonido/`), `colors-android.xml` si el APK lo necesita.
