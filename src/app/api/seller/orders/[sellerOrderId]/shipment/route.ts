import { NextResponse } from "next/server";

import {
  backendProblem,
  parseJsonBody,
  problemResponse,
  unauthorizedResponse,
} from "@/features/auth/bff";
import { withAccessToken } from "@/features/auth/session";
import { createShipment, getShipment, updateShipment } from "@/features/seller/api";
import { isSellerOrderId } from "@/features/seller/params";
import { shipmentFormSchema, toShipmentBody } from "@/features/seller/schemas";

/**
 * `GET   /api/seller/orders/{sellerOrderId}/shipment` — el envío de una venta propia.
 * `POST  /api/seller/orders/{sellerOrderId}/shipment` — prepara el envío (transportadora, guía, costo).
 * `PATCH /api/seller/orders/{sellerOrderId}/shipment` — corrige los datos del envío.
 *
 * El costo del envío lo escribe el vendedor (puede ser `0.00`, que es lo normal cuando él no cobra aparte) y
 * viaja como **texto decimal**, nunca como número en coma flotante. La guía y el enlace de seguimiento son
 * opcionales: la API los acepta vacíos y la interfaz no los inventa.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" } as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sellerOrderId: string }> },
): Promise<NextResponse> {
  const { sellerOrderId } = await params;

  if (!isSellerOrderId(sellerOrderId)) {
    return problemResponse(404, "seller_order_not_found", "The sale id is not valid.");
  }

  const result = await withAccessToken((token) => getShipment(token, sellerOrderId));

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ shipment: result.data }, { headers: noStore });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sellerOrderId: string }> },
): Promise<NextResponse> {
  const { sellerOrderId } = await params;

  if (!isSellerOrderId(sellerOrderId)) {
    return problemResponse(404, "seller_order_not_found", "The sale id is not valid.");
  }

  const body = await parseJsonBody(request, shipmentFormSchema);

  if (!body.ok) {
    return body.response;
  }

  const result = await withAccessToken((token) =>
    createShipment(token, sellerOrderId, toShipmentBody(body.data)),
  );

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ shipment: result.data }, { status: 201, headers: noStore });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sellerOrderId: string }> },
): Promise<NextResponse> {
  const { sellerOrderId } = await params;

  if (!isSellerOrderId(sellerOrderId)) {
    return problemResponse(404, "seller_order_not_found", "The sale id is not valid.");
  }

  const body = await parseJsonBody(request, shipmentFormSchema);

  if (!body.ok) {
    return body.response;
  }

  const result = await withAccessToken((token) =>
    updateShipment(token, sellerOrderId, toShipmentBody(body.data)),
  );

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ shipment: result.data }, { headers: noStore });
}
