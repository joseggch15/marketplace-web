import { NextResponse } from "next/server";

import { backendProblem, problemResponse } from "@/features/auth/bff";
import { listCategoryAttributes } from "@/features/seller/api";

/**
 * `GET /api/seller/categories/{categoryId}/attributes` — atributos que admite una categoría.
 *
 * Es la única ruta del panel que **no** pide sesión, y no es un descuido: la lista de atributos de una categoría
 * es un dato público de la API (`GET /catalog/categories/{id}/attributes` no exige token). Se sirve por el BFF
 * igual que el resto para que el navegador no hable nunca con el backend.
 *
 * La necesita el formulario de producto: las variantes nacen de los valores que el vendedor escribe en esos
 * atributos (color, talla…), así que sin esta lista no se podría crear un producto.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" } as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
): Promise<NextResponse> {
  const { categoryId } = await params;

  if (!/^[0-9a-fA-F-]{36}$/.test(categoryId)) {
    return problemResponse(404, "category_not_found", "The category id is not valid.");
  }

  const result = await listCategoryAttributes(categoryId);

  if (!result.ok) {
    return backendProblem(result);
  }

  return NextResponse.json(result.data, { headers: noStore });
}
