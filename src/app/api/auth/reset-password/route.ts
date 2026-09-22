import { NextResponse } from "next/server";

import { resetPassword } from "@/features/auth/api";
import { backendProblem, parseJsonBody } from "@/features/auth/bff";
import { resetPasswordBody } from "@/features/auth/request-schemas";

/**
 * `POST /api/auth/reset-password` — guarda la contraseña nueva usando el token del correo.
 *
 * El token es de un solo uso: el backend marca el anterior como usado y responde 400 con `invalid_token` si
 * alguien intenta reutilizarlo.
 */
export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await parseJsonBody(request, resetPasswordBody);

  if (!body.ok) {
    return body.response;
  }

  const result = await resetPassword(body.data);

  if (!result.ok) {
    return backendProblem(result);
  }

  return new NextResponse(null, { status: 204 });
}
