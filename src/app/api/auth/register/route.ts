import { NextResponse } from "next/server";

import { backendProblem, parseJsonBody } from "@/features/auth/bff";
import { registerBody } from "@/features/auth/request-schemas";
import { createAccount } from "@/features/auth/session";

/**
 * `POST /api/auth/register` — crea la cuenta.
 *
 * No inicia sesión: el backend no devuelve tokens al registrarse, así que el usuario entra después con sus
 * credenciales. Devuelve 201 con el usuario creado (sin tokens, que nunca salen del servidor).
 */
export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await parseJsonBody(request, registerBody);

  if (!body.ok) {
    return body.response;
  }

  const result = await createAccount(body.data);

  if (!result.ok) {
    return backendProblem(result);
  }

  return NextResponse.json({ user: result.data }, { status: 201 });
}
