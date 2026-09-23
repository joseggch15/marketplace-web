import { callBff, type ClientResult } from "@/lib/api/bff-client";

import type { ProductFormData } from "./schemas";
import type {
  CategoryAttribute,
  NewShipment,
  NewStore,
  ProductChanges,
  ProductImage,
  SellerOrderStatus,
  SellerProduct,
  SellerSale,
  SellerStore,
  Shipment,
  ShipmentChanges,
  ShipmentStatus,
  StoreChanges,
} from "./types";

/**
 * Cliente del navegador para las rutas BFF del panel del vendedor.
 *
 * El navegador solo habla con `/api/...` de nuestro propio dominio; la sesión viaja en cookies httpOnly que
 * gestiona el servidor y los tokens no salen nunca de ahí. La llamada y el formato de los errores viven en
 * `src/lib/api/bff-client.ts`.
 */

/** Solicita crear la tienda. */
export function createStore(body: NewStore): Promise<ClientResult<{ store: SellerStore }>> {
  return callBff({ method: "POST", path: "/api/seller/store", body });
}

/** Cambia el nombre o la descripción de la tienda. */
export function updateStore(body: StoreChanges): Promise<ClientResult<{ store: SellerStore }>> {
  return callBff({ method: "PATCH", path: "/api/seller/store", body });
}

/**
 * Crea un producto con sus variantes.
 *
 * Se manda lo que escribió el vendedor (valores de los atributos incluidos) y **no** la lista de variantes: el
 * servidor la construye con el producto cartesiano, igual que hace el formulario para la vista previa. Así el
 * navegador no puede inventar SKU ni variantes que no salgan de los valores escritos.
 */
export function createProduct(
  body: ProductFormData,
): Promise<ClientResult<{ product: SellerProduct }>> {
  return callBff({ method: "POST", path: "/api/seller/products", body });
}

/** Cambia título, descripción y marca de un producto propio. */
export function updateProduct(
  productId: string,
  body: ProductChanges,
): Promise<ClientResult<{ product: SellerProduct }>> {
  return callBff({
    method: "PATCH",
    path: `/api/seller/products/${encodeURIComponent(productId)}`,
    body,
  });
}

/** Publica, pausa o cierra un producto. */
export function setPublication(
  productId: string,
  action: "publish" | "pause" | "close",
): Promise<ClientResult<{ product: SellerProduct }>> {
  return callBff({
    method: "POST",
    path: `/api/seller/products/${encodeURIComponent(productId)}/publication`,
    body: { action },
  });
}

/** Cambia el stock de una variante (valor absoluto). */
export function updateVariantStock(
  productId: string,
  variantId: string,
  stock: number,
): Promise<ClientResult<{ product: SellerProduct }>> {
  return callBff({
    method: "PATCH",
    path: `/api/seller/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/stock`,
    body: { stock },
  });
}

/**
 * Sube una imagen del producto.
 *
 * Va como `FormData` (no JSON): el archivo viaja al servidor de Next.js, que valida el tipo y el tamaño, pide la
 * URL firmada, sube los bytes y adjunta la imagen. El navegador nunca habla con el almacenamiento.
 */
export function uploadImage(
  productId: string,
  file: File,
  alt: string,
  position: number,
): Promise<ClientResult<{ image: ProductImage }>> {
  const body = new FormData();
  body.set("file", file);
  body.set("alt", alt);
  body.set("position", String(position));

  return callBff({
    method: "POST",
    path: `/api/seller/products/${encodeURIComponent(productId)}/images`,
    formData: body,
  });
}

/** Quita una imagen del producto. */
export function deleteImage(
  productId: string,
  imageId: string,
): Promise<ClientResult<Record<string, never>>> {
  return callBff({
    method: "DELETE",
    path: `/api/seller/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
  });
}

/** Avanza el estado de una venta. */
export function updateSaleStatus(
  sellerOrderId: string,
  status: SellerOrderStatus,
): Promise<ClientResult<{ sale: SellerSale }>> {
  return callBff({
    method: "PATCH",
    path: `/api/seller/orders/${encodeURIComponent(sellerOrderId)}/status?status=${encodeURIComponent(status)}`,
  });
}

/** Prepara el envío de una venta. */
export function createShipment(
  sellerOrderId: string,
  body: NewShipment,
): Promise<ClientResult<{ shipment: Shipment }>> {
  return callBff({
    method: "POST",
    path: `/api/seller/orders/${encodeURIComponent(sellerOrderId)}/shipment`,
    body,
  });
}

/** Corrige los datos de un envío ya preparado. */
export function updateShipment(
  sellerOrderId: string,
  body: ShipmentChanges,
): Promise<ClientResult<{ shipment: Shipment }>> {
  return callBff({
    method: "PATCH",
    path: `/api/seller/orders/${encodeURIComponent(sellerOrderId)}/shipment`,
    body,
  });
}

/** Anota un avance del envío (entregado, en tránsito…). */
export function updateShipmentStatus(
  sellerOrderId: string,
  status: ShipmentStatus,
  description: string | null,
): Promise<ClientResult<{ shipment: Shipment }>> {
  const query = new URLSearchParams({ status });

  if (description !== null && description.length > 0) {
    query.set("description", description);
  }

  return callBff({
    method: "POST",
    path: `/api/seller/orders/${encodeURIComponent(sellerOrderId)}/shipment/status?${query.toString()}`,
  });
}

/** Atributos de una categoría (públicos): se piden al elegir categoría en el formulario de producto. */
export function fetchCategoryAttributes(
  categoryId: string,
): Promise<ClientResult<CategoryAttribute[]>> {
  return callBff({
    method: "GET",
    path: `/api/seller/categories/${encodeURIComponent(categoryId)}/attributes`,
  });
}
