import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { defaultTimeZone, routing } from "./routing";

/**
 * Configuración de cada petición (next-intl v4).
 *
 * El idioma llega desde el `proxy` (antes `middleware`) a través de `requestLocale`. Si el valor recibido
 * no es un idioma soportado, se usa el de por defecto.
 *
 * `timeZone` se fija aquí para que las fechas se rendericen igual en el servidor y en el navegador
 * (si no, Next.js avisaría de diferencias de hidratación). Cuando exista sesión, esta zona horaria
 * vendrá del perfil del usuario.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    timeZone: defaultTimeZone,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
