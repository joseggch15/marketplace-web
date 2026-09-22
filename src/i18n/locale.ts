import { routing, type Locale } from "./routing";

/** Se reexporta el tipo para que los componentes no tengan que importar de dos sitios. */
export type { Locale } from "./routing";

/** Nombre de la cookie donde next-intl recuerda el idioma elegido por la persona. */
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

/** Comprueba que un valor sea uno de los idiomas soportados. */
export function isLocale(value: string | null | undefined): value is Locale {
  return typeof value === "string" && (routing.locales as readonly string[]).includes(value);
}

/** Idioma por defecto cuando no se puede averiguar la preferencia. */
export function defaultLocale(): Locale {
  return routing.defaultLocale;
}

/** Lee la cookie de idioma a partir de una cadena de `document.cookie` (uso en el navegador). */
export function localeFromCookieString(cookieString: string): Locale {
  const match = cookieString.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE_NAME}=([^;]+)`));
  const value = match?.[1];
  return isLocale(value) ? value : defaultLocale();
}
