import { z } from "zod";

import type { Address } from "@/features/auth/types";

import type { AddressFormValues } from "./forms";
import { SANDBOX_OUTCOMES } from "./types";
/**
 * Validación del checkout (Zod).
 *
 * Se usa **dos veces**: en el formulario (React Hook Form) para avisar campo a campo y en la **ruta BFF**, que
 * vuelve a validar antes de hablar con el backend. El servidor no se fía nunca de lo que llega del navegador.
 *
 * Los límites son los mismos que impone la API (`ShippingAddressIn` en `app/modules/orders/schemas.py`), así que
 * un dato que pasa aquí no rebota allá.
 */

const trimmed = (max: number) => z.string().trim().max(max);

/**
 * Un texto opcional que puede llegar como `null` (así lo manda el navegador cuando el usuario no escribe nada) se
 * normaliza a `null`. Se usa `nullish()` y no `optional()` a propósito: el cliente envía `null`, no `undefined`.
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "tooLong")
    .nullish()
    .transform((value) =>
      value === undefined || value === null || value.length === 0 ? null : value,
    );

export const shippingAddressSchema = z.object({
  recipient: trimmed(120).min(1, "required"),
  phone: optionalText(30),
  line1: trimmed(200).min(1, "required"),
  line2: optionalText(200),
  city: trimmed(120).min(1, "required"),
  state: optionalText(120),
  postal_code: optionalText(20),
  /** Código ISO 3166-1 alfa-2: dos letras. Se guarda en mayúsculas. */
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "country"),
});

export type ShippingAddressValues = z.input<typeof shippingAddressSchema>;
export type ShippingAddressData = z.output<typeof shippingAddressSchema>;

/** Cuerpo que acepta la ruta BFF al crear el pedido. */
export const createOrderBodySchema = z.object({
  shipping_address: shippingAddressSchema,
  coupon_code: optionalText(40).transform((value) => (value === null ? null : value.toUpperCase())),
  notes: optionalText(1000),
  /** Guardar además la dirección en la cuenta del comprador (lo hace la ruta BFF, no el backend de pedidos). */
  save_address: z
    .boolean()
    .nullish()
    .transform((value) => value ?? false),
});

export type CreateOrderValues = z.input<typeof createOrderBodySchema>;
export type CreateOrderData = z.output<typeof createOrderBodySchema>;

/** Cuerpo de la ruta que aprueba o rechaza el pago de prueba. */
export const simulatePaymentBodySchema = z.object({
  outcome: z.enum(SANDBOX_OUTCOMES),
});

/** Cuerpo de la ruta que comprueba un cupón. */
export const couponCodeBodySchema = z.object({
  code: z.string().trim().min(1, "required").max(40, "notFound"),
});

/** Cuerpo de la ruta que publica una reseña. */
export const reviewBodySchema = z.object({
  product_id: z.uuid("invalid"),
  rating: z.coerce.number().int("invalid").min(1, "min").max(5, "max"),
  title: optionalText(120),
  body: optionalText(2000),
});

export type ReviewValues = z.input<typeof reviewBodySchema>;

/**
 * Convierte una dirección guardada del libro de direcciones en los valores del **formulario** del checkout.
 *
 * El nombre del campo cambia (`recipient_name` → `recipient`) porque la API usa modelos distintos para la libreta
 * de direcciones y para la dirección de envío del pedido; la conversión se hace aquí y en un solo sitio. El campo
 * `postal_code` de la API se llamaba igual y en el formulario es `postalCode`; el esquema de la ruta BFF lo vuelve
 * a normalizar a `postal_code` antes de hablar con el backend.
 */
export function toShippingAddressValues(address: Address): AddressFormValues {
  return {
    recipient: address.recipient_name,
    phone: address.phone ?? "",
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state ?? "",
    postalCode: address.postal_code ?? "",
    country: address.country,
  };
}

/**
 * Clave de idempotencia del pedido y del pago.
 *
 * Se genera **en el navegador** al empezar el intento y se reutiliza en los reintentos: así, si la petición se
 * repite (doble clic, red que se cae), el backend devuelve el mismo pedido en lugar de crear dos. `crypto.
 * randomUUID` existe en todos los navegadores soportados y en Node; el respaldo evita romperse en un entorno
 * viejo.
 */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `checkout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
