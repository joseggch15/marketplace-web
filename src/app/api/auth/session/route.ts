import { NextResponse } from "next/server";

import { getCurrentUser, refreshSession } from "@/features/auth/session";

/**
 * `GET /api/auth/session` — ¿hay sesión y quién es el usuario?
 *
 * Es la ruta que usa el navegador para saber si debe mostrar "Iniciar sesión" o "Mi cuenta", y la que
 * **mantiene viva la sesión**: si el access token caducó pero el refresh token sigue siendo válido, aquí se
 * renueva y se guardan las cookies nuevas. Sin esta ruta, el usuario tendría que volver a entrar cada 15
 * minutos.
 *
 * Nunca es un error: sin sesión responde `{ "user": null }` con 200.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const user = (await getCurrentUser()) ?? (await refreshSession());

  return NextResponse.json({ user }, { headers: { "cache-control": "no-store" } });
}
