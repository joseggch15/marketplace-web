import type { BackendResult } from "@/features/auth/api";
import { problemCode } from "@/features/auth/error-codes";
import { backend } from "@/lib/api/client";

import type {
  AdminAction,
  AdminQuestionPage,
  AdminStore,
  AdminUserPage,
  Moderation,
  StoreStatus,
  UserRole,
} from "./types";

/**
 * Acceso al panel de administración desde el **servidor** (rutas BFF y Server Components).
 *
 * Igual que en el resto del proyecto: nunca lanza excepciones (devuelve un resultado con el `code` estable de la
 * API) y el access token llega desde el servidor. La API comprueba en cada llamada que quien invoca tiene rol
 * `admin` (`403 forbidden` si no); aquí no se intenta sustituir esa comprobación.
 */

const noStore = { cache: "no-store" } as const;

type Outcome<T> = { data?: T; error?: unknown; response: Response };

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

/** Cuerpo opcional de moderación: se manda solo cuando hay motivo (la API lo acepta vacío). */
function moderationBody(reason: string | null): { body?: Moderation } {
  return reason === null || reason.length === 0 ? {} : { body: { reason } };
}

/** Tiendas del marketplace, filtrables por estado. Sin filtro devuelve todas. */
export function listStores(
  accessToken: string,
  status: StoreStatus | null,
): Promise<BackendResult<AdminStore[]>> {
  return unwrap(
    backend.GET("/api/v1/sellers", {
      params: { query: { status_filter: status ?? undefined } },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Aprueba la tienda de un vendedor (a partir de ahí puede publicar productos). */
export function approveStore(
  accessToken: string,
  storeId: string,
): Promise<BackendResult<AdminStore>> {
  return unwrap(
    backend.POST("/api/v1/sellers/{store_id}/approve", {
      params: { path: { store_id: storeId } },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Rechaza la solicitud de tienda. */
export function rejectStore(
  accessToken: string,
  storeId: string,
): Promise<BackendResult<AdminStore>> {
  return unwrap(
    backend.POST("/api/v1/sellers/{store_id}/reject", {
      params: { path: { store_id: storeId } },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Suspende una tienda (sus productos dejan de mostrarse). */
export function suspendStore(
  accessToken: string,
  storeId: string,
  reason: string | null,
): Promise<BackendResult<AdminAction>> {
  return unwrap(
    backend.POST("/api/v1/admin/stores/{store_id}/suspend", {
      params: { path: { store_id: storeId } },
      headers: bearer(accessToken),
      ...moderationBody(reason),
      ...noStore,
    }),
  );
}

/** Reactiva (vuelve a aprobar) una tienda suspendida. */
export function restoreStore(
  accessToken: string,
  storeId: string,
  reason: string | null,
): Promise<BackendResult<AdminAction>> {
  return unwrap(
    backend.POST("/api/v1/admin/stores/{store_id}/restore", {
      params: { path: { store_id: storeId } },
      headers: bearer(accessToken),
      ...moderationBody(reason),
      ...noStore,
    }),
  );
}

/** Directorio de usuarios: busca por correo y filtra por rol, paginado por cursor. */
export function listUsers(
  accessToken: string,
  {
    q,
    role,
    cursor,
    limit = 20,
  }: { q?: string | null; role?: UserRole | null; cursor?: string | null; limit?: number } = {},
): Promise<BackendResult<AdminUserPage>> {
  return unwrap(
    backend.GET("/api/v1/admin/users", {
      params: {
        query: { q: q ?? undefined, role: role ?? undefined, cursor: cursor ?? undefined, limit },
      },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Preguntas de los compradores, filtrables por visibilidad (`true`, `false` o todas). */
export function listQuestions(
  accessToken: string,
  {
    published,
    cursor,
    limit = 20,
  }: { published?: boolean | null; cursor?: string | null; limit?: number } = {},
): Promise<BackendResult<AdminQuestionPage>> {
  return unwrap(
    backend.GET("/api/v1/admin/questions", {
      params: {
        query: { published: published ?? undefined, cursor: cursor ?? undefined, limit },
      },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

/** Oculta una pregunta publicada. */
export function hideQuestion(
  accessToken: string,
  questionId: string,
  reason: string | null,
): Promise<BackendResult<AdminAction>> {
  return unwrap(
    backend.POST("/api/v1/admin/questions/{question_id}/hide", {
      params: { path: { question_id: questionId } },
      headers: bearer(accessToken),
      ...moderationBody(reason),
      ...noStore,
    }),
  );
}

/** Vuelve a publicar una pregunta oculta. */
export function publishQuestion(
  accessToken: string,
  questionId: string,
  reason: string | null,
): Promise<BackendResult<AdminAction>> {
  return unwrap(
    backend.POST("/api/v1/admin/questions/{question_id}/publish", {
      params: { path: { question_id: questionId } },
      headers: bearer(accessToken),
      ...moderationBody(reason),
      ...noStore,
    }),
  );
}

/** Oculta una reseña. */
export function hideReview(
  accessToken: string,
  reviewId: string,
  reason: string | null,
): Promise<BackendResult<AdminAction>> {
  return unwrap(
    backend.POST("/api/v1/admin/reviews/{review_id}/hide", {
      params: { path: { review_id: reviewId } },
      headers: bearer(accessToken),
      ...moderationBody(reason),
      ...noStore,
    }),
  );
}

/** Vuelve a publicar una reseña oculta (hace falta su identificador). */
export function publishReview(
  accessToken: string,
  reviewId: string,
  reason: string | null,
): Promise<BackendResult<AdminAction>> {
  return unwrap(
    backend.POST("/api/v1/admin/reviews/{review_id}/publish", {
      params: { path: { review_id: reviewId } },
      headers: bearer(accessToken),
      ...moderationBody(reason),
      ...noStore,
    }),
  );
}
