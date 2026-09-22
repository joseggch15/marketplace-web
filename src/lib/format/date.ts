/**
 * Formato de fechas y horas con `Intl`, siempre en la zona horaria del usuario.
 *
 * Las fechas del backend llegan en ISO 8601 (UTC). Se formatean en la zona horaria indicada; si la cadena
 * no es una fecha válida, se devuelve `null` y el componente no muestra nada (mejor nada que una fecha
 * inventada).
 */

/** Formatea fecha y hora (p. ej. `12 mar 2026, 14:30`). */
export function formatDateTime(
  value: string | null | undefined,
  locale: string,
  timeZone?: string,
): string | null {
  const date = parseDate(value);

  if (date === null) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date);
}

/** Formatea solo la fecha. */
export function formatDate(
  value: string | null | undefined,
  locale: string,
  timeZone?: string,
): string | null {
  const date = parseDate(value);

  if (date === null) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone }).format(date);
}

/** Convierte una cadena ISO en `Date`, o `null` si no es válida. */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}
