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

/**
 * Unidades menores exactas de un monto (céntimos), como entero.
 *
 * Por qué no se usa `parseFloat` para comparar dinero: el proyecto prohíbe el punto flotante para dinero, y
 * comparar dos precios con floats puede ordenarlos mal cuando son muy parecidos. Aquí el monto se parte en
 * parte entera y decimales y se convierte en un `BigInt`, que es exacto.
 *
 * Se usa **solo para comparar y ordenar** (por ejemplo, para saber cuál es la variante más barata de un
 * producto). Los montos se siguen mostrando tal como llegan del backend.
 *
 * Devuelve `null` si el valor no es un monto con hasta dos decimales; preferimos no comparar antes que
 * comparar mal.
 */
export function toMinorUnits(value: number | string | null | undefined): bigint | null {
  if (value === null || value === undefined) {
    return null;
  }

  const raw =
    typeof value === "number" ? (Number.isFinite(value) ? String(value) : "") : value.trim();
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(raw);

  if (match === null) {
    return null;
  }

  const [, sign, whole, fraction = ""] = match;
  const units = BigInt(`${whole}${fraction.padEnd(2, "0")}`);

  return sign === "-" ? -units : units;
}

/**
 * Compara dos montos: `-1` si el primero es menor, `1` si es mayor, `0` si son iguales.
 * `null` cuando alguno de los dos no es un monto válido (no se adivina).
 */
export function compareAmounts(
  a: number | string | null | undefined,
  b: number | string | null | undefined,
): number | null {
  const left = toMinorUnits(a);
  const right = toMinorUnits(b);

  if (left === null || right === null) {
    return null;
  }

  if (left < right) {
    return -1;
  }

  return left > right ? 1 : 0;
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
