import { NextResponse } from "next/server";

import { backendProblem, parseJsonBody } from "@/features/auth/bff";
import { loginBody } from "@/features/auth/request-schemas";
import { startSession } from "@/features/auth/session";
import { mergeGuestCartIfSignedIn } from "@/features/cart/session";

/**
 * `POST /api/auth/login` — inicia sesión.
 *
 * El backend devuelve el par de tokens; aquí se guardan en cookies **httpOnly** y al navegador solo le
 * llega el usuario. Este es el único camino por el que entra una sesión: `localStorage` queda prohibido.
 *
 * Además, **la fusión del carrito de invitado ocurre aquí, en el servidor**: si este navegador tenía un
 * carrito sin sesión, sus líneas pasan al carrito del usuario y la cookie del invitado se borra. Se hace en
 * la misma petición que el inicio de sesión, sin depender de ningún efecto del navegador: si el usuario cierra
 * la pestaña justo después de entrar, el carrito ya está fusionado.
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

  await mergeGuestCartIfSignedIn();

  return NextResponse.json({ user: result.data });
}
