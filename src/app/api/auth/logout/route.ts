import { NextResponse } from "next/server";

import { endSession } from "@/features/auth/session";

/**
 * `POST /api/auth/logout` — cierra la sesión.
 *
 * Primero se avisa al backend (que invalida el refresh token en su base de datos) y después se borran las
 * cookies. Si el backend no responde, igualmente se borran: quedarse con una sesión local que el servidor ya
 * no reconoce sería peor. Responde 204 siempre, sin cuerpo.
 */
export const runtime = "nodejs";

export async function POST(): Promise<NextResponse> {
  await endSession();
  return new NextResponse(null, { status: 204 });
}
