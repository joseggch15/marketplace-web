import { NextResponse } from "next/server";
import type { z } from "zod";

/**
 * Utilidades compartidas por las rutas BFF (`src/app/api/...`).
 *
 * Todas las respuestas de error usan el **mismo formato que el backend** (Problem Details, RFC 9457) con un
 * `code` estable, para que el frontend tenga una sola forma de traducir errores, vengan de donde vengan.
 */

export function problemResponse(status: number, code: string, detail: string): NextResponse {
  return NextResponse.json(
    { type: "about:blank", title: code, status, detail, code },
    { status, headers: { "content-type": "application/problem+json" } },
  );
}

/** Traduce un fallo del backend en una respuesta para el navegador. */
export function backendProblem(result: { status: number; code: string | null }): NextResponse {
  const status = result.status >= 400 && result.status <= 599 ? result.status : 502;
  return problemResponse(status, result.code ?? "internal_error", "The backend rejected the request.");
}

/** Falta de sesión válida. */
export function unauthorizedResponse(): NextResponse {
  return problemResponse(401, "unauthorized", "A valid session is required.");
}

/**
 * Lee y valida el cuerpo JSON con Zod.
 *
 * Aunque el formulario ya validó en el navegador, aquí se vuelve a validar: la petición puede venir de
 * cualquier cliente y el servidor no confía nunca en lo que llega.
 */
export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: problemResponse(400, "invalid_json", "The request body is not valid JSON."),
    };
  }

  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      response: problemResponse(422, "validation_error", "The request failed validation."),
    };
  }

  return { ok: true, data: parsed.data };
}
