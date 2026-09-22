import { NextResponse } from "next/server";

import { backendProblem, problemResponse, unauthorizedResponse } from "@/features/auth/bff";
import { withAccessToken } from "@/features/auth/session";
import { cancelOrder } from "@/features/orders/api";
import { isOrderId } from "@/features/orders/params";

/**
 * `POST /api/orders/{orderId}/cancel` — cancela un pedido pendiente de pago.
 *
 * Quién puede cancelar y en qué momento lo decide **el backend** (solo pedidos `pending`); aquí solo se valida
 * el identificador y se traduce el error. Si el pedido ya cambió de estado, la API responde con su `code` y la
 * interfaz lo explica sin inventarse nada.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
): Promise<NextResponse> {
  const { orderId } = await params;

  if (!isOrderId(orderId)) {
    return problemResponse(404, "order_not_found", "The order id is not valid.");
  }

  const result = await withAccessToken((token) => cancelOrder(token, orderId));

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ order: result.data }, { headers: { "cache-control": "no-store" } });
}
