import { NextResponse } from "next/server";

import { backendProblem, parseJsonBody, unauthorizedResponse } from "@/features/auth/bff";
import { withAccessToken } from "@/features/auth/session";
import { createStore, getMyStore, updateStore } from "@/features/seller/api";
import { storeFormSchema } from "@/features/seller/schemas";

/**
 * `GET   /api/seller/store` — la tienda de la sesión (404 `seller_required` si todavía no vende).
 * `POST  /api/seller/store` — solicita crear la tienda.
 * `PATCH /api/seller/store` — cambia nombre o descripción.
 *
 * Toda la autorización la decide el backend: aquí solo se valida el cuerpo con Zod (aunque el formulario ya lo
 * haya hecho) y se reenvía con `withAccessToken`, que renueva la sesión si el access token caducó. Un vendedor
 * nunca puede tocar la tienda de otro porque la API resuelve «mi tienda» por el token, no por un identificador
 * que mande el navegador.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" } as const;

export async function GET(): Promise<NextResponse> {
  const result = await withAccessToken((token) => getMyStore(token));

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ store: result.data }, { headers: noStore });
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await parseJsonBody(request, storeFormSchema);

  if (!body.ok) {
    return body.response;
  }

  const result = await withAccessToken((token) => createStore(token, body.data));

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ store: result.data }, { status: 201, headers: noStore });
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const body = await parseJsonBody(request, storeFormSchema);

  if (!body.ok) {
    return body.response;
  }

  const result = await withAccessToken((token) => updateStore(token, body.data));

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ store: result.data }, { headers: noStore });
}
