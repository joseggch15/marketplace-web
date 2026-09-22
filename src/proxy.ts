import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/**
 * `proxy.ts` es el nombre que Next.js 16 le dio al antiguo `middleware.ts`.
 *
 * Aquí next-intl detecta el idioma, redirige a la ruta con prefijo (`/es/...`) y añade los enlaces
 * alternativos (`hreflang`) para los buscadores.
 */
export default createMiddleware(routing);

export const config = {
  // Se ignoran las rutas de API, las internas de Next.js y cualquier ruta con punto (p. ej. favicon.ico).
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
