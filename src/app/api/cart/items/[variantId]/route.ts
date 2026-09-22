import type { NextResponse } from "next/server";

import { parseJsonBody, problemResponse } from "@/features/auth/bff";
import { removeCartItem, updateCartItemQuantity } from "@/features/cart/api";
import { cartJson } from "@/features/cart/bff";
import { isVariantId } from "@/features/cart/params";
import { cartItemUpdateSchema } from "@/features/cart/schemas";
import { runCartOperation } from "@/features/cart/session";

/**
 * `PATCH /api/cart/items/{variantId}` — cambia la cantidad de una línea.
 * `DELETE /api/cart/items/{variantId}` — quita una línea.
 *
 * El identificador se valida **antes** de llamar al backend: una dirección con basura no gasta una petición y
 * responde 404 con el mismo `code` que usaría la API (`variant_not_found`), para que el navegador lo traduzca
 * igual sin importar dónde se detectó el error.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ variantId: string }> };

export async function PATCH(request: Request, { params }: RouteContext): Promise<NextResponse> {
  const { variantId } = await params;

  if (!isVariantId(variantId)) {
    return problemResponse(404, "variant_not_found", "The variant id is not valid.");
  }

  const body = await parseJsonBody(request, cartItemUpdateSchema);

  if (!body.ok) {
    return body.response;
  }

  const result = await runCartOperation((accessToken, guestToken) =>
    updateCartItemQuantity(accessToken, guestToken, variantId, body.data.quantity),
  );

  return cartJson(result);
}

export async function DELETE(_request: Request, { params }: RouteContext): Promise<NextResponse> {
  const { variantId } = await params;

  if (!isVariantId(variantId)) {
    return problemResponse(404, "variant_not_found", "The variant id is not valid.");
  }

  const result = await runCartOperation((accessToken, guestToken) =>
    removeCartItem(accessToken, guestToken, variantId),
  );

  return cartJson(result);
}
