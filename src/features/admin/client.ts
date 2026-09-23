import { callBff, type ClientResult } from "@/lib/api/bff-client";

import type { AdminAction, AdminStore, Moderation } from "./types";

/**
 * Cliente del navegador para las rutas BFF del panel de administración.
 *
 * El navegador solo habla con `/api/...` de nuestro propio dominio: la sesión viaja en cookies httpOnly que
 * gestiona el servidor. Quién puede moderar lo decide el backend (403 `forbidden` si la cuenta no es
 * administradora), no la interfaz.
 */

/** Aprueba una tienda. */
export function approveStore(storeId: string): Promise<ClientResult<{ result: AdminStore }>> {
  return callBff({
    method: "POST",
    path: `/api/admin/stores/${encodeURIComponent(storeId)}/approve`,
  });
}

/** Rechaza la solicitud de una tienda. */
export function rejectStore(storeId: string): Promise<ClientResult<{ result: AdminStore }>> {
  return callBff({
    method: "POST",
    path: `/api/admin/stores/${encodeURIComponent(storeId)}/reject`,
  });
}

/** Suspende una tienda, con un motivo opcional que queda en la auditoría. */
export function suspendStore(
  storeId: string,
  reason: string | null,
): Promise<ClientResult<{ action: AdminAction }>> {
  return callBff({
    method: "POST",
    path: `/api/admin/stores/${encodeURIComponent(storeId)}/suspend`,
    body: moderationBody(reason),
  });
}

/** Reactiva una tienda suspendida. */
export function restoreStore(
  storeId: string,
  reason: string | null,
): Promise<ClientResult<{ action: AdminAction }>> {
  return callBff({
    method: "POST",
    path: `/api/admin/stores/${encodeURIComponent(storeId)}/restore`,
    body: moderationBody(reason),
  });
}

/** Oculta una reseña. */
export function hideReview(
  reviewId: string,
  reason: string | null,
): Promise<ClientResult<{ action: AdminAction }>> {
  return callBff({
    method: "POST",
    path: `/api/admin/reviews/${encodeURIComponent(reviewId)}/hide`,
    body: moderationBody(reason),
  });
}

/** Vuelve a publicar una reseña oculta. */
export function publishReview(
  reviewId: string,
  reason: string | null,
): Promise<ClientResult<{ action: AdminAction }>> {
  return callBff({
    method: "POST",
    path: `/api/admin/reviews/${encodeURIComponent(reviewId)}/publish`,
    body: moderationBody(reason),
  });
}

/** Oculta una pregunta. */
export function hideQuestion(
  questionId: string,
  reason: string | null,
): Promise<ClientResult<{ action: AdminAction }>> {
  return callBff({
    method: "POST",
    path: `/api/admin/questions/${encodeURIComponent(questionId)}/hide`,
    body: moderationBody(reason),
  });
}

/** Vuelve a publicar una pregunta oculta. */
export function publishQuestion(
  questionId: string,
  reason: string | null,
): Promise<ClientResult<{ action: AdminAction }>> {
  return callBff({
    method: "POST",
    path: `/api/admin/questions/${encodeURIComponent(questionId)}/publish`,
    body: moderationBody(reason),
  });
}

/** Cuerpo del motivo: la API lo acepta vacío, así que se manda `null` cuando no hay nada que contar. */
function moderationBody(reason: string | null): Moderation {
  return { reason };
}
