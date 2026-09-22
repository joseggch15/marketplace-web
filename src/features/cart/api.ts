import type { BackendResult } from "@/features/auth/api";
import { problemCode } from "@/features/auth/error-codes";
import { backend } from "@/lib/api/client";

import type { Cart, CartSnapshot, GuestTokenHeader } from "./types";

/**
 * Llamadas al carrito desde el **servidor** (rutas BFF). El navegador nunca llama a la API directamente.
 *
 * Dos cosas que hace este archivo y conviene entender:
 *
 * 1. **La respuesta trae el token del invitado.** El backend identifica el carrito de un invitado con la
 *    cabecera `X-Cart-Token` y, si no la recibe, genera un token y lo devuelve en esa misma cabecera. Aquí se
 *    lee junto con el carrito (`CartSnapshot`) para que la ruta BFF pueda guardarlo en una cookie httpOnly.
 *    Tras fusionar el carrito, el backend responde con la cabecera **vacía**: eso significa «borra el token».
 * 2. **Todos los endpoints devuelven el carrito completo.** El `subtotal` y la `currency` los calcula el
 *    servidor, así que el navegador nunca hace aritmética de dinero.
 */

const noStore = { cache: "no-store" } as const;

/** Cabecera con la que la API identifica el carrito del invitado. */
const CART_TOKEN_HEADER = "x-cart-token";

/** Forma mínima y tipada de lo que devuelve `openapi-fetch`. */
type Outcome = { data?: Cart; error?: unknown; response: Response };

/** Cabecera de autorización, o `undefined` para un invitado (que no debe mandarla). */
function authHeader(accessToken: string | null) {
  return accessToken === null ? undefined : { authorization: `Bearer ${accessToken}` };
}

/** Cabecera con el token del invitado. `null` = no mandar la cabecera (el backend generará un token). */
function cartTokenHeader(guestToken: string | undefined) {
  return { header: { "X-Cart-Token": guestToken ?? null } };
}

/** Lee en la respuesta qué hay que hacer con el token del invitado. */
export function guestTokenFrom(response: Response): GuestTokenHeader {
  const token = response.headers.get(CART_TOKEN_HEADER);

  if (token === null) {
    return { kind: "absent" };
  }

  return token.length === 0 ? { kind: "clear" } : { kind: "set", token };
}

/**
 * Convierte la respuesta en un resultado, sin lanzar excepciones nunca.
 *
 * Igual que en el resto del proyecto, un fallo de red se convierte en `{ ok: false, status: 0 }` para que la
 * ruta BFF responda con un problema claro en vez de romperse.
 */
async function toSnapshot(outcome: Promise<Outcome>): Promise<BackendResult<CartSnapshot>> {
  try {
    const { data, error, response } = await outcome;

    if (response.ok && data !== undefined) {
      return { ok: true, data: { cart: data, guestToken: guestTokenFrom(response) } };
    }

    return { ok: false, status: response.status, code: problemCode(error) };
  } catch {
    return { ok: false, status: 0, code: null };
  }
}

/** Carrito actual del usuario con sesión o del invitado (`GET /cart`). */
export function getCart(
  accessToken: string | null,
  guestToken: string | undefined,
): Promise<BackendResult<CartSnapshot>> {
  return toSnapshot(
    backend.GET("/api/v1/cart", {
      params: cartTokenHeader(guestToken),
      headers: authHeader(accessToken),
      ...noStore,
    }),
  );
}

/** Añade (o incrementa) una variante (`POST /cart/items`). */
export function addCartItem(
  accessToken: string | null,
  guestToken: string | undefined,
  input: { variantId: string; quantity: number },
): Promise<BackendResult<CartSnapshot>> {
  return toSnapshot(
    backend.POST("/api/v1/cart/items", {
      params: cartTokenHeader(guestToken),
      headers: authHeader(accessToken),
      body: { variant_id: input.variantId, quantity: input.quantity },
      ...noStore,
    }),
  );
}

/** Cambia la cantidad de una línea (`PATCH /cart/items/{variant_id}`). */
export function updateCartItemQuantity(
  accessToken: string | null,
  guestToken: string | undefined,
  variantId: string,
  quantity: number,
): Promise<BackendResult<CartSnapshot>> {
  return toSnapshot(
    backend.PATCH("/api/v1/cart/items/{variant_id}", {
      params: { ...cartTokenHeader(guestToken), path: { variant_id: variantId } },
      headers: authHeader(accessToken),
      body: { quantity },
      ...noStore,
    }),
  );
}

/** Quita una línea (`DELETE /cart/items/{variant_id}`). */
export function removeCartItem(
  accessToken: string | null,
  guestToken: string | undefined,
  variantId: string,
): Promise<BackendResult<CartSnapshot>> {
  return toSnapshot(
    backend.DELETE("/api/v1/cart/items/{variant_id}", {
      params: { ...cartTokenHeader(guestToken), path: { variant_id: variantId } },
      headers: authHeader(accessToken),
      ...noStore,
    }),
  );
}

/** Vacía el carrito (`DELETE /cart`). */
export function clearCart(
  accessToken: string | null,
  guestToken: string | undefined,
): Promise<BackendResult<CartSnapshot>> {
  return toSnapshot(
    backend.DELETE("/api/v1/cart", {
      params: cartTokenHeader(guestToken),
      headers: authHeader(accessToken),
      ...noStore,
    }),
  );
}

/**
 * Fusiona el carrito del invitado con el del usuario (`POST /cart/merge`).
 *
 * Requiere sesión (por eso `accessToken` no puede ser `null`) y el token del invitado en la cabecera. La
 * respuesta trae la cabecera del token **vacía**, que es como el backend dice «el carrito de invitado ya no
 * existe»: quien llame a esto debe borrar la cookie.
 */
export function mergeCart(
  accessToken: string,
  guestToken: string,
): Promise<BackendResult<CartSnapshot>> {
  return toSnapshot(
    backend.POST("/api/v1/cart/merge", {
      params: cartTokenHeader(guestToken),
      headers: authHeader(accessToken),
      ...noStore,
    }),
  );
}
