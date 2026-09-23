import type { ProductStatus, ShipmentStatus, StoreStatus } from "./types";

/**
 * Traducción de los estados del panel a claves de mensaje (funciones puras, sin React y sin red).
 *
 * La API devuelve estados en inglés y el panel los cuenta en el idioma del usuario. Se pasan por una lista
 * conocida y lo que no está se cuenta como `unknown`, para no inventar una explicación de un estado que no
 * conocemos (y para que añadir un estado en el backend no rompa la interfaz).
 */

const STORE_STATUSES: readonly StoreStatus[] = ["pending", "approved", "rejected", "suspended"];
const PRODUCT_STATUSES: readonly ProductStatus[] = ["draft", "active", "paused", "closed"];
const SHIPMENT_STATUSES: readonly ShipmentStatus[] = [
  "pending",
  "ready",
  "shipped",
  "in_transit",
  "delivered",
  "returned",
  "cancelled",
];

function toKey<T extends readonly string[]>(values: T, value: string): T[number] | "unknown" {
  return (values as readonly string[]).includes(value) ? (value as T[number]) : "unknown";
}

export function storeStatusKey(status: string): StoreStatus | "unknown" {
  return toKey(STORE_STATUSES, status);
}

export function productStatusKey(status: string): ProductStatus | "unknown" {
  return toKey(PRODUCT_STATUSES, status);
}

export function shipmentStatusKey(status: string): ShipmentStatus | "unknown" {
  return toKey(SHIPMENT_STATUSES, status);
}

/** Tono visual de una insignia. El color nunca es la única señal: siempre va con texto. */
export type SellerTone = "neutral" | "info" | "success" | "warning" | "danger";

const TONES: Record<string, SellerTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  suspended: "danger",
  draft: "neutral",
  active: "success",
  paused: "warning",
  closed: "neutral",
  ready: "info",
  shipped: "info",
  in_transit: "info",
  delivered: "success",
  returned: "danger",
  cancelled: "neutral",
  unknown: "neutral",
};

export function sellerTone(status: string): SellerTone {
  return TONES[status] ?? "neutral";
}
