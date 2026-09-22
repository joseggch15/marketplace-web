import { NextResponse } from "next/server";

import {
  backendProblem,
  parseJsonBody,
  problemResponse,
  unauthorizedResponse,
} from "@/features/auth/bff";
import { withAccessToken } from "@/features/auth/session";
import { simulatePayment } from "@/features/orders/api";
import { isPaymentId } from "@/features/orders/params";
import { simulatePaymentBodySchema } from "@/features/orders/schemas";

/**
 * `POST /api/payments/{paymentId}/simulate` — aprueba o rechaza el pago (solo con la pasarela de prueba).
 *
 * Es el equivalente al webhook del proveedor: el backend recorre el mismo camino (firma, idempotencia y
 * actualización de la orden), así que la interfaz prueba los dos desenlaces reales sin dinero de por medio. Solo
 * acepta `succeeded` o `failed`: el prototipo no ofrece reembolsos.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> },
): Promise<NextResponse> {
  const { paymentId } = await params;

  if (!isPaymentId(paymentId)) {
    return problemResponse(404, "not_found", "The payment id is not valid.");
  }

  const body = await parseJsonBody(request, simulatePaymentBodySchema);

  if (!body.ok) {
    return body.response;
  }

  const result = await withAccessToken((token) =>
    simulatePayment(token, paymentId, body.data.outcome),
  );

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ payment: result.data }, { headers: { "cache-control": "no-store" } });
}
