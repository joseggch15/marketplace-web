import { NextResponse } from "next/server";

import { resendVerification } from "@/features/auth/api";
import { backendProblem, parseJsonBody } from "@/features/auth/bff";
import { emailBody } from "@/features/auth/request-schemas";

/**
 * `POST /api/auth/resend-verification` — reenvía el correo de verificación.
 *
 * Responde lo mismo exista o no la cuenta (el backend ya lo hace así): así nadie puede usar este endpoint
 * para averiguar qué correos están registrados.
 */
export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await parseJsonBody(request, emailBody);

  if (!body.ok) {
    return body.response;
  }

  const result = await resendVerification(body.data.email);

  if (!result.ok) {
    return backendProblem(result);
  }

  return new NextResponse(null, { status: 204 });
}
