import { callBff, type ClientResult } from "@/lib/api/bff-client";

import type { AskQuestionPayload } from "./types";

/**
 * Cliente del navegador para las preguntas del producto.
 *
 * El navegador no habla con el backend: llama a `/api/products/{id}/questions` de nuestro propio dominio, que
 * añade la sesión (cookie httpOnly) y reenvía al backend.
 */

export function askQuestion(
  productId: string,
  body: string,
): Promise<ClientResult<AskQuestionPayload>> {
  return callBff({
    method: "POST",
    path: `/api/products/${encodeURIComponent(productId)}/questions`,
    body: { body },
  });
}
