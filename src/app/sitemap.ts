import type { MetadataRoute } from "next";

import { EMPTY_CATALOG_QUERY } from "@/features/catalog/params";
import { listCategories, searchProducts } from "@/features/catalog/api";
import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";

/**
 * `sitemap.xml`.
 *
 * Incluye las portadas por idioma, las **categorías** y los **productos**.
 *
 * Límite honesto y anotado: la API pública no tiene un endpoint que liste todo el catálogo, así que los
 * productos se toman de la primera página del buscador (100, el máximo que acepta). Cuando el backend exponga
 * un listado paginable (o un `sitemap` por lotes), este archivo se paginará igual que pide el proyecto.
 *
 * Si el backend está caído, las funciones de datos devuelven un resultado de error (nunca lanzan), así que el
 * mapa queda con las portadas en lugar de romper la compilación.
 *
 * `alternates.languages` genera automáticamente las etiquetas `hreflang` de cada idioma.
 */

/** Máximo que acepta `GET /catalog/search` en el parámetro `limit`. */
const PRODUCT_LIMIT = 100;

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

  const products = await searchProducts(EMPTY_CATALOG_QUERY, PRODUCT_LIMIT);

  if (products.ok) {
    for (const product of products.data.items) {
      for (const locale of routing.locales) {
        entries.push({
          url: `${baseUrl}/${locale}/p/${product.id}`,
          changeFrequency: "weekly",
          priority: 0.7,
          alternates: { languages: languagesFor(`/p/${product.id}`) },
        });
      }
    }
  }

  // Nota: `/design-system` es una página interna de trabajo y **no** se incluye aquí a propósito
  // (además lleva `robots: noindex` en su metadata).
  return entries;
}
