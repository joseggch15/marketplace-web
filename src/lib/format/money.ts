/**
 * Formato de dinero con `Intl` (sin librerías externas).
 *
 * Reglas del proyecto que se cumplen aquí:
 * - Los montos llegan del backend como `Decimal` (número o cadena según el serializador), así que se
 *   convierten de forma segura y **nunca** se inventan valores: si no se puede interpretar, se devuelve
 *   `null` y el componente muestra el estado "sin precio".
 * - El precio convertido a otra moneda se marca con «≈» porque es informativo, no el monto que se cobra.
 */

/** Convierte un monto del backend a número, o `null` si no es válido. */
export function toAmount(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : null;
}

/** Formatea un monto en la moneda e idioma indicados (p. ej. `$ 125.000` en es-CO). */
export function formatMoney(
  value: number | string,
  currency: string,
  locale: string,
): string | null {
  const amount = toAmount(value);

  if (amount === null) {
    return null;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    // Sin decimales cuando la moneda no los usa de verdad y el monto es redondo.
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

/**
 * Formatea una moneda **convertida** (informativa): se antepone «≈» para dejar claro que no es el monto
 * exacto que se cobrará. El cobro real se muestra en la moneda del vendedor, sin el símbolo.
 */
export function formatApproximateMoney(
  value: number | string,
  currency: string,
  locale: string,
): string | null {
  const formatted = formatMoney(value, currency, locale);

  return formatted === null ? null : `≈ ${formatted}`;
}

/** Calcula el porcentaje de descuento entre el precio anterior y el actual. `null` si no hay descuento. */
export function discountPercent(
  amount: number | string,
  compareAt: number | string | null | undefined,
): number | null {
  const current = toAmount(amount);
  const previous = toAmount(compareAt);

  if (current === null || previous === null || previous <= 0 || previous <= current) {
    return null;
  }

  return Math.round(((previous - current) / previous) * 100);
}
