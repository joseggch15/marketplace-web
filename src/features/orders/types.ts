import type { components } from "@/lib/api/schema";

/**
 * Tipos de pedidos y pagos, tomados **siempre** del esquema generado (`pnpm api:types`).
 *
 * Este es el único archivo de la feature que pueden importar los componentes cliente: solo contiene tipos (se
 * borran al compilar), así que no arrastra `@/lib/api/client`, que lanza un error si llega al navegador.
 */

export type Order = components["schemas"]["OrderOut"];
export type OrderSummary = components["schemas"]["OrderSummaryOut"];
export type OrderList = components["schemas"]["OrderListOut"];
export type SellerOrder = components["schemas"]["SellerOrderOut"];
export type SellerOrderSummary = components["schemas"]["SellerOrderSummaryOut"];
export type OrderItem = components["schemas"]["OrderItemOut"];
export type Payment = components["schemas"]["PaymentOut"];
export type Shipment = components["schemas"]["ShipmentOut"];
export type CouponPreview = components["schemas"]["CouponValidateOut"];
export type ShippingEstimate = components["schemas"]["ShippingEstimateOut"];
export type PublicStore = components["schemas"]["PublicStoreOut"];
export type ShippingAddress = components["schemas"]["ShippingAddressIn"];
export type CheckoutBody = components["schemas"]["CheckoutRequest"];
export type ProductReview = components["schemas"]["ReviewOut"];

/**
 * Resultados del simulador de la pasarela de prueba.
 *
 * El backend acepta además `refunded`, pero el prototipo no ofrece reembolsos desde la interfaz: el comprador
 * solo **aprueba** o **rechaza** (decisión del dueño: sin dinero real y solo esos dos caminos).
 */
export const SANDBOX_OUTCOMES = ["succeeded", "failed"] as const;
export type SandboxOutcome = (typeof SANDBOX_OUTCOMES)[number];

/** Dirección de envío tal como la usa la interfaz (sin la etiqueta del libro de direcciones). */
export type ShippingAddressForm = {
  recipient: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};
