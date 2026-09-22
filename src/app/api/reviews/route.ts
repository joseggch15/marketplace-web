import { NextResponse } from "next/server";

import { backendProblem, parseJsonBody, unauthorizedResponse } from "@/features/auth/bff";
import { withAccessToken } from "@/features/auth/session";
import { createReview } from "@/features/orders/api";
import { reviewBodySchema } from "@/features/orders/schemas";

/**
 * `POST /api/reviews` — publica la reseña de un producto comprado y recibido.
 *
 * La regla de negocio la impone el backend: solo se puede reseñar un producto **entregado** (`purchase_required`,
 * 403) y una sola vez por producto (`review_exists`, 409). Aquí solo se valida la forma del cuerpo y se traduce
 * el error con su `code` estable.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await parseJsonBody(request, reviewBodySchema);

  if (!body.ok) {
    return body.response;
  }

  const result = await withAccessToken((token) => createReview(token, body.data));

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json(
    { review: result.data },
    { status: 201, headers: { "cache-control": "no-store" } },
  );
}
