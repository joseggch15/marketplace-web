import { restoreStore } from "@/features/admin/api";
import { moderationRoute } from "@/features/admin/bff";

/** `POST /api/admin/stores/{storeId}/restore` — reactiva una tienda suspendida. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;

  return moderationRoute({
    id: storeId,
    notFoundCode: "store_not_found",
    request,
    run: (token, reason) => restoreStore(token, storeId, reason),
  });
}
