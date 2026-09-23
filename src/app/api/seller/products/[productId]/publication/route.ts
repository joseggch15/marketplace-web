import { NextResponse } from "next/server";

import {
  backendProblem,
  parseJsonBody,
  problemResponse,
  unauthorizedResponse,
} from "@/features/auth/bff";
import { withAccessToken } from "@/features/auth/session";
import { setProductPublication } from "@/features/seller/api";
import { isProductId } from "@/features/seller/params";
import { publicationSchema } from "@/features/seller/schemas";

/**
 * `POST /api/seller/products/{productId}/publication` — publica, pausa o cierra un producto.
 *
 * La API tiene tres endpoints (`publish`, `pause`, `close`) y la interfaz ofrece una sola acción: aquí se
 * traduce `{ action }` al endpoint correcto. El navegador no puede pedir un estado imposible porque Zod valida
 * el enum antes de llegar al servidor.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" } as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
): Promise<NextResponse> {
  const { productId } = await params;

  if (!isProductId(productId)) {
    return problemResponse(404, "product_not_found", "The product id is not valid.");
  }

  const body = await parseJsonBody(request, publicationSchema);

  if (!body.ok) {
    return body.response;
  }

  const result = await withAccessToken((token) =>
    setProductPublication(token, productId, body.data.action),
  );

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ product: result.data }, { headers: noStore });
}
