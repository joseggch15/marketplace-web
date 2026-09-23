import { NextResponse } from "next/server";

import {
  backendProblem,
  parseJsonBody,
  problemResponse,
  unauthorizedResponse,
} from "@/features/auth/bff";
import { withAccessToken } from "@/features/auth/session";
import { updateVariantStock } from "@/features/seller/api";
import { isProductId, isVariantId } from "@/features/seller/params";
import { stockUpdateSchema } from "@/features/seller/schemas";

/**
 * `PATCH /api/seller/products/{productId}/variants/{variantId}/stock` — cambia el stock de una variante.
 *
 * `stock` es el **total** que el vendedor tiene (valor absoluto, no un incremento) y el servidor calcula el
 * delta con bloqueo de fila. Nunca baja por debajo de las unidades reservadas por pedidos en curso: eso
 * responde 409 `insufficient_stock`, que la interfaz traduce.
 *
 * Devuelve el producto completo, con el stock y el `total_available` ya actualizados, así que la pantalla se
 * puede refrescar sin otra consulta.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" } as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string; variantId: string }> },
): Promise<NextResponse> {
  const { productId, variantId } = await params;

  if (!isProductId(productId) || !isVariantId(variantId)) {
    return problemResponse(404, "variant_not_found", "The variant id is not valid.");
  }

  const body = await parseJsonBody(request, stockUpdateSchema);

  if (!body.ok) {
    return body.response;
  }

  const result = await withAccessToken((token) =>
    updateVariantStock(token, productId, variantId, body.data.stock),
  );

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ product: result.data }, { headers: noStore });
}
