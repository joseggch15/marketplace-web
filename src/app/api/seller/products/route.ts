import { NextResponse } from "next/server";

import { backendProblem, parseJsonBody, unauthorizedResponse } from "@/features/auth/bff";
import { withAccessToken } from "@/features/auth/session";
import { createProduct } from "@/features/seller/api";
import { productFormSchema, toVariants } from "@/features/seller/schemas";

/**
 * `POST /api/seller/products` — crea un producto con sus variantes.
 *
 * El navegador manda lo que el vendedor escribió (título, categoría, precio, stock y **valores** de los
 * atributos); la lista de variantes la construye el servidor con `toVariants`, que aplica el producto cartesiano
 * de los valores y genera los SKU. Se hace aquí y no en el navegador por la misma razón que en todo el proyecto:
 * el servidor no se fía de lo que llega.
 *
 * El producto nace en **borrador**: publicarlo es un paso aparte (`…/publication`), así el vendedor puede
 * revisar la ficha antes de que sea visible.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" } as const;

export async function POST(request: Request): Promise<NextResponse> {
  const body = await parseJsonBody(request, productFormSchema);

  if (!body.ok) {
    return body.response;
  }

  const data = body.data;

  const result = await withAccessToken((token) =>
    createProduct(token, {
      title: data.title,
      description: data.description,
      brand: data.brand,
      category_id: data.categoryId,
      variants: toVariants(data),
    }),
  );

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ product: result.data }, { status: 201, headers: noStore });
}
