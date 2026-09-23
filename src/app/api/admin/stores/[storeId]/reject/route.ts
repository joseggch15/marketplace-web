import { rejectStore } from "@/features/admin/api";
import { emptyAction } from "@/features/admin/bff";

/** `POST /api/admin/stores/{storeId}/reject` — rechaza la solicitud de tienda de un vendedor. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;

  return emptyAction({
    id: storeId,
    notFoundCode: "store_not_found",
    run: (token) => rejectStore(token, storeId),
  });
}
