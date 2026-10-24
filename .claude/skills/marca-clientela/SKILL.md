---
name: marca-clientela
description: Identidad de marca de Clientela v1 (18 oct 2026, familia Checa): logo de la tarjeta de contacto con la luz verde y ✓, lema «Tus clientes, en orden», asfalto + hueso, color que habla de la lana (verde cobrado, amarillo te debe, rojo atrasado), Bricolage Grotesque / DM Sans / JetBrains Mono, voz y tono, recursos, tarjeta digital y firma de familia. Úsala SIEMPRE que haya que diseñar, escribir o revisar algo con la marca de Clientela (la app para que los conductores gestionen sus clientes privados): logo, colores, app, web, portadas, videos, redes o textos de venta. La fuente única es la carpeta marca/ de este repo (jeal1498/PWA-Clientela).
---

# Marca Clientela (v1)

## Dónde está la marca
**Fuente única: `marca/`** — `README.md`, `tokens.json`, `tokens.css`, `logo-*.svg`, `simbolo*.svg`, `icono-app.svg`, `icono-maskable.svg`, `png/` y `fonts/`.
1. Lee `marca/README.md` y `marca/tokens.json` antes de diseñar o escribir; si difieren de este resumen, manda `marca/`.
2. **No dupliques la marca**: la app, la web y los videos cargan `marca/tokens.css` y los SVG de ahí (o copias generadas por un script, nunca valores escritos a mano).
3. Si la marca cambia, se edita en `marca/` y se actualiza este resumen.
4. Láminas aprobadas: https://claude.ai/artifact/SwF2P53ZQBTpXnVZCQqzqL

## Resumen (por si no hay acceso; manda `marca/`)
- **Familia Checa:** mismo asfalto, hueso, letras, voz, raya de carretera y tres puntos. Lo propio: el símbolo y el significado del color. Firma «de la familia Checa» en la web y la pantalla final de los videos; no en la app.
- **Logo:** tarjeta de contacto oscura (`#222826`, borde `#3A423F`) con la luz verde `#22C55E` y su ✓ `#04210F` a la izquierda y dos renglones (hueso y `#5A625F`) + «Clientela» en Bricolage 800. Espacio libre = ancho de la luz; mínimo 32 px (completo) y 24 px (símbolo). No estirar, girar, recolorear, sombrear ni fundir con el semáforo de Checa.
- **Lema:** «Tus clientes, en orden.»
- **Color (habla de la lana):** verde `#22C55E` cobrado · amarillo `#FACC15` te debe (< 15 días) · rojo `#EF4444` atrasado (≥ 15 días sin pagar) o cancelado. Texto encima: `#04210F`, `#2B2200`, `#1F0000`. Agendado/confirmado en hueso. Base: asfalto `#0C0C10`, tablero `#16161C`, hueso `#F4F4EF`, humo `#3A3A45`, gris `#A3A3AD`. WhatsApp en hueso, nunca con su verde ni su logo.
- **Letras:** Bricolage Grotesque 800 (títulos ≥ 22 px y montos), DM Sans (texto), JetBrains Mono (horas, km, etiquetas). Escala 34/22/16/14/12. Radios 28/20/píldora; toque mín. 48; íconos de línea trazo 2.2.
- **Voz:** de tú, directa, de compañero («Te deben $1,450 de 3 clientes»). Mensajes al cliente: amables, claros y firmados por el conductor. Palabras: clientes, viajes, cotizar, te deben, cobrar, agenda, lana, tu tarifa. Nunca: promesas de ganancia, tecnicismos (PWA, base de datos, sincronizar), ciudad o país, competencia, regaños por cobrar.
- **Uber y DiDi:** sin sus logos ni colores. En marketing: «cuando te piden tu número», nunca «saca pasajeros de Uber/DiDi» (pueden castigar al conductor).
- **Recursos:** raya de carretera, sellos inclinados «Cobrado»/«Te debe», tres puntos, botón principal en píldora hueso y secundario con contorno humo.
- **Movimiento:** la luz se enciende y se dibuja la ✓ en 1.2 s, `cubic-bezier(.2,.8,.2,1)`, sin rebote; con «reducir movimiento», nada.
- **Tarjeta digital:** «Mi tarjeta» muestra un QR grande (la app lo genera); quien lo escanea ve la página del conductor (guardar contacto, pedir viaje por WhatsApp, auto, horario y precios opcionales; placas nunca). El conductor es el protagonista; abajo «Hecho con Clientela».
- **Números y nombres de ejemplo** siempre marcados como ejemplo; nunca datos reales de Eduardo en el repo (es público).

## Estado
- Aprobada por Eduardo el 18 oct 2026 (logo A, lema, colores y firma de familia). Aún no se aplica a la app (paso 4), la web (paso 7) ni los videos (paso 8).
