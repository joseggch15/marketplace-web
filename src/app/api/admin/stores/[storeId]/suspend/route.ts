import { suspendStore } from "@/features/admin/api";
import { moderationRoute } from "@/features/admin/bff";

/**
 * `POST /api/admin/stores/{storeId}/suspend` — suspende una tienda.
 *
 * El motivo es opcional (la API lo acepta vacío) y queda en el libro de auditoría del backend junto con quién lo
 * hizo: por eso se manda cuando existe, en lugar de inventar un texto.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;

  return moderationRoute({
    id: storeId,
    notFoundCode: "store_not_found",
    request,
    run: (token, reason) => suspendStore(token, storeId, reason),
  });
}
