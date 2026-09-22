import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

/**
 * `robots.txt`.
 *
 * Se permite indexar el catálogo y se bloquea lo privado: rutas de API internas, carrito, checkout,
 * cuenta, panel de vendedor y administración. Cualquier página nueva que deba quedar fuera del buscador
 * se añade aquí (y, si es una pantalla completa, además con `noindex` en su metadata).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/*/cart",
          "/*/checkout",
          "/*/account",
          "/*/seller",
          "/*/admin",
          // Página interna de trabajo del equipo (además lleva `robots: noindex`).
          "/*/design-system",
        ],
      },
    ],
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
