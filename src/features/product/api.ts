import { backend } from "@/lib/api/client";
import { problemCode } from "@/features/auth/error-codes";
import type { BackendResult } from "@/features/auth/api";

import type {
  Availability,
  InventoryItem,
  Product,
  ProductQuestion,
  QuestionList,
  ReviewList,
} from "./types";

/**
 * Acceso a los datos de la página de producto desde el **servidor** (Server Components y rutas BFF).
 *
 * Nunca lanza excepciones: devuelve un resultado discriminado, igual que `features/catalog/api.ts` y
 * `features/health/api.ts`. Son tres estados y no dos, porque para el usuario son situaciones distintas:
 *
 * - `{ ok: true, data }`: el producto existe.
 * - `{ ok: false, reason: "not_found" }`: el backend respondió 404 → se muestra el 404 traducido.
 * - `{ ok: false, reason: "unavailable" }`: el backend no responde → la página lo explica sin romperse.
 *
 * Esto es lo que permite que las pruebas end-to-end corran **sin backend**.
 */

export type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "unavailable" };

export type AvailabilityResult =
  | { ok: true; data: Availability }
  | { ok: false; reason: "unavailable" };

/** Reseñas por página. El backend acepta de 1 a 100; 10 es una lista legible en un móvil. */
export const REVIEWS_PAGE_SIZE = 10;

/** Preguntas que se piden de una vez. El backend acepta de 1 a 100 y **no** pagina por cursor todavía. */
export const QUESTIONS_PAGE_SIZE = 20;

const noStore = { cache: "no-store" } as const;

/** Forma mínima y tipada de lo que devuelve `openapi-fetch`. */
type Outcome<T> = { data?: T; response: Response };

/**
 * Ejecuta la petición y la convierte en resultado.
 *
 * Se recibe como función para que un fallo al **construir** la petición también caiga en el `catch` y no
 * escape como excepción.
 */
async function toResult<T>(request: () => Promise<Outcome<T>>): Promise<FetchResult<T>> {
  try {
    const { data, response } = await request();

    if (response.status === 404) {
      return { ok: false, reason: "not_found" };
    }

    if (!response.ok || data === undefined) {
      return { ok: false, reason: "unavailable" };
    }

    return { ok: true, data };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/** Producto por identificador (`GET /catalog/products/{product_id}`). */
export function fetchProduct(productId: string): Promise<FetchResult<Product>> {
  return toResult(() =>
    backend.GET("/api/v1/catalog/products/{product_id}", {
      params: { path: { product_id: productId } },
      ...noStore,
    }),
  );
}

/**
 * Stock **real** de cada variante.
 *
 * El backend expone el inventario por variante (`GET /inventory/items/{variant_id}`) y **no** incluye el
 * stock en `ProductOut`, así que se piden en paralelo las variantes del producto (suelen ser dos o tres).
 *
 * Si una variante no tiene registro de inventario (404) se cuentan 0 unidades: no hay nada que vender. Si
 * cualquier otra petición falla, se devuelve `unavailable` y la interfaz dice que **no se pudo comprobar** el
 * stock en lugar de mostrar un número inventado.
 */
export async function fetchAvailability(variantIds: string[]): Promise<AvailabilityResult> {
  if (variantIds.length === 0) {
    return { ok: true, data: {} };
  }

  try {
    const items = await Promise.all(
      variantIds.map(async (variantId) => {
        const { data, response } = await backend.GET("/api/v1/inventory/items/{variant_id}", {
          params: { path: { variant_id: variantId } },
          ...noStore,
        });

        if (response.status === 404) {
          return [variantId, 0] as const;
        }

        if (!response.ok || data === undefined) {
          throw new Error("inventory_unavailable");
        }

        const item: InventoryItem = data;
        return [variantId, Math.max(0, item.available)] as const;
      }),
    );

    return { ok: true, data: Object.fromEntries(items) };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/** Reseñas publicadas del producto, con su nota media y el cursor de la página siguiente. */
export function fetchReviews(
  productId: string,
  { limit = REVIEWS_PAGE_SIZE, cursor }: { limit?: number; cursor?: string | null } = {},
): Promise<FetchResult<ReviewList>> {
  return toResult(() =>
    backend.GET("/api/v1/products/{product_id}/reviews", {
      params: {
        path: { product_id: productId },
        query: { limit, cursor: cursor ?? undefined },
      },
      ...noStore,
    }),
  );
}

/**
 * Preguntas del producto, con las respuestas del vendedor.
 *
 * Nota honesta: la API devuelve `next_cursor`, pero **no acepta** el parámetro `cursor` en este endpoint, así
 * que solo se puede pedir la primera página (ver el apartado 12 de `docs/PENDIENTES-BACKEND.md`).
 */
export function fetchQuestions(
  productId: string,
  { limit = QUESTIONS_PAGE_SIZE }: { limit?: number } = {},
): Promise<FetchResult<QuestionList>> {
  return toResult(() =>
    backend.GET("/api/v1/products/{product_id}/questions", {
      params: { path: { product_id: productId }, query: { limit } },
      ...noStore,
    }),
  );
}

/**
 * Publica una pregunta en nombre del usuario con sesión (`POST /products/{product_id}/questions`).
 * Solo se llama desde la ruta BFF: necesita el access token, que vive en una cookie httpOnly.
 */
export async function askQuestion(
  accessToken: string,
  productId: string,
  body: string,
): Promise<BackendResult<ProductQuestion>> {
  try {
    const { data, error, response } = await backend.POST("/api/v1/products/{product_id}/questions", {
      params: { path: { product_id: productId } },
      body: { body },
      headers: { authorization: `Bearer ${accessToken}` },
      ...noStore,
    });

    if (response.ok && data !== undefined) {
      return { ok: true, data };
    }

    return { ok: false, status: response.status, code: problemCode(error) };
  } catch {
    return { ok: false, status: 0, code: null };
  }
}
