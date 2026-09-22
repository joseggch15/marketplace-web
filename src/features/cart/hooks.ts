"use client";

import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { ClientResult } from "@/lib/api/bff-client";

import * as api from "./client";
import { cartKey } from "./client";
import { clearedCart, withItemQuantity, withoutItem } from "./selectors";
import type { Cart } from "./types";

/**
 * Hooks del carrito con TanStack Query (F5).
 *
 * **Actualizaciones optimistas:** cambiar la cantidad, quitar una línea y vaciar se ven al instante (la
 * cantidad, el número de unidades o la desaparición de la línea) y si el servidor falla se **revierte** al
 * estado anterior. Lo que **no** se hace nunca en el navegador es calcular dinero: los importes optimistas son
 * los últimos que devolvió el servidor, y la pantalla los marca como «pendientes» (`useCartPending`) hasta que
 * llega la respuesta real con los subtotales calculados en el servidor.
 *
 * Añadir un producto **no** es optimista: el navegador no tiene el título, el SKU ni el precio de la línea (los
 * pone el backend), así que inventarlos sería enseñar datos falsos. Mientras el servidor responde, el botón se
 * queda en estado «agregando».
 */

/** Clave de mutación del carrito: permite saber desde cualquier componente si hay algo en vuelo. */
export const cartMutationKey = ["cart"] as const;

/**
 * Payload que se guarda en la caché del carrito: exactamente lo que devuelve la ruta BFF.
 *
 * Se construye con esta función (en vez de un objeto suelto) para que el tipo lo ponga el compilador y no la
 * forma del literal: así el `ok: true` no se pierde al escribirlo en la caché.
 */
function cartPayload(cart: Cart): ClientResult<Cart> {
  return { ok: true, data: cart };
}

/**
 * Carrito actual, con sus cuatro estados.
 *
 * `enabled: false` sirve para el contador de la cabecera cuando el servidor ya sabe con certeza que el
 * visitante no tiene carrito (ni sesión ni cookie de invitado): en ese caso no se pide nada a la API. Si más
 * tarde agrega algo, la mutación escribe en la misma caché y el contador se actualiza igual.
 */
export function useCart({ enabled = true }: { enabled?: boolean } = {}) {
  const query = useQuery({ queryKey: cartKey, queryFn: api.fetchCart, enabled });
  const payload = query.data;

  return {
    cart: payload?.ok === true ? payload.data : null,
    /** Todavía no hay respuesta. */
    loading: query.isLoading,
    /** El servidor (o la red) falló: se puede reintentar. */
    failed: payload?.ok === false,
    reload: () => {
      void query.refetch();
    },
  };
}

/** ¿Hay alguna operación del carrito en vuelo? Sirve para marcar los importes como pendientes. */
export function useCartPending(): boolean {
  return useIsMutating({ mutationKey: cartMutationKey }) > 0;
}

/** Añade (o incrementa) una variante en el carrito. */
export function useAddCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: cartMutationKey,
    mutationFn: (input: { variantId: string; quantity: number }) =>
      api.addCartItem(input.variantId, input.quantity),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.setQueryData(cartKey, result);
      }
    },
  });
}

/**
 * Mutación del carrito con actualización optimista y reversión.
 *
 * `optimisticData` recibe el carrito que hay en caché y el dato de la operación, y devuelve la copia que se
 * enseña mientras el servidor responde. La reversión es explícita porque `callBff` **no lanza excepciones**:
 * un fallo llega como `{ ok: false }` y, sin este paso, la interfaz se quedaría mostrando algo que no pasó.
 */
function useOptimisticCartMutation<Input>(
  mutationFn: (input: Input) => Promise<ClientResult<Cart>>,
  optimisticData: (cart: Cart, input: Input) => Cart,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: cartMutationKey,
    mutationFn,
    onMutate: async (input) => {
      // Sin cancelar las peticiones en vuelo, una respuesta vieja podría pisar el cambio optimista.
      await queryClient.cancelQueries({ queryKey: cartKey });
      const previous = queryClient.getQueryData<ClientResult<Cart>>(cartKey);

      if (previous?.ok === true) {
        queryClient.setQueryData(cartKey, cartPayload(optimisticData(previous.data, input)));
      }

      return { previous };
    },
    onSuccess: (result, _input, context) => {
      if (result.ok) {
        queryClient.setQueryData(cartKey, result);
        return;
      }

      if (context?.previous !== undefined) {
        queryClient.setQueryData(cartKey, context.previous);
      }
    },
    onError: (_error, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(cartKey, context.previous);
      }
    },
  });
}

/** Cambia la cantidad de una línea. */
export function useUpdateCartItemQuantity() {
  return useOptimisticCartMutation(
    (input: { variantId: string; quantity: number }) =>
      api.updateCartItemQuantity(input.variantId, input.quantity),
    (cart, input) => withItemQuantity(cart, input.variantId, input.quantity),
  );
}

/** Quita una línea del carrito. */
export function useRemoveCartItem() {
  return useOptimisticCartMutation(
    (variantId: string) => api.removeCartItem(variantId),
    (cart, variantId) => withoutItem(cart, variantId),
  );
}

/** Vacía el carrito. */
export function useClearCart() {
  return useOptimisticCartMutation(
    () => api.clearCart(),
    (cart) => clearedCart(cart),
  );
}
