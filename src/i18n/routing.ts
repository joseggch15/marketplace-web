import { defineRouting } from "next-intl/routing";

/**
 * Configuración de idiomas (next-intl v4).
 *
 * - `locales`: idiomas soportados. Para añadir uno nuevo basta con agregarlo aquí y crear su
 *   `messages/<locale>.json`.
 * - `localePrefix: "always"`: todas las rutas llevan el idioma delante (`/es/...`, `/en/...`). Es lo más
 *   claro para `canonical` y `hreflang`.
 * - `localeDetection: true`: si el usuario no ha elegido idioma, se detecta por el navegador
 *   (`Accept-Language`); la elección manual se recuerda en la cookie `NEXT_LOCALE`.
 *   Esa cookie es solo una **preferencia de idioma**, nunca un token de sesión.
 */
export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "always",
  localeDetection: true,
  localeCookie: {
    name: "NEXT_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  },
});

/** Idioma del proyecto (para tipar props y utilidades). */
export type Locale = (typeof routing.locales)[number];

/** Zona horaria por defecto mientras el usuario no tenga una guardada en su perfil. */
export const defaultTimeZone = "America/Bogota";

/** Moneda por defecto del backend (`DEFAULT_CURRENCY` en la API). */
export const defaultCurrency = "COP";
