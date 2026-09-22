import type { Order, OrderItem, SellerOrder, SellerOrderSummary } from "./types";

/**
 * Reglas de estado de un pedido (funciones puras, sin React y sin red: se prueban solas).
 *
 * La **máquina de estados es del backend** y aquí solo se traduce y se decide qué ofrecer en la interfaz. Los
 * estados posibles son los que devuelve la API:
 *
 * - Pedido (`order.status`): `pending` → `paid` → `completed`, o `cancelled` / `refunded`.
 * - Sub-orden del vendedor (`seller_order.status`): `pending` → `processing` → `shipped` → `delivered`, o
 *   `cancelled` (`SELLER_ORDER_TRANSITIONS` en `app/modules/orders/service.py`).
 * - Pago (`payment_status`): `pending`, `paid`, `failed`, `refunded`.
 *
 * Nada de esto se inventa en el navegador: el botón de cancelar solo aparece cuando el pedido está `pending`
 * (que es exactamente lo que acepta el backend), y la reseña solo se ofrece cuando la sub-orden está
 * `delivered` (el backend solo admite reseñar productos **recibidos**).
 */

const ORDER_STATUSES = ["pending", "paid", "completed", "cancelled", "refunded"] as const;
/**
 * Estados de un **pago**. El desenlace correcto de la pasarela es `succeeded` (y la orden pasa a
 * `payment_status: paid`), así que aquí se reconocen los dos, más `processing` (intento en curso) y `failed`.
 */
const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "succeeded",
  "paid",
  "failed",
  "refunded",
] as const;
const SELLER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

export type OrderStatusKey = (typeof ORDER_STATUSES)[number] | "unknown";
export type PaymentStatusKey = (typeof PAYMENT_STATUSES)[number] | "unknown";
export type SellerStatusKey = (typeof SELLER_STATUSES)[number] | "unknown";

function toKey<T extends readonly string[]>(values: T, value: string): T[number] | "unknown" {
  return (values as readonly string[]).includes(value) ? (value as T[number]) : "unknown";
}

export function orderStatusKey(status: string): OrderStatusKey {
  return toKey(ORDER_STATUSES, status);
}

export function paymentStatusKey(status: string): PaymentStatusKey {
  return toKey(PAYMENT_STATUSES, status);
}

export function sellerStatusKey(status: string): SellerStatusKey {
  return toKey(SELLER_STATUSES, status);
}

/** Tono visual de cada estado (el color nunca es la única señal: siempre va acompañado de texto). */
export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

const ORDER_STATUS_TONES: Record<OrderStatusKey, StatusTone> = {
  pending: "warning",
  paid: "info",
  completed: "success",
  cancelled: "neutral",
  refunded: "danger",
  unknown: "neutral",
};

export function orderStatusTone(status: OrderStatusKey): StatusTone {
  return ORDER_STATUS_TONES[status];
}

/** ¿El intento de pago terminó bien? (`succeeded` es el desenlace de la pasarela; `paid` es el de la orden.) */
export function paymentSucceeded(status: string): boolean {
  return status === "succeeded" || status === "paid";
}

/** Solo se puede cancelar un pedido que sigue pendiente de pago (regla del backend). */
export function canCancelOrder(order: Pick<Order, "status">): boolean {
  return order.status === "pending";
}

/**
 * ¿Se puede reseñar esta línea?
 *
 * Hace falta que la sub-orden del vendedor esté **entregada** (así lo exige el backend: `purchase_required`) y
 * que el producto no tenga ya una reseña del usuario. `reviewedProductIds` son los productos que el usuario ya
 * reseñó: los trae la propia página desde la API, nunca se suponen en el navegador.
 */
export function canReviewItem(
  sellerOrder: Pick<SellerOrder | SellerOrderSummary, "status">,
  item: Pick<OrderItem, "product_id">,
  reviewedProductIds: ReadonlySet<string>,
): boolean {
  if (sellerOrder.status !== "delivered" || item.product_id === null) {
    return false;
  }

  return !reviewedProductIds.has(item.product_id);
}

/** Línea de tiempo del pedido, con los eventos **reales** y sus fechas confirmadas. */
export type TimelineEntry = {
  id: string;
  labelKey: "created" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  date: string | null;
  state: "done" | "current" | "upcoming" | "failed";
};

/** Envíos reales del pedido (lo único que trae fechas de envío y de entrega). */
export type ShipmentLike = {
  status: string;
  shipped_at: string | null;
  delivered_at: string | null;
};

/**
 * Construye la línea de tiempo del pedido.
 *
 * Solo usa datos que la API devuelve de verdad: la fecha de creación del pedido, la del pago confirmado (el
 * `paid_at` del intento pagado) y, por cada envío, `shipped_at` y `delivered_at`. Un paso que aún no ha
 * ocurrido se marca como «próximo» y su fecha queda sin confirmar: la interfaz escribe «pendiente de
 * confirmar» en lugar de inventarse una fecha.
 */
export function buildTimeline(
  order: Order,
  context: { paidAt: string | null; shipments: ShipmentLike[] },
): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    { id: "created", labelKey: "created", date: order.created_at, state: "done" },
  ];

  if (order.status === "cancelled") {
    entries.push({ id: "cancelled", labelKey: "cancelled", date: null, state: "failed" });
    return entries;
  }

  if (order.status === "refunded") {
    entries.push({ id: "refunded", labelKey: "refunded", date: null, state: "failed" });
    return entries;
  }

  const shipped = context.shipments.find((shipment) => shipment.shipped_at !== null) ?? null;
  const delivered = context.shipments.find((shipment) => shipment.delivered_at !== null) ?? null;
  const paid =
    order.status === "paid" || order.status === "completed" || order.payment_status === "paid";

  entries.push({
    id: "paid",
    labelKey: "paid",
    date: paid ? context.paidAt : null,
    state: paid ? "done" : "current",
  });

  const sellerStatuses = order.seller_orders.map((sellerOrder) => sellerOrder.status);
  const isDelivered =
    order.status === "completed" || sellerStatuses.every((status) => status === "delivered");
  const isProcessing = sellerStatuses.some(
    (status) => status === "processing" || status === "shipped",
  );

  entries.push({
    id: "shipped",
    labelKey: "shipped",
    date: shipped?.shipped_at ?? null,
    state:
      shipped !== null || (isDelivered && !isProcessing)
        ? "done"
        : isProcessing
          ? "current"
          : "upcoming",
  });

  entries.push({
    id: "delivered",
    labelKey: "delivered",
    date: delivered?.delivered_at ?? null,
    state: isDelivered ? "done" : "upcoming",
  });

  return entries;
}

/** Suma de unidades del pedido (para el resumen y para la vista de detalle). */
export function totalUnits(order: Pick<Order, "seller_orders">): number {
  return order.seller_orders.reduce(
    (total, sellerOrder) =>
      total + sellerOrder.items.reduce((subtotal, item) => subtotal + item.quantity, 0),
    0,
  );
}

/** Todas las líneas del pedido, en el orden en que las agrupa el backend (por vendedor). */
export function allItems(order: Pick<Order, "seller_orders">): OrderItem[] {
  return order.seller_orders.flatMap((sellerOrder) => sellerOrder.items);
}
