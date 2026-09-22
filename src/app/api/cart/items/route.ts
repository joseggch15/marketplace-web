import type { NextResponse } from "next/server";

import { parseJsonBody } from "@/features/auth/bff";
import { addCartItem } from "@/features/cart/api";
import { cartJson } from "@/features/cart/bff";
import { cartItemAddSchema } from "@/features/cart/schemas";
import { runCartOperation } from "@/features/cart/session";

/**
 * `POST /api/cart/items` — añade (o incrementa) una variante en el carrito.
 *
 * El `variant_id` se valida con Zod (tiene que ser un UUID) y la cantidad también (1 a 100, los mismos límites
 * que el backend): aunque el botón de la ficha ya controle la cantidad, el servidor no se fía nunca del cliente.
 *
 * La respuesta es el carrito completo. Los fallos llegan con el `code` estable de la API
 * (`variant_not_found`, `quantity_limit_exceeded`, …) para que el navegador los traduzca.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await parseJsonBody(request, cartItemAddSchema);

  if (!body.ok) {
    return body.response;
  }

  const result = await runCartOperation((accessToken, guestToken) =>
    addCartItem(accessToken, guestToken, {
      variantId: body.data.variant_id,
      quantity: body.data.quantity,
    }),
  );

  return cartJson(result);
}
