import { ProductCard } from "@/components/domain/product-card";
import { Price } from "@/components/domain/price";
import { mediaUrl } from "@/lib/media/url";

import type { ProductSearchItem } from "../api";

/**
 * Grilla de resultados del catálogo (componente de servidor: solo pinta).
 *
 * Honestidad de datos: `ProductSearchItem` **no** trae reputación ni tienda (ver el apartado 7 de
 * `docs/PENDIENTES-BACKEND.md`), así que **no** se pinta `RatingStars`: sería inventar valoraciones. Cuando el
 * backend los devuelva, se añade aquí el hueco `rating`.
 *
 * Las imágenes se sirven por el proxy propio (`mediaUrl`): la clave se valida y, si no es pública, la tarjeta
 * muestra "sin imagen" en lugar de un enlace roto.
 */

export type ProductGridLabels = {
  noImage: string;
  priceUnavailable: string;
};

export function ProductGrid({
  items,
  locale,
  currency,
  labels,
}: {
  items: ProductSearchItem[];
  locale: string;
  currency: string;
  labels: ProductGridLabels;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map((item) => {
        const src = mediaUrl(item.thumbnail);

        return (
          <li key={item.id} className="flex">
            <ProductCard
              // La página de producto llega en la F4; hoy el enlace lleva a la página 404 traducida.
              href={`/p/${item.slug}`}
              title={item.title}
              image={src === null ? null : { src, alt: item.title }}
              noImageLabel={labels.noImage}
              price={
                <Price
                  amount={item.min_price ?? ""}
                  currency={currency}
                  locale={locale}
                  unavailableLabel={labels.priceUnavailable}
                />
              }
              className="w-full"
            />
          </li>
        );
      })}
    </ul>
  );
}
