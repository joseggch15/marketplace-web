import { NextResponse } from "next/server";

import { backendProblem, problemResponse } from "@/features/auth/bff";
import { estimateShipping } from "@/features/orders/api";
import { isProductId } from "@/features/product/params";

/**
 * `GET /api/shipping/estimate?productId=…&country=CO` — estimación de entrega de un producto.
 *
 * Dato público (no requiere sesión) pero servido por nuestro dominio, como todo lo demás: el navegador nunca
 * habla con el backend. El país se valida con la misma regla del backend (dos letras ISO en mayúsculas) y el
 * identificador antes de gastar la petición.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId") ?? "";
  const country = (url.searchParams.get("country") ?? "").trim().toUpperCase();

  if (!isProductId(productId)) {
    return problemResponse(404, "product_not_found", "The product id is not valid.");
  }

  const validCountry = /^[A-Z]{2}$/.test(country) ? country : null;
  const result = await estimateShipping(productId, validCountry);

  if (!result.ok) {
    return backendProblem(result);
  }

  return NextResponse.json(result.data, { headers: { "cache-control": "no-store" } });
}
