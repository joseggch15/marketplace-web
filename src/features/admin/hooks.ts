"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import * as api from "./client";

/**
 * Mutaciones del panel de administración (TanStack Query).
 *
 * Igual que en el panel del vendedor: la mutación solo llama al BFF y, al terminar, invalida lo que ya no vale.
 * Después la pantalla refresca con `router.refresh()`, que vuelve a leer del servidor (la única fuente de
 * verdad).
 */

/** Aprueba una tienda. */
export function useApproveStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storeId: string) => api.approveStore(storeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-stores"] });
    },
  });
}

/** Rechaza la solicitud de una tienda. */
export function useRejectStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storeId: string) => api.rejectStore(storeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-stores"] });
    },
  });
}

/** Suspende una tienda (con motivo opcional). */
export function useSuspendStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { storeId: string; reason: string | null }) =>
      api.suspendStore(input.storeId, input.reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-stores"] });
    },
  });
}

/** Reactiva una tienda suspendida. */
export function useRestoreStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { storeId: string; reason: string | null }) =>
      api.restoreStore(input.storeId, input.reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-stores"] });
    },
  });
}

/** Oculta o vuelve a publicar una reseña. */
export function useReviewVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { reviewId: string; published: boolean; reason: string | null }) =>
      input.published
        ? api.publishReview(input.reviewId, input.reason)
        : api.hideReview(input.reviewId, input.reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
  });
}

/** Oculta una reseña. */
export function useHideReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { reviewId: string; reason: string | null }) =>
      api.hideReview(input.reviewId, input.reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
  });
}

/** Oculta o vuelve a publicar una pregunta. */
export function useQuestionVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { questionId: string; published: boolean; reason: string | null }) =>
      input.published
        ? api.publishQuestion(input.questionId, input.reason)
        : api.hideQuestion(input.questionId, input.reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
    },
  });
}
