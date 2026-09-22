import { callBff, type ClientResult } from "@/lib/api/bff-client";

import type {
  CheckoutBody,
  CouponPreview,
  Order,
  Payment,
  ProductReview,
  SandboxOutcome,
  ShippingEstimate,
} from "./types";

/**
 * Cliente del navegador para las rutas BFF de pedidos, pagos y cupones.
 *
 * El navegador solo habla con `/api/...` de nuestro propio dominio: la sesión viaja en cookies httpOnly que
 * gestiona el servidor. La llamada y el formato de los errores viven en `src/lib/api/bff-client.ts`.
 */

/** Crea el pedido. `idempotencyKey` evita duplicarlo si el usuario reintenta. */
export function createOrder(
  body: CheckoutBody & { save_address?: boolean },
  idempotencyKey: string,
): Promise<ClientResult<{ order: Order }>> {
  return callBff({
    method: "POST",
    path: "/api/orders",
    body: { ...body, idempotency_key: idempotencyKey },
  });
}

/** Cancela un pedido pendiente de pago. */
export function cancelOrder(orderId: string): Promise<ClientResult<{ order: Order }>> {
  return callBff({ method: "POST", path: `/api/orders/${encodeURIComponent(orderId)}/cancel` });
}

/** Crea el intento de pago del pedido (pasarela de prueba). */
export function createPayment(
  orderId: string,
  idempotencyKey: string,
): Promise<ClientResult<{ payment: Payment }>> {
  return callBff({
    method: "POST",
    path: `/api/orders/${encodeURIComponent(orderId)}/payments`,
    body: { idempotency_key: idempotencyKey },
  });
}

/** Aprueba o rechaza el pago de prueba. */
export function simulatePayment(
  paymentId: string,
  outcome: SandboxOutcome,
): Promise<ClientResult<{ payment: Payment }>> {
  return callBff({
    method: "POST",
    path: `/api/payments/${encodeURIComponent(paymentId)}/simulate`,
    body: { outcome },
  });
}

/** Comprueba un cupón contra el carrito actual (no lo consume). */
export function validateCoupon(code: string): Promise<ClientResult<{ coupon: CouponPreview }>> {
  return callBff({ method: "POST", path: "/api/coupons/validate", body: { code } });
}

/** Estimación de entrega de un producto para un país (dato público, sin sesión). */
export function fetchShippingEstimate(
  productId: string,
  country: string,
): Promise<ClientResult<ShippingEstimate>> {
  const query = new URLSearchParams({ productId, country });

  return callBff({ method: "GET", path: `/api/shipping/estimate?${query.toString()}` });
}

/** Publica la reseña de un producto comprado y recibido. */
export function createReview(body: {
  product_id: string;
  rating: number;
  title: string | null;
  body: string | null;
}): Promise<ClientResult<{ review: ProductReview }>> {
  return callBff({ method: "POST", path: "/api/reviews", body });
}
