import type { components } from "@/lib/api/schema";

/**
 * Tipos de la F5, tomados **siempre** del esquema generado desde el OpenAPI del backend (`pnpm api:types`).
 * No se escriben a mano: si la API cambia, cambian solos.
 *
 * Este es el único archivo de la feature que pueden importar los **componentes cliente**: solo contiene tipos
 * (se borran al compilar), así que no arrastra `@/lib/api/client`, que lanza un error si llega al navegador.
 */

export type Cart = components["schemas"]["CartOut"];
export type CartItem = components["schemas"]["CartItemOut"];

/**
 * Qué dice el backend sobre el token de invitado en la cabecera `X-Cart-Token` de **esa** respuesta.
 *
 * Son tres casos distintos y hay que distinguirlos para no borrar un carrito por error:
 *
 * - `absent`: no menciona la cabecera → se conserva la cookie que ya teníamos.
 * - `clear`: viene **vacía** → el carrito de invitado ya no existe (se fusionó) → se borra la cookie.
 * - `set`: viene con un token → es nuevo (se acaba de generar) o rotado → se guarda en la cookie.
 */
export type GuestTokenHeader =
  | { kind: "absent" }
  | { kind: "clear" }
  | { kind: "set"; token: string };

/** Resultado de una llamada al carrito: el carrito completo y qué hacer con la cookie del invitado. */
export type CartSnapshot = { cart: Cart; guestToken: GuestTokenHeader };

/**
 * Operación del carrito tal como la ejecutan las rutas BFF.
 *
 * `accessToken` es `null` para un invitado (el backend resuelve el carrito por el token de invitado) y el
 * token de invitado es `undefined` cuando todavía no hay cookie (el backend generará uno y lo devolverá).
 */
export type CartOperation = (
  accessToken: string | null,
  guestToken: string | undefined,
) => Promise<{ ok: true; data: CartSnapshot } | { ok: false; status: number; code: string | null }>;
