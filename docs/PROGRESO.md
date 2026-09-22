# Progreso del proyecto (frontend)

**Este archivo se lee al empezar cada tarea, así que se mantiene corto.** El detalle de las fases cerradas
está en `docs/historial/` y no hace falta leerlo para trabajar.

## Condiciones del dueño (vigentes)

- **Alcance de prototipo**: solo lo esencial de cada fase, con datos reales. Lo que no está en la lista se
  apunta en `docs/IDEAS.md` y **no se construye**.
- **Ahorro**: e2e solo de los flujos críticos, `axe` solo en páginas nuevas, capturas de páginas nuevas a
  375/1280 px **solo en modo claro**, y se reutilizan los componentes existentes.
- La **F10** es solo preparación (auditoría + una e2e del recorrido completo + `docs/PUBLICAR.md`): **no se crea
  ninguna cuenta, no se publica nada y no se gasta dinero**.

## Estado actual

| Fase | Estado |
|---|---|
| F0 · Fundamentos | cerrada |
| F1 · Sistema de diseño | cerrada |
| F2 · Cuenta y sesión | cerrada |
| F3 · Catálogo y búsqueda | cerrada |
| F4 · Página de producto | cerrada |
| F5 · Carrito | cerrada |
| **Portada real** | **hecha** (`docs/decisiones/0012-portada.md`) |
| **F6 · Checkout y pagos** | **código hecho y probado a mano contra el backend** (`docs/decisiones/0013-checkout.md`); faltan las e2e y las capturas |
| **F7 · Mis compras** | **código hecho** (lista, detalle, cancelar y reseñar); faltan e2e, capturas y los enlaces de entrada |
| F8 · Panel del vendedor | pendiente (el plan y los endpoints exactos están en `docs/SIGUIENTE-PROMPT.md`) |
| F9 · Panel de administración | pendiente (la API no tiene listado de usuarios ni moderación de preguntas) |
| F10 · Preparación para publicar | pendiente (auditoría + `docs/PUBLICAR.md`) |

Verificación de esta tanda: `lint` 0 · `typecheck` 0 · **283 pruebas unitarias** (264 + 19 nuevas de pedidos). Las
pruebas e2e y el `build` se ejecutan al cerrar F6/F7 (es lo primero de la próxima tarea).

Se probó **a mano, contra el backend real y a través del BFF**, el camino completo de compra: iniciar sesión →
carrito → `POST /api/orders` (201) → `POST /api/orders/{id}/payments` (pasarela `sandbox`) →
`POST /api/payments/{id}/simulate` (aprobado, el pago pasa a `succeeded` y la orden a `paid`) →
`/es/orders/{id}` (200 con seguimiento y totales) → `/es/orders` (200, el pedido aparece en la lista).

## La lista de pendientes del backend está CERRADA

`docs/PENDIENTES-BACKEND.md` no tiene nada abierto: los 12 apartados están resueltos y los dos descartados por
decisión del dueño. La última tanda del backend (22/09/2026, decisión **0023**) añadió: registro con sesión
iniciada, `sold_count`, el listado público del catálogo y el interruptor `REQUIRE_VERIFIED_EMAIL` (apagado).

## Decisiones vigentes

`docs/decisiones/`: 0001 versiones · 0002 paleta · 0003 BFF sin tokens · 0004 idiomas y proxy · 0005 proxy de
medios · 0006 tipos de la API · 0007 sistema de diseño · 0008 autenticación · 0009 catálogo · 0010 producto ·
0011 carrito · 0012 portada · **0013 checkout y pago de prueba**.

## Entorno local (recordatorio)

Backend en `E:\ecommerce` (se enciende y se apaga cuando hace falta; PostgreSQL en 5433 y Redis en 6379) ·
datos de demostración con `node scripts/seed-demo.mjs` · capturas con `pnpm capture --out=docs/capturas/fN
--route=/es/...` · vista previa del dueño en el 3001.

