import type messages from "../../messages/es.json";

import type { routing } from "@/i18n/routing";

/**
 * Refuerzo de tipos de next-intl (v4).
 *
 * Con esto, `useTranslations("Home")` y `t("heroTitle")` se comprueban en tiempo de compilación: si
 * alguien escribe mal una clave o usa un idioma que no existe, falla el `typecheck` en lugar de
 * aparecer el texto raro en pantalla.
 */
declare module "next-intl" {
  interface AppConfig {
    /** Idiomas declarados en `src/i18n/routing.ts`. */
    Locale: (typeof routing.locales)[number];
    /** Mensajes de `messages/es.json` (el idioma base es la fuente de verdad de las claves). */
    Messages: typeof messages;
  }
}
