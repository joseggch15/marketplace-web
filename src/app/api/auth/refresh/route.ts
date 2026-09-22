import { NextResponse } from "next/server";

import { problemResponse } from "@/features/auth/bff";
import { refreshSession } from "@/features/auth/session";

/**
 * `POST /api/auth/refresh` — renueva la sesión.
 *
 * El refresh token rota: el backend invalida el anterior y devuelve uno nuevo. Esta ruta guarda el par nuevo
 * en cookies y responde con el usuario. Si la renovación falla, se borran las cookies y se responde 401 con
 * el código `invalid_refresh_token` para que la interfaz lleve al usuario a /login.
 */
export const runtime = "nodejs";

export async function POST(): Promise<NextResponse> {
  const user = await refreshSession();

  if (user === null) {
    return problemResponse(401, "invalid_refresh_token", "The session could not be renewed.");
  }

  return NextResponse.json({ user }, { headers: { "cache-control": "no-store" } });
}
