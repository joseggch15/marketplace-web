import { NextResponse } from "next/server";

import { verifyEmail } from "@/features/auth/api";
import { backendProblem, parseJsonBody } from "@/features/auth/bff";
import { tokenBody } from "@/features/auth/request-schemas";

/**
 * `POST /api/auth/verify-email` — confirma el correo con el token del enlace.
 *
 * El token viaja en el cuerpo (no en la URL de nuestra API) para que no quede en los registros del servidor
 * ni en el historial. El backend responde 204 si el token es válido y 400 con `invalid_token` si caducó o ya
 * se usó.
 */
export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await parseJsonBody(request, tokenBody);

  if (!body.ok) {
    return body.response;
  }

  const result = await verifyEmail(body.data.token);

  if (!result.ok) {
    return backendProblem(result);
  }

  return new NextResponse(null, { status: 204 });
}
