import { publishQuestion } from "@/features/admin/api";
import { moderationRoute } from "@/features/admin/bff";

/** `POST /api/admin/questions/{questionId}/publish` — vuelve a publicar una pregunta oculta. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const { questionId } = await params;

  return moderationRoute({
    id: questionId,
    notFoundCode: "question_not_found",
    request,
    run: (token, reason) => publishQuestion(token, questionId, reason),
  });
}
