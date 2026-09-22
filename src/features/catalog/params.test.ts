import { describe, expect, it } from "vitest";

import type { Category } from "./api";
import {
  DEFAULT_SORT,
  EMPTY_CATALOG_QUERY,
  catalogHref,
  hasActiveFilters,
  normalizePrice,
  parseCatalogQuery,
  priceRangeIsInvalid,
  toSearchParams,
} from "./params";
import { buildCategoryTree, findCategoryBySlug, topLevelCategories } from "./selectors";

/**
 * Pruebas de la lógica pura del catálogo: leer los filtros de la URL, escribir la URL y armar el árbol de
 * categorías.
 *
 * Es la pieza donde más fácil se cuela un fallo silencioso: si un filtro se pierde al construir la URL, la
 * búsqueda parece funcionar pero muestra otra cosa.
 */

function category(id: string, parentId: string | null, slug: string): Category {
  return {
    id,
    parent_id: parentId,
    name: slug,
    slug,
    commission_rate: null,
    created_at: "2026-01-01T00:00:00Z",
  };
}

describe("normalizePrice", () => {
  it("acepta enteros y decimales escritos con punto o con coma", () => {
    expect(normalizePrice("1500")).toBe("1500");
    expect(normalizePrice("1500.50")).toBe("1500.50");
    expect(normalizePrice("1500,50")).toBe("1500.50");
    expect(normalizePrice("  1500  ")).toBe("1500");
  });

  it("rechaza lo que no es un precio, incluidos los separadores de miles", () => {
    expect(normalizePrice("")).toBeNull();
    expect(normalizePrice("1.500")).toBeNull();
    expect(normalizePrice("10.999")).toBeNull();
    expect(normalizePrice("abc")).toBeNull();
    expect(normalizePrice("-10")).toBeNull();
  });
});

describe("parseCatalogQuery", () => {
  it("usa los valores por defecto cuando no hay parámetros", () => {
    expect(parseCatalogQuery({})).toEqual(EMPTY_CATALOG_QUERY);
  });

  it("lee los filtros válidos y los normaliza", () => {
    const query = parseCatalogQuery({
      q: "  audífonos ",
      category_id: "cat-1",
      brand: "Sony",
      min_price: "100,50",
      max_price: "900",
      sort: "price_asc",
      cursor: "abc123",
    });

    expect(query).toEqual({
      q: "audífonos",
      categoryId: "cat-1",
      brand: "Sony",
      minPrice: "100.50",
      maxPrice: "900",
      sort: "price_asc",
      cursor: "abc123",
    });
  });

  it("descarta una ordenación desconocida, un cursor raro y precios inválidos", () => {
    const query = parseCatalogQuery({
      sort: "carísimo",
      cursor: "../../etc/passwd",
      min_price: "1.500",
    });

    expect(query.sort).toBe(DEFAULT_SORT);
    expect(query.cursor).toBeNull();
    expect(query.minPrice).toBeNull();
  });

  it("toma el primer valor cuando el parámetro llega repetido", () => {
    expect(parseCatalogQuery({ q: ["uno", "dos"] }).q).toBe("uno");
  });
});

describe("toSearchParams y catalogHref", () => {
  it("omite los valores que están por defecto", () => {
    expect(toSearchParams(EMPTY_CATALOG_QUERY).toString()).toBe("");
  });

  it("escribe los filtros con los nombres que espera la API", () => {
    const params = toSearchParams({
      ...EMPTY_CATALOG_QUERY,
      q: "café",
      minPrice: "10",
      sort: "price_desc",
      cursor: "xyz",
    });

    expect(params.get("q")).toBe("café");
    expect(params.get("min_price")).toBe("10");
    expect(params.get("sort")).toBe("price_desc");
    expect(params.get("cursor")).toBe("xyz");
    expect(params.get("category_id")).toBeNull();
  });

  it("permite cambiar un filtro sin perder los demás y descarta el cursor al filtrar", () => {
    const current = { ...EMPTY_CATALOG_QUERY, q: "café", cursor: "xyz" };
    const href = catalogHref("/search", current, { brand: "Juan Valdez", cursor: null });

    expect(href).toBe("/search?q=caf%C3%A9&brand=Juan+Valdez");
  });

  it("devuelve solo la ruta cuando no hay filtros", () => {
    expect(catalogHref("/c/tecnologia", EMPTY_CATALOG_QUERY)).toBe("/c/tecnologia");
  });
});

describe("hasActiveFilters y priceRangeIsInvalid", () => {
  it("considera que el texto buscado no es un filtro", () => {
    expect(hasActiveFilters({ ...EMPTY_CATALOG_QUERY, q: "algo" })).toBe(false);
  });

  it("detecta cada filtro", () => {
    expect(hasActiveFilters({ ...EMPTY_CATALOG_QUERY, categoryId: "x" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_CATALOG_QUERY, sort: "price_asc" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_CATALOG_QUERY, maxPrice: "10" })).toBe(true);
  });

  it("avisa cuando el mínimo supera al máximo", () => {
    expect(
      priceRangeIsInvalid({ ...EMPTY_CATALOG_QUERY, minPrice: "900", maxPrice: "100" }),
    ).toBe(true);
    expect(
      priceRangeIsInvalid({ ...EMPTY_CATALOG_QUERY, minPrice: "100", maxPrice: "900" }),
    ).toBe(false);
    expect(priceRangeIsInvalid({ ...EMPTY_CATALOG_QUERY, minPrice: "100" })).toBe(false);
  });
});

describe("árbol de categorías", () => {
  const categories = [
    category("1", null, "tecnologia"),
    category("2", null, "hogar"),
    category("3", "1", "celulares"),
  ];

  it("anida las categorías por parent_id", () => {
    const tree = buildCategoryTree(categories);

    expect(tree.map((node) => node.slug)).toEqual(["tecnologia", "hogar"]);
    expect(tree[0]?.children.map((node) => node.slug)).toEqual(["celulares"]);
  });

  it("encuentra una categoría por su slug (la URL usa slug, no UUID)", () => {
    expect(findCategoryBySlug(categories, "celulares")?.id).toBe("3");
    expect(findCategoryBySlug(categories, "no-existe")).toBeNull();
  });

  it("ofrece solo las categorías de primer nivel como filtro", () => {
    expect(topLevelCategories(categories).map((item) => item.id)).toEqual(["1", "2"]);
  });
});
