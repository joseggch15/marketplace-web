import { NextResponse } from "next/server";
import { z } from "zod";

import type { BackendResult } from "@/features/auth/api";
import {
  backendProblem,
  parseJsonBody,
  problemResponse,
  unauthorizedResponse,
} from "@/features/auth/bff";
import { withAccessToken } from "@/features/auth/session";

import { isUuid } from "./params";
import { MAX_REASON_LENGTH } from "./types";

/**
 * Piezas compartidas por las rutas BFF de moderación del panel de administración.
 *
 * Todas hacen lo mismo salvo la llamada al backend: validar el identificador, leer el **motivo opcional**, pedir
 * la sesión (`withAccessToken`, que renueva el access token si caducó) y traducir el error. Escribir eso ocho
 * veces invita a que una de las ocho se olvide de algo, así que vive aquí una sola vez.
 */

/** Motivo opcional de una acción de moderación: se recorta y se limita antes de enviarlo. */
export const reasonSchema = z
  .object({ reason: z.string().trim().max(MAX_REASON_LENGTH, "tooLong").nullish() })
  .transform((value) => {
    const reason = value.reason ?? null;
    return { reason: reason === null || reason.length === 0 ? null : reason };
  });

/**
 * Ejecuta una acción de moderación y devuelve la respuesta.
 *
 * `notFoundCode` es el `code` con el que se responde si el identificador no tiene forma de UUID: se usa el mismo
 * que devolvería la API para que el navegador traduzca igual sin importar dónde se detectó.
 */
export async function moderationRoute({
  id,
  notFoundCode,
  run,
  request,
  status = 200,
}: {
  /** Identificador de la entidad sobre la que se actúa. */
  id: string;
  notFoundCode: string;
  /** Llamada al backend con el token de la sesión y el motivo (o `null`). */
  run: (accessToken: string, reason: string | null) => Promise<BackendResult<unknown>>;
  /** Petición original: de ella sale el motivo opcional del cuerpo. */
  request: Request;
  /** Estado con el que se responde cuando todo va bien. */
  status?: number;
}): Promise<NextResponse> {
  if (!isUuid(id)) {
    return problemResponse(404, notFoundCode, "The identifier is not valid.");
  }

  const body = await parseJsonBody(request, reasonSchema);

  if (!body.ok) {
    return body.response;
  }

  const result = await withAccessToken((token) => run(token, body.data.reason));

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json(
    { action: result.data ?? null },
    { status, headers: { "cache-control": "no-store" } },
  );
}

/** Petición `POST` sin cuerpo (por ejemplo, aprobar o rechazar una tienda). */
export async function emptyAction({
  id,
  notFoundCode,
  run,
}: {
  id: string;
  notFoundCode: string;
  run: (accessToken: string) => Promise<BackendResult<unknown>>;
}): Promise<NextResponse> {
  if (!isUuid(id)) {
    return problemResponse(404, notFoundCode, "The identifier is not valid.");
  }

  const result = await withAccessToken(run);

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json(
    { result: result.data ?? null },
    { headers: { "cache-control": "no-store" } },
  );
}
