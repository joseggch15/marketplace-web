import { backend } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

import { DEFAULT_LIMIT, type CatalogQuery } from "./params";

/**
 * Acceso al catálogo desde el **servidor** (Server Components).
 *
 * Nunca lanza excepciones: devuelve un resultado discriminado. Es la misma decisión que en
 * `features/health/api.ts` y por una razón práctica: si el backend está apagado, la página debe explicarlo en
 * lugar de romperse, y las pruebas end-to-end se ejecutan sin backend a propósito.
 */

export type SearchResponse = components["schemas"]["SearchResponse"];
export type ProductSearchItem = components["schemas"]["ProductSearchItem"];
export type Category = components["schemas"]["CategoryOut"];

export type CatalogResult<T> = { ok: true; data: T } | { ok: false; reason: "unavailable" };

const noStore = { cache: "no-store" } as const;

/** Busca productos con los filtros de la URL. */
export async function searchProducts(
  query: CatalogQuery,
  limit: number = DEFAULT_LIMIT,
): Promise<CatalogResult<SearchResponse>> {
  try {
    const result = await backend.GET("/api/v1/catalog/search", {
      params: {
        query: {
          q: query.q.length > 0 ? query.q : undefined,
          category_id: query.categoryId ?? undefined,
          brand: query.brand ?? undefined,
          min_price: query.minPrice ?? undefined,
          max_price: query.maxPrice ?? undefined,
          sort: query.sort,
          cursor: query.cursor ?? undefined,
          limit,
        },
      },
      ...noStore,
    });

    if (!result.response.ok || result.data === undefined) {
      return { ok: false, reason: "unavailable" };
    }

    return { ok: true, data: result.data };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * Todas las categorías (hoy son pocas: el backend devuelve la lista completa, sin paginar y sin anidar).
 * El árbol se arma en `selectors.ts` a partir de `parent_id`.
 */
export async function listCategories(): Promise<CatalogResult<Category[]>> {
  try {
    const result = await backend.GET("/api/v1/catalog/categories", noStore);

    if (!result.response.ok || result.data === undefined) {
      return { ok: false, reason: "unavailable" };
    }

    return { ok: true, data: result.data };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
