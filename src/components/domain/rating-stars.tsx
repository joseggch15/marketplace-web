import { Star } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Calificación de un producto (presentación, sin estado propio).
 *
 * Accesibilidad: las estrellas son decorativas (`aria-hidden`) y el dato real viaja en el texto para
 * lectores de pantalla que llega en `label`; además, el número y la cantidad de reseñas se ven en pantalla,
 * así que la información **nunca depende solo del color** ni de un símbolo.
 *
 * Estados: normal · sin reseñas (vacío) · cargando (esqueleto).
 */

export interface RatingStarsProps {
  /** Promedio de 0 a 5. */
  average: number;
  /**
   * Cantidad de reseñas. Si es 0, se muestra el estado vacío.
   * Se puede omitir para una **valoración suelta** (una reseña concreta): entonces se pintan las estrellas y la
   * nota, sin un contador que no significaría nada.
   */
  count?: number;
  /** Texto traducido para lectores de pantalla (p. ej. «4,5 de 5 estrellas, 128 reseñas»). */
  label: string;
  /** Texto traducido para cuando todavía no hay reseñas. */
  emptyLabel: string;
  /** Idioma para formatear los números con `Intl`. */
  locale: string;
  size?: "sm" | "md";
  className?: string;
}

const STAR_SIZE = { sm: "size-3.5", md: "size-4" } as const;

export function RatingStars({
  average,
  count,
  label,
  emptyLabel,
  locale,
  size = "sm",
  className,
}: RatingStarsProps) {
  const averageFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const countFormatter = new Intl.NumberFormat(locale);

  if (count !== undefined && count <= 0) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-muted-foreground", className)}>
        <Star aria-hidden className={cn(STAR_SIZE[size], "text-border")} />
        <span className="text-xs">{emptyLabel}</span>
      </span>
    );
  }

  const filled = Math.round(average);

  return (
    <span
      role="img"
      aria-label={label}
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      <span aria-hidden className="flex items-center">
        {[1, 2, 3, 4, 5].map((position) => (
          <Star
            key={position}
            className={cn(
              STAR_SIZE[size],
              position <= filled ? "fill-brand text-brand" : "fill-transparent text-border",
            )}
          />
        ))}
      </span>
      <span aria-hidden className="text-xs font-medium text-foreground">
        {averageFormatter.format(average)}
      </span>
      {count === undefined ? null : (
        <span aria-hidden className="text-xs text-muted-foreground">
          ({countFormatter.format(count)})
        </span>
      )}
    </span>
  );
}

/** Estado "cargando" de la calificación. */
export function RatingStarsSkeleton({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-3 w-10" />
    </span>
  );
}
