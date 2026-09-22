import { NextResponse } from "next/server";

import { backendProblem, parseJsonBody } from "@/features/auth/bff";
import { registerBody } from "@/features/auth/request-schemas";
import { createAccount } from "@/features/auth/session";
import { mergeGuestCartIfSignedIn } from "@/features/cart/session";

/**
 * `POST /api/auth/register` — crea la cuenta.
 *
 * No inicia sesión: el backend no devuelve tokens al registrarse, así que el usuario entra después con sus
 * credenciales. Devuelve 201 con el usuario creado (sin tokens, que nunca salen del servidor).
 *
 * **Sobre el carrito de invitado:** la fusión se hace en el servidor, pero aquí todavía no se puede: sin
 * sesión no hay carrito de usuario al que fusionar. Lo importante es que **el carrito no se pierde**: la
 * cookie `mv_cart` se conserva intacta y la fusión ocurre en el inicio de sesión, que es el paso siguiente del
 * registro. La llamada está de todas formas puesta para que empiece a funcionar el día que el backend emita
 * tokens al crear la cuenta (apartado 15 de `docs/PENDIENTES-BACKEND.md`).
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

  await mergeGuestCartIfSignedIn();

  return NextResponse.json({ user: result.data }, { status: 201 });
}
