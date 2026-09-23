"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "./client";
import type { ProductFormData } from "./schemas";
import type {
  NewShipment,
  NewStore,
  ProductChanges,
  SellerOrderStatus,
  ShipmentChanges,
  ShipmentStatus,
  StoreChanges,
} from "./types";

/**
 * Mutaciones y consultas del panel del vendedor (TanStack Query).
 *
 * Aquí **no** se calcula nada: los precios, el stock resultante y el estado de una venta los devuelve siempre el
 * servidor. Las mutaciones solo encadenan llamadas y avisan a la caché de lo que ya no vale; después la pantalla
 * refresca con `router.refresh()` para volver a leer del servidor, que es la única fuente de verdad.
 */

/** Solicita crear la tienda. */
export function useCreateStore() {
  return useMutation({ mutationFn: (body: NewStore) => api.createStore(body) });
}

/** Cambia el nombre o la descripción de la tienda. */
export function useUpdateStore() {
  return useMutation({ mutationFn: (body: StoreChanges) => api.updateStore(body) });
}

/** Crea un producto con sus variantes (el servidor las construye a partir de los valores escritos). */
export function useCreateProduct() {
  return useMutation({ mutationFn: (body: ProductFormData) => api.createProduct(body) });
}

/** Cambia título, descripción y marca. */
export function useUpdateProduct(productId: string) {
  return useMutation({
    mutationFn: (body: ProductChanges) => api.updateProduct(productId, body),
  });
}

/** Publica, pausa o cierra un producto. */
export function useSetPublication(productId: string) {
  return useMutation({
    mutationFn: (action: "publish" | "pause" | "close") => api.setPublication(productId, action),
  });
}

/** Cambia el stock de una variante (valor absoluto). */
export function useUpdateVariantStock(productId: string) {
  return useMutation({
    mutationFn: (input: { variantId: string; stock: number }) =>
      api.updateVariantStock(productId, input.variantId, input.stock),
  });
}

/** Sube una imagen del producto. */
export function useUploadImage(productId: string) {
  return useMutation({
    mutationFn: (input: { file: File; alt: string; position: number }) =>
      api.uploadImage(productId, input.file, input.alt, input.position),
  });
}

/** Quita una imagen del producto. */
export function useDeleteImage(productId: string) {
  return useMutation({ mutationFn: (imageId: string) => api.deleteImage(productId, imageId) });
}

/** Avanza el estado de una venta y refresca la lista. */
export function useUpdateSaleStatus(sellerOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: SellerOrderStatus) => api.updateSaleStatus(sellerOrderId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
    },
  });
}

/** Prepara el envío de una venta. */
export function useCreateShipment(sellerOrderId: string) {
  return useMutation({
    mutationFn: (body: NewShipment) => api.createShipment(sellerOrderId, body),
  });
}

/** Corrige los datos de un envío ya preparado. */
export function useUpdateShipment(sellerOrderId: string) {
  return useMutation({
    mutationFn: (body: ShipmentChanges) => api.updateShipment(sellerOrderId, body),
  });
}

/** Anota un avance del envío. */
export function useUpdateShipmentStatus(sellerOrderId: string) {
  return useMutation({
    mutationFn: (input: { status: ShipmentStatus; description: string | null }) =>
      api.updateShipmentStatus(sellerOrderId, input.status, input.description),
  });
}

/**
 * Atributos de la categoría elegida en el formulario de producto.
 *
 * Se piden solo cuando hay categoría (`enabled`): son la base de las variantes, así que si no hay categoría no
 * hay nada que preguntar. Si la petición falla, el formulario lo dice y deja escribir el resto.
 */
export function useCategoryAttributes(categoryId: string | null) {
  const query = useQuery({
    queryKey: ["seller-category-attributes", categoryId],
    queryFn: () => api.fetchCategoryAttributes(categoryId ?? ""),
    enabled: categoryId !== null,
  });

  const payload = query.data;

  return {
    attributes: payload?.ok === true ? payload.data : [],
    loading: categoryId !== null && query.isLoading,
    failed: payload?.ok === false,
  };
}
