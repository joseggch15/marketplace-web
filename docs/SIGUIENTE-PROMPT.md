# Prompt de continuación — marketplace-api (frontend)

**El prototipo está terminado: F0 a F10 cerradas.** Este archivo ya no es un plan de trabajo, sino el punto de
partida por si el dueño quiere seguir. Las reglas del proyecto viven en `.clinerules` (léelo: no se repiten aquí) y
el estado final está en `docs/PROGRESO.md`, `docs/AUDITORIA.md` y `docs/decisiones/`.

---

## Qué queda hecho

Portada real · cuenta y sesión · catálogo y búsqueda · ficha de producto · carrito · checkout con pago de prueba ·
mis compras · **panel del vendedor** (tienda, productos con variantes e imágenes, stock y ventas con envíos) ·
**panel de administración** (aprobar tiendas, moderar reseñas y preguntas, ver usuarios) · recorrido completo
probado de punta a punta y **`docs/PUBLICAR.md`** con hosting, costos y pasos.

## Si se continúa, el orden recomendado

1. **Publicar en un entorno real** siguiendo `docs/PUBLICAR.md` (lo hace el dueño: crea las cuentas y paga). Antes
   de eso, girar los secretos respecto a los de desarrollo y activar copias de seguridad de la base de datos.
2. **Revisar con lector de pantalla** los flujos de compra y venta (lo único que no se puede automatizar) y pasar
   Lighthouse/PageSpeed sobre la URL pública. Lo pendiente está listado en `docs/AUDITORIA.md`.
3. **Cerrar la laguna del backend**: no hay listado de reseñas ocultas ni filtro de visibilidad en las reseñas, así
   que la moderación se limita a ocultar (`docs/PENDIENTES-BACKEND.md`). Con eso, la pantalla de reseñas tendría el
   mismo ciclo completo que la de preguntas.
4. **Mejoras del prototipo que se descartaron por alcance**: precios por presentación, edición de variantes,
   gráficos en el panel, reembolsos y notificaciones. Están en `docs/IDEAS.md` y **no se construyen** sin que el
   dueño lo pida.

## Arranque del entorno (recordatorio)

1. Backend en `E:\ecommerce`: `docker compose up -d` y `uv run uvicorn app.main:app` (PostgreSQL en 5433, Redis en
   6379).
2. Datos de demostración: `node scripts/seed-demo.mjs` (crea la vendedora `vendedor@tienda-demo.com`, la
   administradora `admin@tienda-demo.com`, las categorías con atributos y el catálogo).
3. Frontend: `pnpm dev -p 3001` para la vista del dueño. Las pruebas usan el **3000** con `pnpm build && pnpm
start`.
4. Suite completa: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`.
