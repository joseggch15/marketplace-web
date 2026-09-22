import { NextResponse } from "next/server";
import { z } from "zod";

import {
  backendProblem,
  parseJsonBody,
  problemResponse,
  unauthorizedResponse,
} from "@/features/auth/bff";
import { withAccessToken } from "@/features/auth/session";
import { createPayment } from "@/features/orders/api";
import { isOrderId } from "@/features/orders/params";

/**
 * `POST /api/orders/{orderId}/payments` — crea el intento de pago del pedido.
 *
 * Es la pasarela **de prueba** del prototipo: la API devuelve un `checkout_url` y el pago se resuelve después
 * con `POST /api/payments/{id}/simulate`. Aquí no se piden ni se guardan datos de tarjeta (regla del proyecto:
 * los datos de tarjeta los tokeniza la pasarela y nosotros nunca los vemos).
 *
 * La clave de idempotencia evita dos intentos de cobro si el navegador reintenta.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paymentBodySchema = z.object({
  idempotency_key: z.string().min(8, "invalid").max(128, "invalid"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
): Promise<NextResponse> {
  const { orderId } = await params;

  if (!isOrderId(orderId)) {
    return problemResponse(404, "order_not_found", "The order id is not valid.");
  }

  const body = await parseJsonBody(request, paymentBodySchema);

  if (!body.ok) {
    return body.response;
  }

  const result = await withAccessToken((token) =>
    createPayment(token, orderId, body.data.idempotency_key),
  );

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json(
    { payment: result.data },
    { status: 201, headers: { "cache-control": "no-store" } },
  );
}
