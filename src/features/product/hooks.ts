"use client";

import { useMutation } from "@tanstack/react-query";

import { useRouter } from "@/i18n/navigation";

import * as api from "./client";
import type { AskQuestionValues } from "./schemas";

/**
 * Hooks de la página de producto.
 *
 * Las reseñas y las preguntas las pinta el **servidor** (es mejor para SEO y para el primer pintado), así que
 * aquí solo vive lo que necesita interacción: publicar una pregunta. Al publicarla se refresca la página y el
 * servidor devuelve la lista con la pregunta nueva ya publicada, sin mantener una copia en el navegador que
 * podría quedar desincronizada.
 */
export function useAskQuestion(productId: string) {
  const router = useRouter();

  return useMutation({
    mutationFn: (values: AskQuestionValues) => api.askQuestion(productId, values.body),
    onSuccess: (result) => {
      if (result.ok) {
        router.refresh();
      }
    },
  });
}
