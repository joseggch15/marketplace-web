import { NextResponse } from "next/server";

import { backendProblem, parseJsonBody } from "@/features/auth/bff";
import { registerBody } from "@/features/auth/request-schemas";
import { createAccount } from "@/features/auth/session";
import { mergeGuestCartIfSignedIn } from "@/features/cart/session";

/**
 * `POST /api/auth/register` — crea la cuenta **y deja la sesión iniciada**.
 *
 * El backend devuelve `{ user, access_token, refresh_token }` desde la decisión `0023`, así que el servidor
 * guarda las cookies de sesión (el navegador no ve ningún token) y devuelve solo `{ user }`.
 *
 * **Sobre el carrito de invitado:** como la sesión ya existe en este mismo paso, la fusión del carrito se hace
 * aquí y el invitado **no pierde lo que había agregado** al crear la cuenta.
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
