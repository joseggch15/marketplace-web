import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";

/**
 * `sitemap.xml`.
 *
 * Ahora solo existen las portadas por idioma. En la F3 se añadirán las categorías y los productos
 * (páginas de producto y categoría renderizadas en el servidor), y en ese momento este archivo deberá
 * paginarse por cantidad de URLs.
 *
 * `alternates.languages` genera automáticamente las etiquetas `hreflang` para cada idioma.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, `${baseUrl}/${locale}`]),
  );

  return routing.locales.map((locale) => ({
    url: `${baseUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
    alternates: { languages },
  }));
}
