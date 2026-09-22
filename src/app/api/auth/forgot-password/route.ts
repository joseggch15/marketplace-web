import { NextResponse } from "next/server";

import { requestPasswordReset } from "@/features/auth/api";
import { backendProblem, parseJsonBody } from "@/features/auth/bff";
import { emailBody } from "@/features/auth/request-schemas";

/**
 * `POST /api/auth/forgot-password` — pide el enlace para cambiar la contraseña.
 *
 * Responde 202 sin decir si el correo existe (el backend tampoco lo dice): evita que alguien use este
 * endpoint para descubrir cuentas registradas.
 */
export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await parseJsonBody(request, emailBody);

  if (!body.ok) {
    return body.response;
  }

  const result = await requestPasswordReset(body.data.email);

  if (!result.ok) {
    return backendProblem(result);
  }

  return new NextResponse(null, { status: 202 });
}
