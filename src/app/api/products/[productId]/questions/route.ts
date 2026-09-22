import { NextResponse } from "next/server";

import {
  backendProblem,
  parseJsonBody,
  problemResponse,
  unauthorizedResponse,
} from "@/features/auth/bff";
import { withAccessToken } from "@/features/auth/session";
import { askQuestion } from "@/features/product/api";
import { isProductId } from "@/features/product/params";
import { questionBody } from "@/features/product/schemas";

/**
 * `POST /api/products/{productId}/questions` — publica una pregunta en nombre del usuario con sesión.
 *
 * Es el patrón BFF de todo el proyecto: el navegador no habla con el backend ni ve tokens. Aquí se valida el
 * identificador, se valida el cuerpo con Zod (aunque el formulario ya lo hizo: el servidor no se fía nunca del
 * cliente) y `withAccessToken` renueva la sesión si el access token caducó, para que publicar no falle por un
 * token vencido hace un minuto.
 *
 * El límite de frecuencia de publicación lo pone el backend (`too_many_requests`) y se devuelve tal cual, con
 * su `code` estable, para que el formulario lo traduzca.
 */
export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
): Promise<NextResponse> {
  const { productId } = await params;

  if (!isProductId(productId)) {
    return problemResponse(404, "product_not_found", "The product id is not valid.");
  }

  const body = await parseJsonBody(request, questionBody);

  if (!body.ok) {
    return body.response;
  }

  const result = await withAccessToken((token) => askQuestion(token, productId, body.data.body));

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json(
    { question: result.data },
    { status: 201, headers: { "cache-control": "no-store" } },
  );
}
