import { NextResponse } from "next/server";

import { backendProblem, parseJsonBody, unauthorizedResponse } from "@/features/auth/bff";
import { profileBody } from "@/features/auth/request-schemas";
import { withAccessToken } from "@/features/auth/session";
import { updateCurrentUser } from "@/features/auth/api";

/**
 * `PATCH /api/account/profile` — guarda los datos personales y las preferencias.
 *
 * Solo se envía lo que el usuario cambió (`PATCH`, no `PUT`), y `withAccessToken` renueva la sesión si el
 * access token caducó, para que guardar el perfil no falle por una sesión vencida hace un minuto.
 */
export const runtime = "nodejs";

export async function PATCH(request: Request): Promise<NextResponse> {
  const body = await parseJsonBody(request, profileBody);

  if (!body.ok) {
    return body.response;
  }

  const result = await withAccessToken((token) => updateCurrentUser(token, body.data));

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ user: result.data }, { headers: { "cache-control": "no-store" } });
}
