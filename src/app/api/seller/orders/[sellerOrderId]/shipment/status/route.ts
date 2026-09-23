import { NextResponse } from "next/server";

import { backendProblem, problemResponse, unauthorizedResponse } from "@/features/auth/bff";
import { withAccessToken } from "@/features/auth/session";
import { updateShipmentStatus } from "@/features/seller/api";
import { isSellerOrderId } from "@/features/seller/params";
import type { ShipmentStatus } from "@/features/seller/types";

/**
 * `POST /api/seller/orders/{sellerOrderId}/shipment/status?status=…` — anota un avance del envío.
 *
 * El panel usa dos: `in_transit` (cuando la transportadora ya lo tiene) y `delivered` (cuando el comprador lo
 * recibió). La máquina de estados completa vive en el backend (`pending → ready → shipped → in_transit →
 * delivered`, con `returned` y `cancelled`), así que aquí solo se admite una lista blanca y el resto lo decide
 * él: una transición imposible responde `invalid_status_transition` y la interfaz lo traduce.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" } as const;

const ALLOWED_STATUSES: readonly ShipmentStatus[] = ["ready", "shipped", "in_transit", "delivered"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sellerOrderId: string }> },
): Promise<NextResponse> {
  const { sellerOrderId } = await params;

  if (!isSellerOrderId(sellerOrderId)) {
    return problemResponse(404, "seller_order_not_found", "The sale id is not valid.");
  }

  const search = new URL(request.url).searchParams;
  const status = search.get("status");

  if (status === null || !(ALLOWED_STATUSES as readonly string[]).includes(status)) {
    return problemResponse(422, "validation_error", "That shipment status is not allowed.");
  }

  const description = search.get("description");
  const note =
    description !== null && description.trim().length > 0 ? description.trim().slice(0, 300) : null;

  const result = await withAccessToken((token) =>
    updateShipmentStatus(token, sellerOrderId, status as ShipmentStatus, note),
  );

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ shipment: result.data }, { headers: noStore });
}
