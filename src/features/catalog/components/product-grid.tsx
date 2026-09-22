import { DealBadge, type DealBadgeKind } from "@/components/domain/deal-badge";
import { ProductCard, ProductCardSkeleton } from "@/components/domain/product-card";
import { Price } from "@/components/domain/price";
import { RatingStars } from "@/components/domain/rating-stars";
import { mediaUrl } from "@/lib/media/url";

import type { ProductSearchItem } from "../api";

/**
 * Grilla de resultados del catálogo (componente de servidor: solo pinta).
 *
 * Datos reales que ahora sí se muestran (antes no existían en la respuesta de la búsqueda): la
 * **reputación** (`rating_average` + `review_count`, solo si hay reseñas de verdad), la **tienda**
 * (`store_name`) y las **unidades vendidas** (`sold_count`, solo si es mayor que cero). Si un dato falta o
 * es cero, **no se pinta**: nada de estrellas vacías ni de «0 vendidos» por rellenar hueco.
 *
 * Las imágenes se sirven por el proxy propio (`mediaUrl`): la clave se valida y, si no es pública, la tarjeta
 * muestra "sin imagen" en lugar de un enlace roto.
 */

export type ProductGridLabels = {
  noImage: string;
  priceUnavailable: string;
  /** Etiqueta accesible de la reputación: «4,6 de 5 estrellas, 128 reseñas». */
  ratingLabel?: (rating: string, count: number) => string;
  /** Texto para cuando el producto todavía no tiene reseñas. */
  ratingEmpty?: string;
  /** «12 vendidos». */
  soldLabel?: (count: number) => string;
  /** «Vendido por Tienda Demo». */
  storeLabel?: (store: string) => string;
};

export function ProductGrid({
  items,
  locale,
  currency,
  labels,
  badgeFor,
}: {
  items: ProductSearchItem[];
  locale: string;
  currency: string;
  labels: ProductGridLabels;
  /** Insignias por producto (p. ej. «más vendido» en la portada). Opcional. */
  badgeFor?: (item: ProductSearchItem) => { kind: DealBadgeKind; label: string } | null;
}) {
  const numberFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map((item) => {
        const src = mediaUrl(item.thumbnail);
        const rating = item.rating_average === null ? null : Number(item.rating_average);
        const hasRating = rating !== null && Number.isFinite(rating) && item.review_count > 0;
        const badge = badgeFor?.(item) ?? null;

        return (
          <li key={item.id} className="flex">
            <ProductCard
              // La ficha vive en `/p/<slug>` (URL bonita y estable). La ruta también acepta el
              // identificador, así que los enlaces antiguos siguen funcionando.
              href={`/p/${item.slug}`}
              title={item.title}
              image={src === null ? null : { src, alt: item.title }}
              noImageLabel={labels.noImage}
              badges={
                badge === null ? undefined : <DealBadge kind={badge.kind} label={badge.label} />
              }
              rating={
                hasRating && labels.ratingLabel !== undefined ? (
                  <RatingStars
                    average={rating}
                    count={item.review_count}
                    locale={locale}
                    label={labels.ratingLabel(numberFormat.format(rating), item.review_count)}
                    emptyLabel={labels.ratingEmpty ?? ""}
                  />
                ) : undefined
              }
              price={
                <div className="flex flex-col gap-1">
                  <Price
                    amount={item.min_price ?? ""}
                    currency={currency}
                    locale={locale}
                    unavailableLabel={labels.priceUnavailable}
                  />
                  {labels.storeLabel !== undefined && item.store_name.length > 0 ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {labels.storeLabel(item.store_name)}
                    </span>
                  ) : null}
                  {labels.soldLabel !== undefined && item.sold_count > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {labels.soldLabel(item.sold_count)}
                    </span>
                  ) : null}
                </div>
              }
              className="w-full"
            />
          </li>
        );
      })}
    </ul>
  );
}

/** Estado "cargando" de la grilla: la misma silueta, tarjeta por tarjeta. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex">
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
