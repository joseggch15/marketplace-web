import type { BackendResult } from "@/features/auth/api";
import { problemCode } from "@/features/auth/error-codes";
import { backend } from "@/lib/api/client";

import type {
  CategoryAttribute,
  NewProduct,
  NewShipment,
  NewStore,
  ProductChanges,
  ProductImage,
  SellerOrderPage,
  SellerOrderStatus,
  SellerProduct,
  SellerSale,
  SellerStore,
  Shipment,
  ShipmentChanges,
  ShipmentStatus,
  StoreChanges,
  UploadUrl,
} from "./types";

/**
 * Acceso al panel del vendedor desde el **servidor** (rutas BFF y Server Components).
 *
 * Mismo patrón que el resto del proyecto: nunca lanza excepciones (devuelve un resultado discriminado con el
 * `code` estable de la API) y siempre recibe el **access token** desde el servidor, porque el navegador no ve
 * tokens nunca.
 *
 * Dos reglas del backend que se reflejan aquí sin inventar nada:
 * - El stock de una variante se manda como **valor absoluto** (lo que hay en el almacén), no como incremento.
 * - Las imágenes se suben **desde el servidor**: se pide una URL firmada, se suben los bytes y luego se adjunta
 *   la clave al producto. Así el navegador no depende del CORS del almacenamiento.
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

/** La tienda del vendedor con sesión. Si no tiene, el backend responde 403 `seller_required`. */
export function getMyStore(accessToken: string): Promise<BackendResult<SellerStore>> {
  return unwrap(backend.GET("/api/v1/sellers/me", { headers: bearer(accessToken), ...noStore }));
}

/** Solicita crear la tienda (queda `pending` hasta que el administrador la apruebe). */
export function createStore(
  accessToken: string,
  body: NewStore,
): Promise<BackendResult<SellerStore>> {
  return unwrap(
    backend.POST("/api/v1/sellers/me", { body, headers: bearer(accessToken), ...noStore }),
  );
}

/** Cambia el nombre o la descripción de la propia tienda. */
export function updateStore(
  accessToken: string,
  body: StoreChanges,
): Promise<BackendResult<SellerStore>> {
  return unwrap(
    backend.PATCH("/api/v1/sellers/me", { body, headers: bearer(accessToken), ...noStore }),
  );
}

/**
 * Productos **de mi tienda** (`GET /catalog/products`).
 *
 * La API devuelve la lista completa (no acepta filtros ni cursor): es el mismo endpoint para cualquier
 * vendedor, así que la pantalla ordena y filtra en el servidor del frontend sobre lo que llega.
 */
export function listMyProducts(accessToken: string): Promise<BackendResult<SellerProduct[]>> {
  return unwrap(
    backend.GET("/api/v1/catalog/products", { headers: bearer(accessToken), ...noStore }),
  );
}

/** Un producto propio, con sus variantes e imágenes. */
export function getProduct(
  accessToken: string,
  productId: string,
): Promise<BackendResult<SellerProduct>> {
  return unwrap(
    backend.GET("/api/v1/catalog/products/{product_id}", {
      params: { path: { product_id: productId } },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Crea un producto con sus variantes (nace en borrador). */
export function createProduct(
  accessToken: string,
  body: NewProduct,
): Promise<BackendResult<SellerProduct>> {
  return unwrap(
    backend.POST("/api/v1/catalog/products", { body, headers: bearer(accessToken), ...noStore }),
  );
}

/** Cambia título, descripción y marca. La API **no** admite precio ni variantes por aquí. */
export function updateProduct(
  accessToken: string,
  productId: string,
  body: ProductChanges,
): Promise<BackendResult<SellerProduct>> {
  return unwrap(
    backend.PATCH("/api/v1/catalog/products/{product_id}", {
      params: { path: { product_id: productId } },
      body,
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Publica, pausa o cierra un producto (los tres estados que acepta la API). */
export function setProductPublication(
  accessToken: string,
  productId: string,
  action: "publish" | "pause" | "close",
): Promise<BackendResult<SellerProduct>> {
  const path =
    action === "publish"
      ? "/api/v1/catalog/products/{product_id}/publish"
      : action === "pause"
        ? "/api/v1/catalog/products/{product_id}/pause"
        : "/api/v1/catalog/products/{product_id}/close";

  return unwrap(
    backend.POST(path, {
      params: { path: { product_id: productId } },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Cambia el stock de una variante propia (**valor absoluto**) y devuelve el producto actualizado. */
export function updateVariantStock(
  accessToken: string,
  productId: string,
  variantId: string,
  stock: number,
): Promise<BackendResult<SellerProduct>> {
  return unwrap(
    backend.PATCH("/api/v1/catalog/products/{product_id}/variants/{variant_id}/stock", {
      params: { path: { product_id: productId, variant_id: variantId } },
      body: { stock },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Pide una URL firmada para subir una imagen (la clave se usa después para adjuntarla). */
export function requestUploadUrl(
  accessToken: string,
  contentType: string,
  extension: string,
): Promise<BackendResult<UploadUrl>> {
  return unwrap(
    backend.POST("/api/v1/catalog/images/upload-url", {
      body: { content_type: contentType, extension },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/**
 * Sube los bytes a la URL firmada.
 *
 * Es la única llamada del proyecto que no va al backend de la API: va al almacenamiento (MinIO/S3). Se hace
 * **desde el servidor** a propósito, para no depender del CORS del almacenamiento ni exponer la URL firmada al
 * navegador. No se manda sesión ninguna: la URL ya lleva su propia firma.
 */
export async function uploadImageBytes(
  uploadUrl: string,
  contentType: string,
  bytes: ArrayBuffer,
): Promise<boolean> {
  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "content-type": contentType },
      body: bytes,
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}

/** Adjunta al producto una imagen ya subida (clave, texto alternativo y posición). */
export function attachImage(
  accessToken: string,
  productId: string,
  body: { object_key: string; alt: string | null; position: number },
): Promise<BackendResult<ProductImage>> {
  return unwrap(
    backend.POST("/api/v1/catalog/products/{product_id}/images", {
      params: { path: { product_id: productId } },
      body,
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Quita una imagen del producto. La API responde 204 sin cuerpo. */
export function deleteImage(
  accessToken: string,
  productId: string,
  imageId: string,
): Promise<BackendResult<undefined>> {
  return unwrap(
    backend.DELETE("/api/v1/catalog/products/{product_id}/images/{image_id}", {
      params: { path: { product_id: productId, image_id: imageId } },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Ventas (sub-órdenes) de mi tienda, paginadas por cursor. */
export function listSellerOrders(
  accessToken: string,
  { limit = 20, cursor }: { limit?: number; cursor?: string | null } = {},
): Promise<BackendResult<SellerOrderPage>> {
  return unwrap(
    backend.GET("/api/v1/seller/orders", {
      params: { query: { limit, cursor: cursor ?? undefined } },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Avanza el estado de una venta (`processing` → `shipped` → `delivered`). */
export function updateSaleStatus(
  accessToken: string,
  sellerOrderId: string,
  status: SellerOrderStatus,
): Promise<BackendResult<SellerSale>> {
  return unwrap(
    backend.PATCH("/api/v1/seller/orders/{seller_order_id}/status", {
      params: { path: { seller_order_id: sellerOrderId }, query: { status } },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** El envío de una venta, con su línea de tiempo. */
export function getShipment(
  accessToken: string,
  sellerOrderId: string,
): Promise<BackendResult<Shipment>> {
  return unwrap(
    backend.GET("/api/v1/seller/orders/{seller_order_id}/shipment", {
      params: { path: { seller_order_id: sellerOrderId } },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Prepara el envío de una venta (transportadora, guía, costo). */
export function createShipment(
  accessToken: string,
  sellerOrderId: string,
  body: NewShipment,
): Promise<BackendResult<Shipment>> {
  return unwrap(
    backend.POST("/api/v1/seller/orders/{seller_order_id}/shipment", {
      params: { path: { seller_order_id: sellerOrderId } },
      body,
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Corrige los datos del envío ya preparado. */
export function updateShipment(
  accessToken: string,
  sellerOrderId: string,
  body: ShipmentChanges,
): Promise<BackendResult<Shipment>> {
  return unwrap(
    backend.PATCH("/api/v1/seller/orders/{seller_order_id}/shipment", {
      params: { path: { seller_order_id: sellerOrderId } },
      body,
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Anota un avance del envío (por ejemplo, «en tránsito» o «entregado»). */
export function updateShipmentStatus(
  accessToken: string,
  sellerOrderId: string,
  status: ShipmentStatus,
  description: string | null,
): Promise<BackendResult<Shipment>> {
  return unwrap(
    backend.POST("/api/v1/seller/orders/{seller_order_id}/shipment/status", {
      params: {
        path: { seller_order_id: sellerOrderId },
        query: { status, description: description ?? undefined },
      },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/**
 * Atributos que admite una categoría (`GET /catalog/categories/{id}/attributes`).
 *
 * Son **públicos**: la API no pide sesión para leerlos. Se piden al elegir la categoría en el formulario de
 * producto, porque el vendedor tiene que escribir valores para uno de esos atributos (así nacen las variantes).
 */
export function listCategoryAttributes(
  categoryId: string,
): Promise<BackendResult<CategoryAttribute[]>> {
  return unwrap(
    backend.GET("/api/v1/catalog/categories/{category_id}/attributes", {
      params: { path: { category_id: categoryId } },
      ...noStore,
    }),
  );
}
