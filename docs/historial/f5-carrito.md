# Fase 5 · Carrito

- **Fecha de cierre:** 22 de septiembre de 2026
- **Estado:** cerrada

## Qué se construyó

- **`src/features/cart/`**: `api.ts` (llamadas del servidor a la API, con el token de invitado y la lectura de la
  cabecera `X-Cart-Token`), `session.ts` (cookie httpOnly `mv_cart`, ejecución de operaciones con sesión o como
  invitado y fusión del carrito), `bff.ts` (respuesta común de las rutas), `schemas.ts` (validación Zod),
  `error-codes.ts` (traducción por `code`), `selectors.ts` (funciones puras y optimistas, sin aritmética de
  dinero), `client.ts` (cliente del navegador) y `hooks.ts` (TanStack Query con actualizaciones optimistas y
  reversión).
- **Rutas BFF:** `GET|DELETE /api/cart`, `POST /api/cart/items`, `PATCH|DELETE /api/cart/items/{variantId}`.
- **Fusión del carrito de invitado en el servidor:** `POST /api/auth/login` (tras crear la sesión) y
  `POST /api/auth/register` (llamada preparada; hoy no hay sesión, ver el apartado 15 de los pendientes).
- **Pantalla `/cart`** (`src/app/[locale]/cart/page.tsx` + `CartView`, `CartItemRow`): cantidad, quitar, vaciar y
  **cuatro estados** (cargando con esqueletos, vacío con acción sugerida, error con «Intentar de nuevo» y con
  líneas), `noindex`, importes del servidor y el botón de pago deshabilitado y explicado (F6).
- **Contador en la cabecera** (`CartCounter`): comparte caché con la página y el botón; no pide nada cuando el
  servidor ya sabe que el visitante no tiene carrito.
- **El botón «Agregar al carrito» de la ficha ya funciona**: pasa por `/api/cart/items`, avisa del éxito con un
  enlace al carrito y traduce los errores por su `code`.
- **i18n:** espacio `Cart` completo en español e inglés (incluido el plural del contador y de los artículos) y
  mensajes nuevos en `Product.buy`.
- **Capturas de esta fase con datos reales** en `docs/capturas/f5/` (el script de capturas acepta ahora
  `--cart-variant` para fotografiar el carrito con líneas reales).

## Decisiones

`docs/decisiones/0011-carrito.md`: cookie httpOnly del invitado, fusión en el servidor, optimismo sin aritmética
de dinero, añadir sin datos inventados y `/cart` como pantalla cliente.

## Pendientes que dejó la fase

- Apartado **14**: el carrito no informa de stock ni de cambios de precio (y `POST`/`PATCH` aceptan más unidades
  de las que hay); la línea tampoco recibe imagen ni atributos de la variante.
- Apartado **15**: el registro no devuelve tokens, así que la fusión del carrito ocurre en el inicio de sesión.
