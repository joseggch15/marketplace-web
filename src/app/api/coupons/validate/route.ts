import { NextResponse } from "next/server";

import { backendProblem, parseJsonBody, unauthorizedResponse } from "@/features/auth/bff";
import { withAccessToken } from "@/features/auth/session";
import { validateCoupon } from "@/features/orders/api";
import { couponCodeBodySchema } from "@/features/orders/schemas";

/**
 * `POST /api/coupons/validate` — vista previa del cupón sobre el carrito actual.
 *
 * **No consume** el cupón: la API calcula el descuento con el subtotal real del carrito del usuario y devuelve
 * los importes resultantes. El canje ocurre al crear el pedido, no aquí.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await parseJsonBody(request, couponCodeBodySchema);

  if (!body.ok) {
    return body.response;
  }

  const result = await withAccessToken((token) => validateCoupon(token, body.data.code));

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ coupon: result.data }, { headers: { "cache-control": "no-store" } });
}
