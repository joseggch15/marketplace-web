import type { Category, CategoryFacet, ProductSearchItem } from "./api";

/**
 * Ayudas para trabajar con las categorías.
 *
 * El backend devuelve una **lista plana** con `parent_id` (sin `children` y sin conteos), así que el árbol se
 * arma aquí. Son funciones puras, sin estado y sin dependencias: fáciles de probar.
 *
 * Nota: `commission_rate` es información del vendedor, no del comprador; **no se muestra** en el catálogo.
 */

export type CategoryNode = Category & { children: CategoryNode[] };

/** Arma el árbol de categorías. Las huérfanas (padre desconocido) quedan en el primer nivel. */
export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>(
    categories.map((category) => [category.id, { ...category, children: [] }]),
  );
  const roots: CategoryNode[] = [];

  for (const category of categories) {
    const node = nodes.get(category.id);

    if (node === undefined) {
      continue;
    }

    const parent = category.parent_id === null ? undefined : nodes.get(category.parent_id);

    if (parent === undefined) {
      roots.push(node);
    } else {
      parent.children.push(node);
    }
  }

  return roots;
}

/** Busca una categoría por su `slug`, que es lo que aparece en la URL. */
export function findCategoryBySlug(categories: Category[], slug: string): Category | null {
  return categories.find((category) => category.slug === slug) ?? null;
}

/** Filtra las categorías de primer nivel, que son las que se ofrecen como filtro principal. */
export function topLevelCategories(categories: Category[]): Category[] {
  return categories.filter((category) => category.parent_id === null);
}

/**
 * Ordena una página de resultados por unidades vendidas y se queda con las primeras.
 *
 * Por qué así: la API **no tiene** un orden `best_selling` (los órdenes disponibles son `relevance`,
 * `newest`, `price_asc` y `price_desc`), pero sí devuelve `sold_count` real en cada resultado. Para la
 * sección «más vendidos» de la portada se pide una página amplia y se ordena aquí por ese dato. Es un
 * orden real dentro de la página pedida, no una promesa de «lo más vendido de toda la tienda»: la propia
 * sección lo explica con los números a la vista (`12 vendidos`).
 *
 * `sold_count` es un entero pequeño y sin decimales (no es dinero), así que compararlo es seguro.
 */
export function topSoldItems(items: ProductSearchItem[], limit: number): ProductSearchItem[] {
  return [...items].sort((a, b) => b.sold_count - a.sold_count).slice(0, limit);
}

/**
 * Cruza las **facets** reales de la búsqueda con el listado de categorías para dar la URL de cada una.
 *
 * La facet solo trae `category_id`, `name` y `count`; el `slug` (que es lo que viaja en la URL `/c/<slug>`)
 * está en `/catalog/categories`. Las categorías sin conteo no se muestran, y los conteos de categorías que ya
 * no existen se descartan: nada inventado.
 */
export type CategoryTile = { id: string; name: string; slug: string; count: number };

export function categoryTiles(
  facets: CategoryFacet[],
  categories: Category[],
  limit = 8,
): CategoryTile[] {
  const byId = new Map(categories.map((category) => [category.id, category]));

  return facets
    .flatMap((facet) => {
      const category = byId.get(facet.category_id);
      return category === undefined
        ? []
        : [{ id: facet.category_id, name: facet.name, slug: category.slug, count: facet.count }];
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
