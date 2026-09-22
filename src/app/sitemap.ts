import type { MetadataRoute } from "next";

import {
  PUBLIC_PRODUCTS_PAGE_SIZE,
  listCategories,
  listPublicProducts,
} from "@/features/catalog/api";
import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";

/**
 * `sitemap.xml`.
 *
 * Incluye las portadas por idioma, las **categorías** y **todo** el catálogo publicado.
 *
 * Cómo se recorre el catálogo: con `GET /catalog/products/public`, el listado público paginado por cursor que
 * devuelve el `slug` (la URL bonita) y el `updated_at` (el `lastmod`) de cada producto. Se pide en páginas de
 * 500 hasta agotar el cursor, con un tope de `MAX_PAGES` para que el mapa no crezca sin control en una
 * compilación; si algún día el catálogo es más grande que ese tope, se sube (o se parte en varios archivos con
 * `generateSitemaps`, que es la forma que documenta Next.js).
 *
 * Si el backend está apagado, las funciones de datos devuelven `unavailable` (nunca lanzan), así que el mapa
 * queda con las portadas en lugar de romper la compilación.
 *
 * `alternates.languages` genera automáticamente las etiquetas `hreflang` de cada idioma.
 */

/** Tope de páginas del listado público (500 productos cada una). */
const MAX_PAGES = 10;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;

  /** URLs absolutas del mismo recurso en cada idioma (para `hreflang`). */
  function languagesFor(path: string): Record<string, string> {
    return Object.fromEntries(
      routing.locales.map((locale) => [locale, `${baseUrl}/${locale}${path}`]),
    );
  }

  const entries: MetadataRoute.Sitemap = routing.locales.map((locale) => ({
    url: `${baseUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
    alternates: { languages: languagesFor("") },
  }));

  const categories = await listCategories();

  if (categories.ok) {
    for (const category of categories.data) {
      for (const locale of routing.locales) {
        entries.push({
          url: `${baseUrl}/${locale}/c/${category.slug}`,
          changeFrequency: "daily",
          priority: 0.8,
          alternates: { languages: languagesFor(`/c/${category.slug}`) },
        });
      }
    }
  }

  let cursor: string | null = null;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const products = await listPublicProducts({ cursor, limit: PUBLIC_PRODUCTS_PAGE_SIZE });

    if (!products.ok) {
      break;
    }

    for (const product of products.data.items) {
      for (const locale of routing.locales) {
        entries.push({
          url: `${baseUrl}/${locale}/p/${product.slug}`,
          lastModified: new Date(product.updated_at),
          changeFrequency: "weekly",
          priority: 0.7,
          alternates: { languages: languagesFor(`/p/${product.slug}`) },
        });
      }
    }

    cursor = products.data.next_cursor;

    if (cursor === null) {
      break;
    }
  }

  // Nota: `/design-system` es una página interna de trabajo y **no** se incluye aquí a propósito
  // (además lleva `robots: noindex` en su metadata).
  return entries;
}
