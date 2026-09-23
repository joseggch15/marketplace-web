import { NextResponse } from "next/server";

import { backendProblem, problemResponse, unauthorizedResponse } from "@/features/auth/bff";
import { withAccessToken } from "@/features/auth/session";
import { deleteImage } from "@/features/seller/api";
import { isImageId, isProductId } from "@/features/seller/params";

/**
 * `DELETE /api/seller/products/{productId}/images/{imageId}` — quita una imagen del producto.
 *
 * La imagen solo se puede quitar del producto propio (lo decide el backend). Se responde con el mismo cuerpo
 * vacío que la API (204) para que el navegador no tenga que interpretar nada.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string; imageId: string }> },
): Promise<NextResponse> {
  const { productId, imageId } = await params;

  if (!isProductId(productId) || !isImageId(imageId)) {
    return problemResponse(404, "image_not_found", "The image id is not valid.");
  }

  const result = await withAccessToken((token) => deleteImage(token, productId, imageId));

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({}, { headers: { "cache-control": "no-store" } });
}
