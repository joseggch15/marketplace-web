import { NextResponse } from "next/server";

import {
  backendProblem,
  parseJsonBody,
  problemResponse,
  unauthorizedResponse,
} from "@/features/auth/bff";
import { withAccessToken } from "@/features/auth/session";
import { updateProduct } from "@/features/seller/api";
import { isProductId } from "@/features/seller/params";
import { productUpdateSchema } from "@/features/seller/schemas";

/**
 * `PATCH /api/seller/products/{productId}` — edita título, descripción y marca de un producto propio.
 *
 * La API **no** admite cambiar precio ni variantes por aquí (para el precio habría que crear una variante
 * nueva): la pantalla lo dice y muestra el precio en solo lectura. El stock sí tiene su endpoint propio.
 *
 * Que el producto sea del vendedor con sesión lo decide el backend (responde 403 si es de otro), así que aquí
 * solo se valida el identificador y el cuerpo.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" } as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
): Promise<NextResponse> {
  const { productId } = await params;

  if (!isProductId(productId)) {
    return problemResponse(404, "product_not_found", "The product id is not valid.");
  }

  const body = await parseJsonBody(request, productUpdateSchema);

  if (!body.ok) {
    return body.response;
  }

  const result = await withAccessToken((token) => updateProduct(token, productId, body.data));

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ product: result.data }, { headers: noStore });
}
