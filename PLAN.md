# Plan de Clientela

Se actualiza en cada avance: `[x]` hecho, `[ ]` pendiente. Última actualización: 24 oct 2026.

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
- [ ] Nuevo acomodo de pantallas: dos direcciones en https://claude.ai/artifact/LNFP8ikEjpyCwYPuhnnphm (A línea del día, B un solo foco). Esperando que Eduardo elija; no se toca el código hasta entonces. Resumen, Yo, Mi tarjeta y arranque quedan igual por ahora.

### 5. Acceso con Google y nube
- [ ] Maqueta de la pantalla de acceso.
- [ ] Decidir: mismo proyecto de Supabase de Checa o uno nuevo.
- [ ] Acceso obligatorio con Google, como Checa.
- [ ] Subir solos los datos del teléfono la primera vez.
- [ ] Sincronizar clientes, viajes y ajustes.
- [ ] Prueba de punta a punta.

### 6. APK
- [ ] Elegir cómo empaquetar: TWA (Bubblewrap) o Capacitor.
- [ ] Compilar con GitHub Actions como `build.yml` de Checa (si el push de `.github/workflows/` se rechaza, Eduardo lo sube a mano).
- [ ] Firma para que las actualizaciones se instalen encima.
- [ ] Release con link directo al APK.
- [ ] Prueba en el teléfono.

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

## Pendientes sueltos
- [ ] Tu WhatsApp sigue en el historial de git (se borró del código). ¿Limpiar el historial?
- [ ] `cartera/` (versión 1) sigue publicada: ¿la redirigimos a `clientela/`?
- [ ] Clave de Google Maps (opcional; hoy se usan mapas gratuitos).
