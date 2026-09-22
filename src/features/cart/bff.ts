import { NextResponse } from "next/server";

import { backendProblem, unauthorizedResponse } from "@/features/auth/bff";

import type { BackendResult } from "@/features/auth/api";
import type { CartSnapshot } from "./types";

/**
 * Respuesta de las rutas BFF del carrito.
 *
 * Las cuatro rutas (`/api/cart`, `/api/cart/items`, `/api/cart/items/[variantId]`) devuelven **el carrito
 * completo**, igual que la API: el navegador nunca calcula el subtotal ni la moneda.
 *
 * `cache-control: no-store` porque el carrito es de quien lo pide: ni el navegador ni ningún intermediario
 * deben guardarlo ni reutilizarlo para otra persona.
 *
 * Los errores se devuelven con el mismo formato que el resto del proyecto (Problem Details, RFC 9457) y con
 * el `code` estable de la API, para que el navegador lo traduzca.
 */
export function cartJson(result: BackendResult<CartSnapshot>): NextResponse {
  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json(result.data.cart, { headers: { "cache-control": "no-store" } });
}
