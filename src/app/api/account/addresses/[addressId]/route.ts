import { NextResponse } from "next/server";

import { deleteAddress, updateAddress } from "@/features/auth/api";
import { backendProblem, parseJsonBody, unauthorizedResponse } from "@/features/auth/bff";
import { addressPatchBody } from "@/features/auth/request-schemas";
import { withAccessToken } from "@/features/auth/session";

/**
 * `PATCH` y `DELETE /api/account/addresses/<id>` — edita o borra una dirección del usuario.
 *
 * El identificador es un UUID. La autorización real la hace el backend: solo puede tocar direcciones cuyo
 * dueño sea el token que enviamos, así que un UUID ajeno responde 404 aunque se adivine.
 */
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ addressId: string }> };

export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  const { addressId } = await context.params;
  const body = await parseJsonBody(request, addressPatchBody);

  if (!body.ok) {
    return body.response;
  }

  const result = await withAccessToken((token) => updateAddress(token, addressId, body.data));

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json({ address: result.data }, { headers: { "cache-control": "no-store" } });
}

export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { addressId } = await context.params;
  const result = await withAccessToken((token) => deleteAddress(token, addressId));

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return new NextResponse(null, { status: 204 });
}
