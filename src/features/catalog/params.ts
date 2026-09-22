/**
 * Filtros del catálogo tal como viven en la **URL**.
 *
 * Regla del proyecto: la búsqueda se describe en la URL (no en el estado de un componente), así que toda
 * búsqueda es compartible, el botón "atrás" funciona y el servidor puede renderizar la página.
 *
 * Los precios viajan como **texto**: el backend usa `Decimal` y el proyecto prohíbe el punto flotante para
 * dinero. Aquí solo se normalizan y se validan; la aritmética la hace el servidor.
 */

export const SORT_OPTIONS = ["relevance", "newest", "price_asc", "price_desc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

/** Orden por defecto del backend (`app/modules/search/api.py`). */
export const DEFAULT_SORT: SortOption = "newest";

/** Límite por defecto y máximo del backend (1..100). */
export const DEFAULT_LIMIT = 20;

export type CatalogQuery = {
  q: string;
  categoryId: string | null;
  brand: string | null;
  minPrice: string | null;
  maxPrice: string | null;
  sort: SortOption;
  cursor: string | null;
};

export const EMPTY_CATALOG_QUERY: CatalogQuery = {
  q: "",
  categoryId: null,
  brand: null,
  minPrice: null,
  maxPrice: null,
  sort: DEFAULT_SORT,
  cursor: null,
};

type RawParam = string | string[] | undefined;

/** Toma el primer valor de un parámetro que puede llegar repetido y lo recorta. */
function single(value: RawParam): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

/** Precio escrito por el usuario: dígitos con separador decimal opcional (punto o coma). */
const PRICE_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;

/**
 * Normaliza un precio a la forma que espera la API (`1234.56`).
 *
 * Acepta la coma como separador decimal (así lo escribe mucha gente en Colombia) y rechaza cualquier otra
 * cosa: si el valor no sirve, se descarta el filtro en lugar de enviar basura al backend.
 */
export function normalizePrice(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const clean = value.replace(/\s/g, "").replace(",", ".");

  return PRICE_PATTERN.test(clean) ? clean : null;
}

/** Los cursores son cadenas opacas: se limitan tamaño y caracteres. */
const CURSOR_PATTERN = /^[A-Za-z0-9_=:+-]{1,512}$/;

function isSortOption(value: string): value is SortOption {
  return (SORT_OPTIONS as readonly string[]).includes(value);
}

/** Lee los filtros de los `searchParams` de Next.js, descartando lo que no sea válido. */
export function parseCatalogQuery(raw: Record<string, RawParam>): CatalogQuery {
  const sort = single(raw.sort);
  const cursor = single(raw.cursor);

  return {
    q: single(raw.q) ?? "",
    categoryId: single(raw.category_id),
    brand: single(raw.brand),
    minPrice: normalizePrice(single(raw.min_price)),
    maxPrice: normalizePrice(single(raw.max_price)),
    sort: sort !== null && isSortOption(sort) ? sort : DEFAULT_SORT,
    cursor: cursor !== null && CURSOR_PATTERN.test(cursor) ? cursor : null,
  };
}

/**
 * Convierte los filtros en parámetros de URL, **omitiendo lo que está por defecto**.
 *
 * Se usa tanto para la URL de la barra de direcciones como para el `canonical`: así `/es/search?q=cafe` no
 * arrastra `sort=newest&limit=20`, y dos búsquedas iguales producen exactamente la misma URL.
 */
export function toSearchParams(
  query: CatalogQuery,
  overrides: Partial<CatalogQuery> = {},
): URLSearchParams {
  const merged: CatalogQuery = { ...query, ...overrides };
  const params = new URLSearchParams();

  if (merged.q.length > 0) params.set("q", merged.q);
  if (merged.categoryId !== null) params.set("category_id", merged.categoryId);
  if (merged.brand !== null) params.set("brand", merged.brand);
  if (merged.minPrice !== null) params.set("min_price", merged.minPrice);
  if (merged.maxPrice !== null) params.set("max_price", merged.maxPrice);
  if (merged.sort !== DEFAULT_SORT) params.set("sort", merged.sort);
  if (merged.cursor !== null) params.set("cursor", merged.cursor);

  return params;
}

/** Enlace a una búsqueda (o a la misma búsqueda con algún filtro cambiado). */
export function catalogHref(
  pathname: string,
  query: CatalogQuery,
  overrides: Partial<CatalogQuery> = {},
): string {
  const search = toSearchParams(query, overrides).toString();

  return search.length > 0 ? `${pathname}?${search}` : pathname;
}

/** ¿Hay algún filtro activo aparte del texto buscado? (para ofrecer "quitar filtros"). */
export function hasActiveFilters(query: CatalogQuery): boolean {
  return (
    query.categoryId !== null ||
    query.brand !== null ||
    query.minPrice !== null ||
    query.maxPrice !== null ||
    query.sort !== DEFAULT_SORT
  );
}

/** Compara los dos precios del rango, como texto, sin usar números en coma flotante. */
export function priceRangeIsInvalid(query: CatalogQuery): boolean {
  if (query.minPrice === null || query.maxPrice === null) {
    return false;
  }

  const min = Number(query.minPrice);
  const max = Number(query.maxPrice);

  return Number.isFinite(min) && Number.isFinite(max) && min > max;
}
