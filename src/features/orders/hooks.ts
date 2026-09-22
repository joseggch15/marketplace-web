"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cartKey } from "@/features/cart/client";

import * as api from "./client";
import type { SandboxOutcome } from "./types";

/**
 * Mutaciones del checkout y de «Mis compras» (TanStack Query).
 *
 * Aquí **no** se calcula ni se inventa ningún importe: el pedido, el descuento del cupón y el estado del pago
 * los devuelve siempre el servidor. Las mutaciones solo encadenan llamadas y avisan a la caché de lo que ya no
 * vale (por ejemplo, el carrito deja de ser válido en cuanto se crea el pedido, porque el backend lo vacía).
 */

/** Crea el pedido a partir del carrito. */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { body: Parameters<typeof api.createOrder>[0]; idempotencyKey: string }) =>
      api.createOrder(input.body, input.idempotencyKey),
    onSuccess: (result) => {
      if (result.ok) {
        // El backend vacía el carrito al crear el pedido: la caché del carrito ya no vale.
        void queryClient.invalidateQueries({ queryKey: cartKey });
      }
    },
  });
}

/** Crea el intento de pago de un pedido. */
export function useCreatePayment() {
  return useMutation({
    mutationFn: (input: { orderId: string; idempotencyKey: string }) =>
      api.createPayment(input.orderId, input.idempotencyKey),
  });
}

/** Aprueba o rechaza el pago en la pasarela de prueba. */
export function useSimulatePayment() {
  return useMutation({
    mutationFn: (input: { paymentId: string; outcome: SandboxOutcome }) =>
      api.simulatePayment(input.paymentId, input.outcome),
  });
}

/** Comprueba el cupón escrito por el comprador. */
export function useValidateCoupon() {
  return useMutation({ mutationFn: (code: string) => api.validateCoupon(code) });
}

/**
 * Estimación de entrega de un producto.
 *
 * Se pide solo cuando hay país y producto (`enabled`): es un dato informativo, así que si el backend no lo puede
 * calcular la interfaz lo dice y el checkout sigue funcionando.
 */
export function useShippingEstimate(productId: string | null, country: string) {
  const enabled = productId !== null && /^[A-Z]{2}$/.test(country);

  const query = useQuery({
    queryKey: ["shipping-estimate", productId, country],
    queryFn: () => api.fetchShippingEstimate(productId ?? "", country),
    enabled,
  });

  const payload = query.data;

  return {
    estimate: payload?.ok === true ? payload.data : null,
    loading: enabled && query.isLoading,
    failed: payload?.ok === false,
  };
}

/** Cancela un pedido pendiente de pago y refresca la vista. */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => api.cancelOrder(orderId),
    onSuccess: () => {
      // El estado del pedido cambió: el servidor vuelve a pintar la página con el estado real.
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

/** Publica la reseña de un producto recibido. */
export function useCreateReview() {
  return useMutation({
    mutationFn: (input: {
      product_id: string;
      rating: number;
      title: string | null;
      body: string | null;
    }) => api.createReview(input),
  });
}
