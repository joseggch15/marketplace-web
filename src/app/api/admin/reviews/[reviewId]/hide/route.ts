import { hideReview } from "@/features/admin/api";
import { moderationRoute } from "@/features/admin/bff";

/** `POST /api/admin/reviews/{reviewId}/hide` — oculta una reseña que incumple las normas. */
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
    run: (token, reason) => hideReview(token, reviewId, reason),
  });
}
