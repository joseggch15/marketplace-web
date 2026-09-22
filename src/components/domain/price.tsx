import { Skeleton } from "@/components/ui/skeleton";
import { discountPercent, formatApproximateMoney, formatMoney, toAmount } from "@/lib/format/money";
import { cn } from "@/lib/utils";

/**
 * Precio de un producto (componente de presentación, sin estado propio).
 *
 * Reglas de transparencia del proyecto:
 * - El precio anterior solo se muestra si **realmente** hay descuento (calculado, nunca inventado).
 * - El precio convertido lleva «≈» porque es informativo; en el checkout se muestra aparte el monto que
 *   se cobrará de verdad, en la moneda del vendedor.
 * - Si el monto no se puede interpretar, se muestra el texto de "sin precio" en lugar de un número falso.
 *
 * Estados: normal · con descuento · con conversión · sin precio · cargando (esqueleto).
 * (No tiene estados hover, foco ni deshabilitado porque no es interactivo.)
 */

export type PriceSize = "sm" | "md" | "lg";

export interface PriceProps {
  /** Monto tal como llega del backend (`Decimal`: número o cadena). */
  amount: number | string;
  /** Código ISO 4217 de la moneda del vendedor. */
  currency: string;
  /** Idioma para el formato (p. ej. `es-CO`). */
  locale: string;
  /** Precio anterior, si el producto está en oferta. */
  compareAt?: number | string | null;
  /** Precio convertido a la moneda del usuario (informativo, se muestra con «≈»). */
  converted?: { amount: number | string; currency: string } | null;
  /** Texto para cuando no hay precio disponible (traducido). */
  unavailableLabel: string;
  size?: PriceSize;
  className?: string;
}

/** Tamaños tipográficos del precio (el más grande se usa en la página de producto). */
const AMOUNT_SIZE: Record<PriceSize, string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl sm:text-3xl",
};

export function Price({
  amount,
  currency,
  locale,
  compareAt,
  converted,
  unavailableLabel,
  size = "md",
  className,
}: PriceProps) {
  const formatted = formatMoney(amount, currency, locale);

  if (formatted === null) {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>{unavailableLabel}</span>
    );
  }

  const previous = toAmount(compareAt);
  const current = toAmount(amount);
  const percent = discountPercent(amount, compareAt);
  const previousFormatted =
    previous !== null && current !== null && previous > current
      ? formatMoney(previous, currency, locale)
      : null;
  const convertedFormatted = converted
    ? formatApproximateMoney(converted.amount, converted.currency, locale)
    : null;

  return (
    <span className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className={cn("font-heading font-semibold text-foreground", AMOUNT_SIZE[size])}>
        {formatted}
      </span>

      {previousFormatted !== null ? (
        <span className="text-sm text-muted-foreground line-through">{previousFormatted}</span>
      ) : null}

      {percent !== null ? (
        <span className="rounded-full bg-brand-surface px-2 py-0.5 text-xs font-semibold text-brand-text">
          -{percent}%
        </span>
      ) : null}

      {convertedFormatted !== null ? (
        <span className="w-full text-xs text-muted-foreground">{convertedFormatted}</span>
      ) : null}
    </span>
  );
}

/** Estado "cargando" del precio: mismo tamaño final para que la página no salte. */
export function PriceSkeleton({ size = "md" }: { size?: PriceSize }) {
  const height = size === "lg" ? "h-8 w-40" : size === "sm" ? "h-4 w-20" : "h-5 w-28";

  return <Skeleton className={height} />;
}
