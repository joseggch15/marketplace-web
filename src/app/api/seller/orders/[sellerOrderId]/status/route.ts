import { NextResponse } from "next/server";

import { backendProblem, problemResponse, unauthorizedResponse } from "@/features/auth/bff";
import { withAccessToken } from "@/features/auth/session";
import { updateSaleStatus } from "@/features/seller/api";
import { isSellerOrderId } from "@/features/seller/params";
import { SELLER_FLOW } from "@/features/seller/types";

/**
 * `PATCH /api/seller/orders/{sellerOrderId}/status?status=…` — avanza el estado de una venta.
 *
 * El estado va en la **query** (así lo define la API, no en el cuerpo). Solo se admiten los tres pasos que
 * ofrece el panel —preparar (`processing`), enviar (`shipped`) y entregar (`delivered`)—: cancelar una venta es
 * cosa del comprador o del administrador, así que el vendedor no puede pedirlo desde aquí ni mandando el valor
 * a mano, porque se comprueba contra `SELLER_FLOW` antes de llamar al backend.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" } as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sellerOrderId: string }> },
): Promise<NextResponse> {
  const { sellerOrderId } = await params;

  if (!isSellerOrderId(sellerOrderId)) {
    return problemResponse(404, "seller_order_not_found", "The sale id is not valid.");
  }

  const status = new URL(request.url).searchParams.get("status");

  if (status === null || !(SELLER_FLOW as readonly string[]).includes(status)) {
    return problemResponse(422, "validation_error", "That status is not allowed.");
  }

  const result = await withAccessToken((token) =>
    updateSaleStatus(token, sellerOrderId, status as (typeof SELLER_FLOW)[number]),
  );

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ sale: result.data }, { headers: noStore });
}
