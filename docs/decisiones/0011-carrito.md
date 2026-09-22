# 0011 · Carrito (cookie httpOnly del invitado, fusión en el servidor y nada de dinero calculado en el navegador)

- **Fecha:** 22 de septiembre de 2026 (Fase 5)
- **Estado:** aceptada

## Contexto

La API del carrito (contratos tomados de `/openapi.json`, no escritos a mano) es esta:

```
GET    /api/v1/cart                    → CartOut   (usuario con sesión o invitado con X-Cart-Token)
POST   /api/v1/cart/items              → CartOut   (CartItemAdd {variant_id, quantity=1})
PATCH  /api/v1/cart/items/{variant_id} → CartOut   (CartItemUpdate {quantity})
DELETE /api/v1/cart/items/{variant_id} → CartOut
DELETE /api/v1/cart                    → CartOut   (vaciar)
POST   /api/v1/cart/merge              → CartOut   (requiere sesión)

CartOut     { items[], total_items, subtotal, currency }
CartItemOut { variant_id, sku, product_id, product_title, product_slug, store_id,
              unit_price, quantity, subtotal }
```

Cuatro hechos del backend condicionan el diseño:

1. **El invitado se identifica con la cabecera `X-Cart-Token`.** Si no la manda, la API **genera** un token y lo
   devuelve en esa misma cabecera. Es un identificador de carrito, no un token de usuario, pero sigue siendo un
   dato de sesión: guardarlo en el navegador va contra la regla de la casa.
2. **Al fusionar, la API responde con la cabecera `X-Cart-Token` vacía**, que es su forma de decir «el carrito de
   invitado ya no existe».
3. **El carrito no informa de stock ni de cambios de precio**: `CartItemOut` trae el precio *actual* de la
   variante y nada más, y `POST /cart/items` acepta hasta 100 unidades sin comprobar el inventario. Apartado 14
   de `docs/PENDIENTES-BACKEND.md`.
4. **El registro no devuelve tokens** (`POST /auth/register` responde `UserOut`), así que al crear la cuenta
   todavía no hay sesión con la que fusionar nada. Apartado 15.

## Decisión

1. **El token del invitado vive en una cookie `httpOnly` (`mv_cart`)**, que solo leen y escriben las rutas BFF.
   `SameSite=Lax`, `Secure` en producción y **7 días**, exactamente el TTL del carrito de invitado del backend
   (`GUEST_CART_TTL_SECONDS`): una cookie más larga apuntaría a un carrito que ya no existe. El navegador no ve
   el token ni puede pedirlo: no hay ninguna ruta que lo devuelva.
2. **La fusión del carrito de invitado ocurre en el servidor, dentro de la propia petición de inicio de sesión**
   (`POST /api/auth/login` → `startSession()` → `mergeGuestCartIfSignedIn()`). No hay ningún `useEffect` ni
   ninguna llamada desde el navegador: si el usuario cierra la pestaña justo después de entrar, el carrito ya
   está fusionado. La misma función se llama en `POST /api/auth/register`, donde hoy **no hace nada** (no hay
   sesión todavía) pero deja el camino hecho para cuando el backend emita tokens al registrar (apartado 15). Lo
   que sí garantiza el registro es que **la cookie no se toca**: el carrito del invitado sigue ahí y se fusiona
   en el inicio de sesión, que es el paso siguiente del flujo.
3. **Actualizaciones optimistas donde se pueden hacer sin inventar datos:** cambiar la cantidad, quitar una línea
   y vaciar se ven al instante (cantidad, desaparición de la línea) y se **revierte** si el servidor falla.
   Mientras hay una operación en vuelo, los **importes se marcan como «pendientes»** y no se recalculan: el
   navegador nunca suma dinero, solo formatea lo que devuelve el servidor (regla del proyecto). Por eso
   `selectors.ts` solo toca cantidades (enteros) y deja `unit_price`, `subtotal` y el subtotal del carrito tal
   como llegaron.
4. **Añadir al carrito no es optimista.** El navegador no conoce el título, el SKU, el precio ni el subtotal de
   la línea nueva (los pone el backend), así que insertar una línea «provisional» sería enseñar datos falsos. El
   botón muestra «Agregando…» y, al confirmar, el contador y el enlace «Ver el carrito» usan **la respuesta real
   del servidor**.
5. **El contador de la cabecera es un componente cliente que comparte la caché de TanStack Query con la página
   y con el botón** (`cartKey`). Si el servidor ya sabe que este visitante no tiene carrito (sin sesión y sin
   cookie de invitado), el contador nace **desactivado** y no gasta ninguna petición; si luego agrega algo, la
   mutación escribe en la misma caché y el contador se actualiza igual.
6. **`/cart` es un componente cliente y `noindex`.** Toda la pantalla es interactiva, el carrito de una persona
   no tiene valor para los buscadores y renderizarla en el servidor obligaría a pedir el carrito dos veces (una
   en el servidor y otra en el navegador). Tiene sus **cuatro estados**: cargando (esqueletos con la forma
   final), vacío (con acción sugerida), error (explicado y con «Intentar de nuevo») y con líneas.
7. **La línea no promete lo que la API no dice.** Se muestra SKU, precio actual y subtotal del servidor. No se
   enseña foto ni color/talla (no vienen), y **no** se avisa de «queda poco» ni de «cambió el precio»: eso
   requeriría inventarlo. Está pedido en el apartado 14, con la propuesta concreta de campos para la API.
8. **Los errores se traducen por el `code` estable** (RFC 9457) con la lista de códigos del carrito
   (`insufficient_stock`, `variant_not_found`, `quantity_limit_exceeded`, `cart_token_required`…). El botón de
   pagar queda **deshabilitado y explicado**: el pago es la F6 y un botón que no hace nada y no lo dice sería
   mentir al usuario.

## Alternativas descartadas

- **Guardar el token de invitado en `localStorage`.** Descartada: es un identificador de sesión y las reglas del
  proyecto prohíben el almacenamiento de sesión en el navegador (`localStorage` queda solo para preferencias
  como el tema).
- **Fusionar el carrito en el navegador** (un `useEffect` tras el login, o llamando a `/cart/merge` desde un
  componente cliente). Descartada: el carrito se perdería si el usuario cierra la pestaña o si el JavaScript
  falla, y expondría el token del invitado al navegador. La fusión en la petición de entrar no tiene ninguno de
  los dos problemas.
- **Iniciar sesión automáticamente al registrarse para poder fusionar ahí mismo** (un `login` interno con las
  credenciales recién recibidas, sin guardar cookies). Tentadora, pero: consume el cupo de intentos de entrada
  del backend (5 por minuto y por IP), emite tokens que nadie va a usar y cambia el flujo de la F2, que dice
  claramente «no se inicia sesión al crear la cuenta». Se prefiere pedirle al backend que devuelva tokens en el
  registro (apartado 15) en vez de rodear la limitación desde el frontend.
- **Recalcular el subtotal de la línea en el navegador para dar un cambio optimista «completo».** Descartada por
  la regla de dinero del proyecto: el monto lo calcula siempre el servidor. La interfaz marca los importes como
  pendientes en lugar de enseñar una cifra que podría no ser la que se cobrará.
- **Pedir el inventario de cada variante para mostrar «stock» o deshabilitar el botón de subir cantidad.**
  Descartada: serían N peticiones por vista del carrito y, además, el inventario de la variante no es lo que el
  carrito va a validar cuando exista esa validación (apartado 14); mostrar un número que el carrito no usa
  sería engañoso.
- **Renderizar el carrito en el servidor.** Descartada por coste sin beneficio: no hay SEO que ganar y habría
  que pedir el carrito dos veces.

## Consecuencias

- `src/features/cart/` pasa a ser la tercera feature con BFF propio (tras `auth` y `product`), y
  `src/lib/api/bff-client.ts` sigue siendo la única llamada del navegador a nuestras rutas.
- `withAccessToken` (F2) se reutiliza sin cambios para el carrito: el «carrito completo + qué hacer con la
  cookie» viaja dentro del resultado de la operación, así que no hubo que duplicar la lógica de renovación.
- Cuando el backend informe de stock y de cambios de precio (apartado 14), la línea del carrito podrá avisar
  («ya no quedan unidades», «el precio cambió desde que lo agregaste») sin cambiar nada de lo decidido aquí.
- Cuando el registro devuelva tokens (apartado 15), la fusión en el registro empezará a funcionar sola: la
  llamada ya está puesta en `POST /api/auth/register`.
- Las pruebas end-to-end del carrito son las **primeras que necesitan el backend encendido y los datos de
  demostración** (`node scripts/seed-demo.mjs`): descubren una variante con stock real preguntando a la API y se
  omiten con un mensaje claro si falta el entorno. La fusión se comprueba una sola vez por corrida, porque el
  backend limita los intentos de entrada a 5 por minuto y por IP.
