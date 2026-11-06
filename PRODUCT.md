# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Conductores independientes en México (el primero es Eduardo, «Lalo») que atienden clientes privados por fuera de Uber/DiDi. Usan la app entre viajes, casi siempre en el coche y con una mano. Su trabajo: cotizar, agendar, avisar y cobrar a sus clientes de confianza.

## Product Purpose
Clientela mantiene en orden a los clientes privados de un conductor: cotizar, agendar viajes (también frecuentes), recordar por WhatsApp, cobrar y ver cuánto le deben. Éxito: el conductor sabe a quién le toca hoy y quién le debe, sin libreta ni mensajes perdidos. Lema: «Tus clientes, en orden».

## Positioning
Agenda y cobros en una sola herramienta para clientes privados, sin comisión. Una libreta, WhatsApp o un CRM genérico no cotizan con tarifa de conductor, no marcan quién debe ni cuántos días de atraso, ni dan al cliente una página para pedir el viaje.

## Operating Context
PWA instalable (React + Vite, `clientela2/`) publicada en GitHub Pages, con APK (TWA). Datos en `localStorage`; la nube y el login con Google están en v1 y faltan en 2.0. Uso en el coche, con una mano, a pleno sol o de noche y con conexión irregular. Los avisos y propuestas salen por WhatsApp. Moneda MXN.

## Capabilities and Constraints
- Cotizador estilo app de viaje, agenda, cobros («Te deben», rojo desde 15 días), bitácora, resumen, gastos, clientes, landing pública para pedir viaje, SOS.
- Debe funcionar sin internet.
- Repo público: sin datos personales en el código.
- Pendiente (no decidido en diseño): login con Google y nube en 2.0, moneda, gasolina.
- Español (México).

## Brand Commitments
Familia Checa. Logo A (tarjeta de contacto con luz verde y ✓), lema «Tus clientes, en orden». Semáforo: verde cobrado, amarillo te debe, rojo atrasado. Fuente única en `marca/` (tokens, SVG, fuentes); la app carga `marca/tokens.css`. Firma «de la familia Checa» solo en web y videos. Skill `marca-clientela`.

## Evidence on Hand
Contexto de producto en `.agents/product-marketing.md`; láminas de marca en `marca/`. No hay testimonios ni métricas reales: no inventarlos.

## Product Principles
1. La acción del momento primero: pocos pasos, un toque cuando se pueda.
2. El estado del dinero se lee de un vistazo (verde, amarillo, rojo).
3. Funciona con una mano, al sol y sin conexión.
4. Gratis por ahora para recibir comentarios; sin ciudad ni país en la marca.
5. Menos es más: lo secundario no estorba lo cobrable.

## Accessibility & Inclusion
Uso con una mano en el coche: objetivos táctiles grandes. Legible a pleno sol y de noche: contraste alto. Offline obligatorio (PWA).
