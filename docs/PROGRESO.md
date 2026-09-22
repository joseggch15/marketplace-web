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

| Fase                            | Estado                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| F0 · Fundamentos                | cerrada                                                                                           |
| F1 · Sistema de diseño          | cerrada                                                                                           |
| F2 · Cuenta y sesión            | cerrada                                                                                           |
| F3 · Catálogo y búsqueda        | cerrada                                                                                           |
| F4 · Página de producto         | cerrada                                                                                           |
| F5 · Carrito                    | cerrada                                                                                           |
| **Portada real**                | **hecha** (`docs/decisiones/0012-portada.md`)                                                     |
| **F6 · Checkout y pagos**       | **cerrada**: e2e, `axe` y capturas (`docs/decisiones/0015-e2e-de-la-compra.md`)                   |
| **F7 · Mis compras**            | **cerrada**: e2e, `axe`, capturas y enlace de entrada desde `/account`                            |
| F8 · Panel del vendedor         | **en curso**: base de lógica y validación hecha (35 pruebas nuevas); faltan rutas BFF y pantallas |
| F9 · Panel de administración    | pendiente (la API ya tiene listado de usuarios y moderación de preguntas)                         |
| F10 · Preparación para publicar | pendiente (auditoría + `docs/PUBLICAR.md`)                                                        |

Verificación de esta tanda: `format:check` 0 · `lint` 0 (con 1 aviso previo de react-hook-form) · `typecheck` 0 ·
**318 pruebas unitarias** · `build` 0 · **e2e de la compra: 7 pasan, 1 omitida, 0 fallan** (escritorio y móvil).

## Las e2e encontraron tres fallos reales de la F6 (ya arreglados)

1. **`MISSING_MESSAGE: Checkout (es)`**: el layout solo manda al navegador una **lista blanca** de espacios de
   mensajes (para no enviar JavaScript de más) y le faltaban `Checkout` y `Orders`; la pantalla del checkout no se
   renderizaba. Si se añade un componente cliente con un espacio nuevo, hay que añadirlo ahí.
2. **La dirección se enviaba vacía a quien no tenía direcciones guardadas**: el formulario se pintaba, pero sus
   valores solo se leían si el comprador marcaba «usar otra dirección»; el backend respondía **422**.
3. **Al crear el pedido, el checkout colapsaba a «tu carrito está vacío»** (el backend vacía el carrito al crear
   el pedido) y el pago era **imposible de terminar desde la interfaz**. Ahora se pinta una copia del carrito tal
   como estaba al crear el pedido.

Los tres se habían escapado porque la comprobación a mano de la F6 se hizo **contra la API**, no con el checkout
abierto en el navegador. Detalle completo en `docs/decisiones/0015-e2e-de-la-compra.md`.

## La lista de pendientes del backend está CERRADA

`docs/PENDIENTES-BACKEND.md` no tiene nada abierto: los 12 apartados están resueltos y los dos descartados por
decisión del dueño. Los tipos de la API están regenerados con `pnpm api:types`, así que ya incluyen lo que
necesitan la F8 y la F9 (stock de las variantes por su vendedor, directorio de usuarios y moderación de preguntas).

## Decisiones vigentes

`docs/decisiones/`: 0001 versiones · 0002 paleta · 0003 BFF sin tokens · 0004 idiomas y proxy · 0005 proxy de
medios · 0006 tipos de la API · 0007 sistema de diseño · 0008 autenticación · 0009 catálogo · 0010 producto ·
0011 carrito · 0012 portada · 0013 checkout y pago de prueba · **0014 formato con Prettier** · **0015 e2e de la
compra**.

## Entorno local (recordatorio)

Backend en `E:\ecommerce` (se enciende y se apaga cuando hace falta; PostgreSQL en 5433 y Redis en 6379) ·
datos de demostración con `node scripts/seed-demo.mjs` · capturas con `pnpm capture --out=docs/capturas/fN
--route=/es/... [--session=demo]` · vista previa del dueño en el 3001.

**Antes de una tanda con `build`:** el servidor de desarrollo (`pnpm dev -p 3001`) y el de producción comparten
la carpeta `.next`, así que **compilar con la vista previa encendida deja artefactos mezclados** y las pruebas
empiezan a fallar por cosas raras (pasó de verdad: `MISSING_MESSAGE` y un 500 en el carrito). La receta que
funciona: **detener el 3001, borrar `.next`, `pnpm build`, `pnpm start` en el 3000** para probar y, al terminar,
volver a levantar el 3001.
