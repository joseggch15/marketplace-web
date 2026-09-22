import type { BackendResult } from "@/features/auth/api";
import { problemCode } from "@/features/auth/error-codes";
import { backend } from "@/lib/api/client";

import type {
  CheckoutBody,
  CouponPreview,
  Order,
  OrderList,
  Payment,
  ProductReview,
  PublicStore,
  SandboxOutcome,
  Shipment,
  ShippingEstimate,
} from "./types";

/**
 * Pedidos, pagos y cupones desde el **servidor** (rutas BFF y Server Components).
 *
 * Nunca lanza excepciones: devuelve un resultado discriminado, igual que el resto de las features. Todas las
 * operaciones que necesitan sesión reciben el **access token** desde el servidor: el navegador nunca lo ve.
 *
 * Dos detalles que vienen del backend y conviene recordar:
 * - **Idempotencia**: crear el pedido y crear el pago aceptan `Idempotency-Key`. Si el navegador reintenta con
 *   la misma clave, el backend devuelve el mismo pedido o el mismo intento de pago en lugar de duplicarlo.
 * - **La pasarela es de prueba** (`sandbox`): el intento de pago se aprueba o se rechaza con
 *   `POST /payments/{id}/simulate?outcome=…`, que recorre el mismo camino que un webhook real.
 */

const noStore = { cache: "no-store" } as const;

type Outcome<T> = { data?: T; error?: unknown; response: Response };

/** Convierte la respuesta en resultado, sin lanzar nunca. Un fallo de red es `status: 0`. */
async function unwrap<T>(outcome: Promise<Outcome<T>>): Promise<BackendResult<T>> {
  try {
    const { data, error, response } = await outcome;

    if (response.ok && data !== undefined) {
      return { ok: true, data };
    }

    return { ok: false, status: response.status, code: problemCode(error) };
  } catch {
    return { ok: false, status: 0, code: null };
  }
}

function bearer(accessToken: string) {
  return { authorization: `Bearer ${accessToken}` };
}

/** Crea el pedido a partir del carrito (`POST /orders`), con clave de idempotencia. */
export function createOrder(
  accessToken: string,
  body: CheckoutBody,
  idempotencyKey: string,
): Promise<BackendResult<Order>> {
  return unwrap(
    backend.POST("/api/v1/orders", {
      body,
      headers: { ...bearer(accessToken), "Idempotency-Key": idempotencyKey },
      ...noStore,
    }),
  );
}

/** Mis compras, paginadas por cursor. */
export function listOrders(
  accessToken: string,
  { limit = 20, cursor }: { limit?: number; cursor?: string | null } = {},
): Promise<BackendResult<OrderList>> {
  return unwrap(
    backend.GET("/api/v1/orders", {
      params: { query: { limit, cursor: cursor ?? undefined } },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Detalle de un pedido propio. */
export function getOrder(accessToken: string, orderId: string): Promise<BackendResult<Order>> {
  return unwrap(
    backend.GET("/api/v1/orders/{order_id}", {
      params: { path: { order_id: orderId } },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Cancela un pedido pendiente de pago (el backend libera el stock reservado). */
export function cancelOrder(accessToken: string, orderId: string): Promise<BackendResult<Order>> {
  return unwrap(
    backend.POST("/api/v1/orders/{order_id}/cancel", {
      params: { path: { order_id: orderId } },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Intentos de pago de un pedido (el más reciente es el que interesa para el estado del pago). */
export function listOrderPayments(
  accessToken: string,
  orderId: string,
): Promise<BackendResult<Payment[]>> {
  return unwrap(
    backend.GET("/api/v1/orders/{order_id}/payments", {
      params: { path: { order_id: orderId } },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Crea el intento de pago de un pedido (`POST /orders/{id}/payments`). */
export function createPayment(
  accessToken: string,
  orderId: string,
  idempotencyKey: string,
): Promise<BackendResult<Payment>> {
  return unwrap(
    backend.POST("/api/v1/orders/{order_id}/payments", {
      params: { path: { order_id: orderId } },
      headers: { ...bearer(accessToken), "Idempotency-Key": idempotencyKey },
      ...noStore,
    }),
  );
}

/** Estado actual de un intento de pago. */
export function getPayment(
  accessToken: string,
  paymentId: string,
): Promise<BackendResult<Payment>> {
  return unwrap(
    backend.GET("/api/v1/payments/{payment_id}", {
      params: { path: { payment_id: paymentId } },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Aprueba o rechaza el pago en la pasarela de prueba (recorre el camino de un webhook real). */
export function simulatePayment(
  accessToken: string,
  paymentId: string,
  outcome: SandboxOutcome,
): Promise<BackendResult<Payment>> {
  return unwrap(
    backend.POST("/api/v1/payments/{payment_id}/simulate", {
      params: { path: { payment_id: paymentId }, query: { outcome } },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Envíos de un pedido (transportadora, guía y fechas reales). */
export function listShipments(
  accessToken: string,
  orderId: string,
): Promise<BackendResult<Shipment[]>> {
  return unwrap(
    backend.GET("/api/v1/orders/{order_id}/shipments", {
      params: { path: { order_id: orderId } },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Vista previa del cupón sobre el carrito actual (no lo consume). */
export function validateCoupon(
  accessToken: string,
  code: string,
): Promise<BackendResult<CouponPreview>> {
  return unwrap(
    backend.POST("/api/v1/coupons/validate", {
      body: { code },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Publica una reseña de un producto comprado y recibido (`POST /reviews`). */
export function createReview(
  accessToken: string,
  body: { product_id: string; rating: number; title?: string | null; body?: string | null },
): Promise<BackendResult<ProductReview>> {
  return unwrap(
    backend.POST("/api/v1/reviews", {
      body,
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/**
 * Estimación de entrega de un producto (`GET /catalog/products/{id}/shipping`).
 *
 * Es un dato **público** (no necesita sesión) y de solo lectura: se sirve por una ruta propia para que el
 * navegador no hable nunca con el backend. La API declara en `source` que es una estimación, y la interfaz lo
 * dice igual: no es una promesa de la transportadora.
 */
export function estimateShipping(
  productId: string,
  country: string | null,
): Promise<BackendResult<ShippingEstimate>> {
  return unwrap(
    backend.GET("/api/v1/catalog/products/{product_id}/shipping", {
      params: {
        path: { product_id: productId },
        query: { country: country ?? undefined },
      },
      ...noStore,
    }),
  );
}

/**
 * Datos **públicos** de una tienda (`GET /stores/{store_id}`).
 *
 * El pedido agrupa las líneas por vendedor y solo trae `store_id`, así que para escribir «vendido por…» en el
 * detalle se piden los datos públicos de cada tienda (nombre y reputación, nada interno del vendedor). Si la
 * tienda no responde, el detalle sigue funcionando y escribe el texto genérico.
 */
export function fetchPublicStore(storeId: string): Promise<BackendResult<PublicStore>> {
  return unwrap(
    backend.GET("/api/v1/stores/{store_id}", {
      params: { path: { store_id: storeId } },
      ...noStore,
    }),
  );
}

/**
 * Productos que este usuario **ya** reseñó, de una lista dada.
 * La API no tiene un listado de «mis reseñas»: las reseñas se piden por producto. Así que, para saber si una
 * línea se puede reseñar, se piden las reseñas publicadas de esos productos (pocos: solo los entregados) y se
 * busca una del usuario. Sin suposiciones: si la petición falla, el producto se cuenta como **no** reseñado y
 * el backend decidirá al enviar el formulario (responde `review_exists` si ya existía).
 */
export async function reviewedProductIds(
  accessToken: string,
  userId: string,
  productIds: string[],
): Promise<Set<string>> {
  const reviewed = await Promise.all(
    productIds.map(async (productId) => {
      const result = await unwrap(
        backend.GET("/api/v1/products/{product_id}/reviews", {
          params: { path: { product_id: productId }, query: { limit: 100 } },
          ...noStore,
        }),
      );

      if (!result.ok) {
        return null;
      }

      return result.data.items.some((review) => review.user_id === userId) ? productId : null;
    }),
  );

  return new Set(reviewed.filter((id): id is string => id !== null));
}
