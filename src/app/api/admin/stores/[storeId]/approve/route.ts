import { approveStore } from "@/features/admin/api";
import { emptyAction } from "@/features/admin/bff";

/**
 * `POST /api/admin/stores/{storeId}/approve` — aprueba la tienda de un vendedor.
 *
 * Aprobar es lo que le permite publicar productos y vender. Lo decide el backend (solo un administrador puede
 * llamar a este endpoint): aquí se valida el identificador y se reenvía la sesión de la persona que pulsó.
 */
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
    run: (token) => approveStore(token, storeId),
  });
}
