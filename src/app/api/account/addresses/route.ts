import { NextResponse } from "next/server";

import { createAddress, listAddresses } from "@/features/auth/api";
import { backendProblem, parseJsonBody, unauthorizedResponse } from "@/features/auth/bff";
import { addressBody } from "@/features/auth/request-schemas";
import { withAccessToken } from "@/features/auth/session";

/**
 * Rutas de las direcciones de envío del usuario con sesión.
 *
 * - `GET`  devuelve la lista completa (son pocas por usuario: no hace falta paginar).
 * - `POST` crea una dirección nueva.
 *
 * El backend decide si la nueva pasa a ser la predeterminada; aquí solo se reenvía lo que el usuario escribió.
 */
export const runtime = "nodejs";

const noStore = { "cache-control": "no-store" } as const;

export async function GET(): Promise<NextResponse> {
  const result = await withAccessToken((token) => listAddresses(token));

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ addresses: result.data }, { headers: noStore });
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await parseJsonBody(request, addressBody);

  if (!body.ok) {
    return body.response;
  }

  const result = await withAccessToken((token) => createAddress(token, body.data));

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ address: result.data }, { status: 201, headers: noStore });
}
