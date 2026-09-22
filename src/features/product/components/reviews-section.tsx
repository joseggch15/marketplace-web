import { BadgeCheck } from "lucide-react";

import { RatingStars } from "@/components/domain/rating-stars";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format/date";

import type { ProductReview } from "../types";

/**
 * Reseñas del producto (componente de servidor: solo pinta).
 *
 * Qué se muestra y por qué:
 * - La nota media y el número de reseñas tal como los calcula el backend (`rating_average`, `rating_count`).
 *   **Sin reseñas no se pinta ninguna estrella**: no se inventa una valoración.
 * - La reseña verificada se marca solo cuando el backend lo dice (`verified_purchase`).
 * - **No se muestra el nombre de quien reseña**: la API pública no lo devuelve, y no se puede inventar.
 * - La paginación va por cursor en la URL (como en el catálogo), con "Ver más reseñas" en lugar de scroll
 *   infinito: el enlace es compartible y el botón "atrás" funciona.
 *
 * Estados: con reseñas · sin reseñas (vacío) · no se pudieron cargar (error).
 */

export type ReviewsSectionLabels = {
  title: string;
  /** Texto ya interpolado para lectores de pantalla («4,5 de 5 estrellas, 12 reseñas»). */
  average: string;
  empty: string;
  unavailable: string;
  verified: string;
  /** Texto ya interpolado con la nota de una reseña concreta («4 de 5 estrellas»). */
  ratingOf: (rating: number) => string;
  more: string;
  reset: string;
};

export function ReviewsSection({
  reviews,
  labels,
  locale,
  timeZone,
  moreHref,
  resetHref,
}: {
  /** `null` cuando las reseñas no se pudieron cargar. */
  reviews: { items: ProductReview[]; rating_average: string | null; rating_count: number } | null;
  labels: ReviewsSectionLabels;
  locale: string;
  timeZone?: string;
  /** Enlace a la página siguiente de reseñas, o `null` si no hay más. */
  moreHref: string | null;
  /** Enlace para volver a las reseñas más recientes; solo se muestra si hay un cursor activo. */
  resetHref: string | null;
}) {
  const average = reviews === null ? null : Number.parseFloat(reviews.rating_average ?? "");
  const hasRating = average !== null && Number.isFinite(average) && (reviews?.rating_count ?? 0) > 0;

  return (
    <section
      aria-labelledby="reviews-title"
      className="rounded-xl border border-border p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="reviews-title" className="font-heading text-xl font-semibold">
          {labels.title}
        </h2>
        {hasRating && average !== null && reviews !== null ? (
          <RatingStars
            average={average}
            count={reviews.rating_count}
            label={labels.average}
            emptyLabel={labels.empty}
            locale={locale}
            size="md"
          />
        ) : null}
      </div>

      {reviews === null ? (
        <p className="mt-3 text-muted-foreground">{labels.unavailable}</p>
      ) : reviews.items.length === 0 ? (
        <p className="mt-3 text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {reviews.items.map((review) => (
            <li key={review.id} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <RatingStars
                  average={review.rating}
                  label={labels.ratingOf(review.rating)}
                  emptyLabel={labels.empty}
                  locale={locale}
                />
                {review.verified_purchase ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success-strong">
                    <BadgeCheck aria-hidden className="size-3.5" />
                    {labels.verified}
                  </span>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  {formatDate(review.created_at, locale, timeZone)}
                </span>
              </div>

              {review.title !== null && review.title.trim().length > 0 ? (
                <h3 className="mt-2 font-heading text-base font-medium">{review.title}</h3>
              ) : null}

              {review.body !== null && review.body.trim().length > 0 ? (
                <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{review.body}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {moreHref !== null || resetHref !== null ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {moreHref !== null ? (
            <Button asChild variant="outline" size="lg">
              <Link href={moreHref}>{labels.more}</Link>
            </Button>
          ) : null}
          {resetHref !== null ? (
            <Button asChild variant="ghost" size="lg">
              <Link href={resetHref}>{labels.reset}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
