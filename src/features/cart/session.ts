import { cookies } from "next/headers";

import type { BackendResult } from "@/features/auth/api";
import { readSessionTokens, withAccessToken } from "@/features/auth/session";
import { env } from "@/lib/env";

import { mergeCart } from "./api";
import type { Cart, CartOperation, CartSnapshot, GuestTokenHeader } from "./types";

/**
 * Identidad del carrito en el servidor (patrón BFF).
 *
 * El carrito de invitado se identifica con la cabecera `X-Cart-Token` de la API. Esa cabecera **no puede
 * vivir en el navegador** (`localStorage` está prohibido por las reglas del proyecto: es un identificador de
 * sesión, aunque no sea un token de usuario), así que se guarda en una cookie **httpOnly** que solo leen y
 * escriben las rutas BFF. El navegador no la ve nunca.
 *
 * Esa cookie es la que hace que un invitado conserve su carrito entre visitas, y la que se fusiona con su
 * carrito de usuario cuando inicia sesión (ver `mergeGuestCartIfSignedIn`).
 */

export const CART_COOKIE = "mv_cart";

/**
 * 7 días: el mismo tiempo que el backend guarda el carrito de un invitado
 * (`GUEST_CART_TTL_SECONDS` en `app/modules/cart/service.py`). Si aquí durara más, el usuario tendría una
 * cookie que apunta a un carrito que ya no existe.
 */
const CART_MAX_AGE = 7 * 24 * 60 * 60;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/** Token del carrito de invitado guardado en la cookie, o `undefined` si no hay. */
export async function readCartToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value;
}

/** Guarda (o renueva) el token del carrito de invitado. */
export async function saveCartToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, token, cookieOptions(CART_MAX_AGE));
}

/** Borra el token del carrito de invitado (tras fusionar o al cerrar sesión). */
export async function clearCartToken(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}

/**
 * Aplica lo que el backend dijo sobre el token del invitado.
 *
 * Se llama **después** de cada operación del carrito. Es importante respetar los tres casos: borrar la cookie
 * cuando el backend responde con la cabecera vacía es lo que evita que un carrito ya fusionado se vuelva a
 * fusionar (o que un invitado arrastre un carrito fantasma).
 */
export async function applyGuestToken(header: GuestTokenHeader): Promise<void> {
  if (header.kind === "set") {
    await saveCartToken(header.token);
  } else if (header.kind === "clear") {
    await clearCartToken();
  }
}

/**
 * Ejecuta una operación del carrito con la identidad correcta.
 *
 * - Invitado (sin access token): se llama a la API solo con el token de invitado; si no lo hay, la API genera
 *   uno y lo devuelve, y aquí se guarda en la cookie.
 * - Usuario con sesión: se usa `withAccessToken`, que renueva el access token si había caducado. Así el
 *   carrito de un usuario que lleva un rato navegando no falla por un token vencido hace un minuto.
 *
 * Solo puede llamarse desde rutas BFF: escribe cookies y eso necesita una respuesta donde hacerlo.
 */
export async function runCartOperation(
  operation: CartOperation,
): Promise<BackendResult<CartSnapshot>> {
  const guestToken = await readCartToken();
  const { access } = await readSessionTokens();

  const result =
    access === undefined
      ? await operation(null, guestToken)
      : await withAccessToken((accessToken) => operation(accessToken, guestToken));

  if (result.ok) {
    await applyGuestToken(result.data.guestToken);
  }

  return result;
}

/**
 * Fusiona el carrito de invitado con el del usuario que acaba de iniciar sesión.
 *
 * **Se llama desde el servidor** (rutas BFF de entrar y de registrarse), nunca desde el navegador: así
 * funciona aunque el usuario cierre la pestaña a mitad de camino y no depende de ningún efecto del cliente.
 *
 * Devuelve el carrito fusionado, o `null` si no había nada que fusionar (no hay sesión —caso del registro,
 * porque el backend no emite tokens al crear la cuenta— o no hay carrito de invitado).
 */
export async function mergeGuestCartIfSignedIn(): Promise<Cart | null> {
  const { access } = await readSessionTokens();
  const guestToken = await readCartToken();

  if (access === undefined || guestToken === undefined) {
    return null;
  }

  const result = await withAccessToken((accessToken) => mergeCart(accessToken, guestToken));

  if (!result.ok) {
    // Si la fusión falla, el carrito de invitado sigue intacto y su cookie también: no se pierde nada y se
    // volverá a intentar en el siguiente inicio de sesión.
    return null;
  }

  await applyGuestToken(result.data.guestToken);

  return result.data.cart;
}
