# Prompt: puente con Checa (ejecutar en este repo)

```
Lee CLAUDE.md, PLAN.md (etapas 4, 5 y 10) y el CLAUDE.md del repo jeal1498/APK-CHECA
(solo lectura: supabase/esquema.sql, Cuenta.kt, docs/web-y-ventas.md sección
"Pendientes de funciones nuevas").

Objetivo: Clientela y Checa comparten el proyecto de Supabase gqsadclvftkzwrihfipz y la
misma cuenta de Google. Hazlo en este orden, una etapa por vez, con commits pequeños, y
marca [x] en PLAN.md. Español, respuestas cortas. Sube CACHE en sw.js en cada cambio.

0. Pregunta a Eduardo (A o B) por el rediseño de pantallas pendiente
   (https://claude.ai/artifact/LNFP8ikEjpyCwYPuhnnphm) y no migres pantallas hasta que elija.
1. Esquema Supabase: en APK-CHECA/supabase/esquema.sql agrega (o deja el SQL listo para que
   Eduardo lo pegue en SQL Editor): perfil_conductor (user_id, moneda, símbolo, formato,
   tarifas, teléfono, ciudad, slug público), clientes, viajes_privados, contactos_sos,
   viajes_checa. RLS: cada usuario solo lee/escribe lo suyo; la tarjeta pública se lee por
   una función/vista que solo expone los campos de la tarjeta por slug. "Eliminar cuenta"
   de Checa debe borrar todo (cascade por user_id).
2. Login con Google obligatorio (misma cuenta que Checa; reutiliza la lógica de Cuenta.kt
   en JS, sin SDK). Subir solos los datos de localStorage "cartera" la primera vez y
   sincronizar clientes, viajes y ajustes. Si el esquema del paso 1 no está desplegado,
   avísalo y detente.
3. Moneda: selector (símbolo, formato, separadores) en Yo, guardado en perfil_conductor;
   reemplaza el MXN fijo en cotizar, cobros y mensajes.
4. Tarjeta con QR leyendo del perfil en la nube (tarjeta.html por slug), conservando el
   enlace #j… antiguo.
5. Leer el costo de gasolina de Checa (perfil_conductor) y mostrar "Te quedan $x" en cotizar.
6. Empaquetar APK (etapa 6 del plan) solo después del OK de Eduardo.

Reglas: repo público, ninguna clave secreta (la anon key sí puede ir, la seguridad es RLS);
sin build ni dependencias; maqueta antes de cualquier cambio grande; prueba con Playwright
a 390 px. Al terminar cada etapa, reporta y espera el OK.
```
