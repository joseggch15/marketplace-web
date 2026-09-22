# Progreso del proyecto (frontend)

**Este archivo se lee al empezar cada tarea, asi que se mantiene corto.** El detalle de las fases cerradas
esta en `docs/historial/` y no hace falta leerlo para trabajar.

## Estado actual

| Fase | Estado |
|---|---|
| F0 Â· Fundamentos | cerrada |
| F1 Â· Sistema de diseno | cerrada |
| F2 Â· Cuenta y sesion | cerrada |
| F3 Â· Catalogo y busqueda | cerrada |
| **F4 Â· Pagina de producto** | **siguiente** |
| F5 Â· Carrito | pendiente |
| F6 Â· Checkout y pagos | bloqueada: antes hay que resolver los pendientes del backend |
| F7 a F10 | pendientes |

Ultimo cierre verificado (F3 mas el endurecimiento del proxy): `lint` 0 Â· `typecheck` 0 Â· **155 pruebas** Â·
**92 e2e** Â· capturas con datos reales en `docs/capturas/f3/`. Repositorios **privados**:
`joseggch15/marketplace-web` (frontend, rama `master`) y `joseggch15/ecommerceBackend`.

Entorno local: backend en `E:\\ecommerce` (se puede encender y apagar), datos de demostracion con
`node scripts/seed-demo.mjs` (12 productos con variantes e imagenes) y capturas con `pnpm capture`.

## Pendientes del backend

En `docs/PENDIENTES-BACKEND.md` (9 apartados): URLs de imagen, pagos reales, conteos de faceta, catalogo de
codigos de error, envio de correos, decision sobre el correo verificado, reputacion en los resultados de
busqueda, claves de imagen sin punto y busqueda de producto por slug. **Antes de la F6 hay que resolverlos en
una tarea dedicada del backend.**

## Decisiones vigentes

`docs/decisiones/` (notas cortas, una por decision): 0001 versiones Â· 0002 paleta y contraste Â· 0003 BFF sin
tokens Â· 0004 idiomas y proxy Â· 0005 proxy de medios Â· 0006 tipos de la API Â· 0007 sistema de diseno Â·
0008 autenticacion y sesion Â· 0009 catalogo y busqueda.

## Fases 4 a 10 â€” pendientes

CatÃ¡logo y bÃºsqueda con filtros por faceta (F3) Â· pÃ¡gina de producto con variantes, preguntas y reseÃ±as (F4) Â·
carrito (F5) Â· checkout y pagos en sandbox (F6) Â· mis compras, seguimiento y devoluciones (F7) Â· panel del
vendedor (F8) Â· panel de administraciÃ³n (F9) Â· pulido, rendimiento, SEO y despliegue (F10).
