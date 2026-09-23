import { publishReview } from "@/features/admin/api";
import { moderationRoute } from "@/features/admin/bff";

/**
 * `POST /api/admin/reviews/{reviewId}/publish` — vuelve a publicar una reseña oculta.
 *
 * La interfaz solo ofrece ocultar mientras no exista un listado de reseñas ocultas en la API (ver
 * `docs/PENDIENTES-BACKEND.md`); esta ruta existe porque el endpoint existe y lo usará la moderación cuando la
 * API permita listarlas.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const { reviewId } = await params;

  return moderationRoute({
    id: reviewId,
    notFoundCode: "review_not_found",
    request,
    run: (token, reason) => publishReview(token, reviewId, reason),
  });
}
