import { NextResponse } from "next/server";

import { backendProblem, parseJsonBody } from "@/features/auth/bff";
import { loginBody } from "@/features/auth/request-schemas";
import { startSession } from "@/features/auth/session";

/**
 * `POST /api/auth/login` — inicia sesión.
 *
 * El backend devuelve el par de tokens; aquí se guardan en cookies **httpOnly** y al navegador solo le
 * llega el usuario. Este es el único camino por el que entra una sesión: `localStorage` queda prohibido.
 */
export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await parseJsonBody(request, loginBody);

  if (!body.ok) {
    return body.response;
  }

  const result = await startSession(body.data.email, body.data.password);

  if (!result.ok) {
    return backendProblem(result);
  }

  return NextResponse.json({ user: result.data });
}
