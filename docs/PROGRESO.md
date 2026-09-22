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
| **F5 · Carrito** | **siguiente** (aprobada) |
| F6 · Checkout y pagos | bloqueada: antes hay que resolver los pendientes del backend |
| F7 a F10 | pendientes |

Último cierre verificado (F4): `lint` 0 · `typecheck` 0 · **231 pruebas** · **108 e2e** · capturas con datos
reales en `docs/capturas/f4/`. Repositorios **privados**: `joseggch15/marketplace-web` (frontend, rama
`master`) y `joseggch15/ecommerceBackend`.

Entorno local: backend en `E:\ecommerce` (se puede encender y apagar), datos de demostración con
`node scripts/seed-demo.mjs` (12 productos con variantes e imágenes) y capturas con `pnpm capture`.

## Pendientes del backend

En `docs/PENDIENTES-BACKEND.md` (13 apartados). Los cuatro últimos son de la F4: valores de atributo y stock
en las variantes, datos públicos de la tienda y del envío, paginación de las preguntas y un listado completo
del catálogo para el sitemap. **Antes de la F6 hay que resolverlos en una tarea dedicada del backend.**

## Decisiones vigentes

`docs/decisiones/` (notas cortas, una por decisión): 0001 versiones · 0002 paleta y contraste · 0003 BFF sin
tokens · 0004 idiomas y proxy · 0005 proxy de medios · 0006 tipos de la API · 0007 sistema de diseño ·
0008 autenticación y sesión · 0009 catálogo y búsqueda · 0010 página de producto.

## Fases 5 a 10 — pendientes

Carrito (F5) · checkout y pagos en sandbox (F6) · mis compras, seguimiento y devoluciones (F7) · panel del
vendedor (F8) · panel de administración (F9) · pulido, rendimiento, SEO y despliegue (F10).
