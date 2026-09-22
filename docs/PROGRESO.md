# Progreso del proyecto (frontend)

**Este archivo se lee al empezar cada tarea, así que se mantiene corto.** El detalle de las fases cerradas
está en `docs/historial/` y no hace falta leerlo para trabajar.

## Estado actual

| Fase | Estado |
|---|---|
| F0 · Fundamentos | cerrada |
| F1 · Sistema de diseño | cerrada |
| F2 · Cuenta y sesión | cerrada |
| F3 · Catálogo y búsqueda | cerrada |
| F4 · Página de producto | cerrada |
| **F5 · Carrito** | **cerrada** |
| F6 · Checkout y pagos | **desbloqueada**: se hace con la pasarela de prueba (sin dinero real) |
| F7 a F9 | pendientes (se avanza sin detenerse) |
| **F10 · Publicación** | **requiere al dueño**: elegir hosting y dominio tiene coste |

Último cierre verificado (F5): `lint` 0 · `typecheck` 0 · **253 pruebas unitarias** · **116 e2e** (115 en verde y
1 **omitida a propósito**: la fusión del carrito se comprueba una sola vez por corrida porque el backend limita
los intentos de entrada a 5 por minuto y por IP) · `build` 0 · capturas con datos reales en `docs/capturas/f5/`.
Repositorios **privados**: `joseggch15/marketplace-web` (frontend, rama `master`) y `joseggch15/ecommerceBackend`.

El detalle de la fase recién cerrada está en `docs/historial/f5-carrito.md`.

## Pendientes del backend

En `docs/PENDIENTES-BACKEND.md` (**15 apartados**). Los dos últimos son de la F5: el carrito no informa de stock
ni de cambios de precio (y acepta más unidades de las que hay) y el registro no devuelve tokens, así que la
fusión del carrito de invitado ocurre en el inicio de sesión. **Antes de la F6 hay que resolverlos en una tarea
dedicada del backend.**

## Decisiones vigentes

`docs/decisiones/` (notas cortas, una por decisión): 0001 versiones · 0002 paleta y contraste · 0003 BFF sin
tokens · 0004 idiomas y proxy · 0005 proxy de medios · 0006 tipos de la API · 0007 sistema de diseño ·
0008 autenticación y sesión · 0009 catálogo y búsqueda · 0010 página de producto · **0011 carrito**.

## Entorno local (recordatorio)

Backend en `E:\ecommerce` (se enciende y se apaga cuando hace falta) · datos de demostración con
`node scripts/seed-demo.mjs` · capturas con `pnpm capture` (con `--cart-variant=<uuid>` y `--cart-quantity=n` se
fotografía el carrito con líneas reales). **Las pruebas e2e del carrito necesitan el backend encendido y los
datos de demostración**: si falta el entorno, se omiten con un mensaje que lo explica.

## Fases 6 a 10 — pendientes

Checkout y pagos en sandbox (F6) · mis compras, seguimiento y devoluciones (F7) · panel del vendedor (F8) · panel
de administración (F9) · pulido, rendimiento, SEO y despliegue (F10).
