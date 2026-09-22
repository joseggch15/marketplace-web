import type { Category } from "./api";

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
