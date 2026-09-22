import { NextResponse } from "next/server";
import { z } from "zod";

import { backendProblem, parseJsonBody, unauthorizedResponse } from "@/features/auth/bff";
import { createAddress } from "@/features/auth/api";
import { withAccessToken } from "@/features/auth/session";
import { createOrder, listOrders } from "@/features/orders/api";
import { createOrderBodySchema } from "@/features/orders/schemas";

/**
 * `GET  /api/orders` — mis compras (paginadas por cursor).
 * `POST /api/orders` — crea el pedido a partir del carrito (checkout).
 *
 * El checkout **siempre** lo calcula el backend: aquí se reenvía la dirección, el cupón y las notas, y nada más.
 * El navegador solo puede influir en esos tres datos; los precios, el envío y el descuento son del servidor.
 *
 * **Idempotencia**: el navegador genera una clave al empezar el intento y la manda; se reenvía como cabecera
 * `Idempotency-Key`, así que reintentar (doble clic, red que se cae) devuelve el mismo pedido en lugar de crear
 * dos. La clave se valida aquí porque es un dato que llega de fuera.
 *
 * Si el comprador pidió guardar la dirección (`save_address`), se guarda **después** de crear el pedido y solo
 * si el pedido salió bien: si algo falla, no queda una dirección suelta en su cuenta.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" } as const;

/** La clave de idempotencia es opaca, pero se limita: sin esto, cualquiera podría mandar algo enorme. */
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

/** Cuerpo del checkout: los datos del pedido más la clave de idempotencia que manda el navegador. */
const orderBodySchema = createOrderBodySchema.extend({
  idempotency_key: z.string().min(8, "invalid").max(128, "invalid"),
});

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const cursor = url.searchParams.get("cursor");

  const result = await withAccessToken((token) =>
    listOrders(token, {
      limit: Number.isInteger(limit) && limit >= 1 && limit <= 100 ? limit : 20,
      cursor: cursor !== null && cursor.length <= 512 ? cursor : null,
    }),
  );

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  return NextResponse.json(result.data, { headers: noStore });
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await parseJsonBody(request, orderBodySchema);

  if (!body.ok) {
    return body.response;
  }

  const { idempotency_key: idempotencyKey, save_address: saveAddress, ...checkout } = body.data;

  if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "validation_error",
        status: 422,
        detail: "The idempotency key is not valid.",
        code: "validation_error",
      },
      { status: 422, headers: { "content-type": "application/problem+json" } },
    );
  }

  const result = await withAccessToken((token) => createOrder(token, checkout, idempotencyKey));

  if (!result.ok) {
    return result.status === 401 ? unauthorizedResponse() : backendProblem(result);
  }

  if (saveAddress) {
    // Mejor esfuerzo: si no se puede guardar la dirección, el pedido ya está hecho y se sigue.
    await withAccessToken((token) =>
      createAddress(token, {
        label: "Envío",
        recipient_name: checkout.shipping_address.recipient,
        line1: checkout.shipping_address.line1,
        line2: checkout.shipping_address.line2,
        city: checkout.shipping_address.city,
        state: checkout.shipping_address.state,
        postal_code: checkout.shipping_address.postal_code,
        country: checkout.shipping_address.country,
        phone: checkout.shipping_address.phone,
        is_default: false,
      }),
    );
  }

  return NextResponse.json({ order: result.data }, { status: 201, headers: noStore });
}
