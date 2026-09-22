import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/**
 * Configuración de Next.js.
 *
 * - El plugin de next-intl apunta a `src/i18n/request.ts` (donde se resuelve el idioma de cada petición).
 * - Las imágenes se sirven a través del proxy interno `/api/media/...`, así que no se autoriza ningún
 *   dominio externo. Si algún día se sirven desde un CDN, se añade aquí con `remotePatterns`.
 * - Cabeceras de seguridad básicas para todo el sitio (el backend ya pone las suyas en la API).
 */
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Formatos modernos y carga diferida por defecto con `next/image`.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
