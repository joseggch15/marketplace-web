/**
 * Códigos de error estables de la API que puede mostrar el checkout y «Mis compras».
 *
 * La API responde con Problem Details (RFC 9457) y un campo `code` estable; el frontend traduce **siempre por
 * ese código**, nunca por el texto en inglés. Si llega un código desconocido se usa `unknown`, para no enseñar
 * nunca un código crudo al usuario.
 */

const CHECKOUT_CODES = [
  "cart_empty",
  "insufficient_stock",
  "product_not_available",
  "variant_not_found",
  "unauthorized",
  "validation_error",
  "too_many_requests",
  "not_found",
  "forbidden",
  "order_not_payable",
  "order_already_paid",
  "simulation_not_allowed",
  "internal_error",
  "network_error",
] as const;

export type CheckoutErrorCode = (typeof CHECKOUT_CODES)[number];

export function checkoutErrorKey(code: unknown): CheckoutErrorCode | "unknown" {
  if (typeof code !== "string") {
    return "unknown";
  }

  return (CHECKOUT_CODES as readonly string[]).includes(code)
    ? (code as CheckoutErrorCode)
    : "unknown";
}

const COUPON_CODES = [
  "coupon_not_found",
  "coupon_not_started",
  "coupon_expired",
  "min_purchase_not_met",
  "coupon_usage_limit",
  "coupon_user_limit",
  "validation_error",
  "unauthorized",
  "too_many_requests",
  "network_error",
] as const;

export type CouponErrorCode = (typeof COUPON_CODES)[number];

export function couponErrorKey(code: unknown): CouponErrorCode | "unknown" {
  if (typeof code !== "string") {
    return "unknown";
  }

  return (COUPON_CODES as readonly string[]).includes(code) ? (code as CouponErrorCode) : "unknown";
}

const ORDER_CODES = [
  "order_not_found",
  "purchase_required",
  "review_exists",
  "invalid_status_transition",
  "not_store_owner",
  "validation_error",
  "unauthorized",
  "forbidden",
  "too_many_requests",
  "internal_error",
  "network_error",
] as const;

export type OrderErrorCode = (typeof ORDER_CODES)[number];

export function orderErrorKey(code: unknown): OrderErrorCode | "unknown" {
  if (typeof code !== "string") {
    return "unknown";
  }

  return (ORDER_CODES as readonly string[]).includes(code) ? (code as OrderErrorCode) : "unknown";
}
