import type { NextResponse } from "next/server";

import { clearCart, getCart } from "@/features/cart/api";
import { cartJson } from "@/features/cart/bff";
import { runCartOperation } from "@/features/cart/session";

/**
 * `GET /api/cart` — carrito actual (del usuario con sesión o del invitado).
 * `DELETE /api/cart` — vacía el carrito.
 *
 * Patrón BFF: el navegador no habla con la API ni ve tokens. Aquí se resuelve la identidad del carrito (sesión
 * o invitado), se llama al backend y se guarda en una cookie **httpOnly** el token que el backend emita para el
 * invitado. Las dos operaciones devuelven el carrito completo, con el subtotal y la moneda calculados por el
 * servidor.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  return cartJson(
    await runCartOperation((accessToken, guestToken) => getCart(accessToken, guestToken)),
  );
}

export async function DELETE(): Promise<NextResponse> {
  return cartJson(
    await runCartOperation((accessToken, guestToken) => clearCart(accessToken, guestToken)),
  );
}
