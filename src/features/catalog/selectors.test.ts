import { describe, expect, it } from "vitest";

import type { Category, CategoryFacet, ProductSearchItem } from "./api";
import { categoryTiles, topSoldItems } from "./selectors";

/**
 * Pruebas de los selectores de la portada.
 *
 * Lo que se protege aquí son dos decisiones de datos:
 * 1. «Más vendidos» se ordena por `sold_count` **real** dentro de la página pedida (la API no tiene un orden
 *    `best_selling`), y nunca inventa valores.
 * 2. Las categorías de la portada salen del cruce de las **facets** reales (conteo) con las categorías reales
 *    (slug): una categoría sin conteo no se muestra y un conteo sin categoría tampoco.
 */

function product(
  overrides: Partial<ProductSearchItem> & { id: string; sold_count: number },
): ProductSearchItem {
  return {
    title: `Producto ${overrides.id}`,
    slug: `producto-${overrides.id}`,
    brand: null,
    category_id: "c1",
    min_price: "1000.00",
    thumbnail: null,
    rating_average: null,
    review_count: 0,
    store_name: "Tienda Demo",
    ...overrides,
  };
}

function category(id: string, slug: string): Category {
  return {
    id,
    parent_id: null,
    name: `Categoría ${id}`,
    slug,
    commission_rate: null,
    created_at: "2026-01-01T00:00:00Z",
  };
}

function facet(categoryId: string, count: number): CategoryFacet {
  return { category_id: categoryId, name: `Categoría ${categoryId}`, count };
}

describe("topSoldItems", () => {
  it("ordena por unidades vendidas y recorta al límite", () => {
    const items = [
      product({ id: "a", sold_count: 3 }),
      product({ id: "b", sold_count: 12 }),
      product({ id: "c", sold_count: 7 }),
    ];

    expect(topSoldItems(items, 2).map((item) => item.id)).toEqual(["b", "c"]);
  });

  it("no modifica el array original (el orden del servidor se conserva para otras secciones)", () => {
    const items = [product({ id: "a", sold_count: 1 }), product({ id: "b", sold_count: 9 })];

    topSoldItems(items, 2);

    expect(items.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("no inventa unidades: lo que viene del backend es lo que se ordena", () => {
    const items = [product({ id: "a", sold_count: 0 }), product({ id: "b", sold_count: 0 })];

    expect(topSoldItems(items, 2).map((item) => item.sold_count)).toEqual([0, 0]);
  });
});

describe("categoryTiles", () => {
  it("cruza los conteos reales con el slug de la categoría", () => {
    const tiles = categoryTiles(
      [facet("c1", 12), facet("c2", 30)],
      [category("c1", "tecnologia"), category("c2", "deportes")],
    );

    expect(tiles).toEqual([
      { id: "c2", name: "Categoría c2", slug: "deportes", count: 30 },
      { id: "c1", name: "Categoría c1", slug: "tecnologia", count: 12 },
    ]);
  });

  it("descarta conteos de categorías que ya no existen", () => {
    expect(categoryTiles([facet("fantasma", 5)], [category("c1", "tecnologia")])).toEqual([]);
  });

  it("respeta el límite de accesos rápidos", () => {
    const tiles = categoryTiles(
      [facet("c1", 1), facet("c2", 2), facet("c3", 3)],
      [category("c1", "uno"), category("c2", "dos"), category("c3", "tres")],
      2,
    );

    expect(tiles.map((tile) => tile.slug)).toEqual(["tres", "dos"]);
  });
});
