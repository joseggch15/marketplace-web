import { sortedVariants } from "./selectors";
import type { ProductVariant } from "./types";

/**
 * Datos estructurados de la página de producto (SEO).
 *
 * Qué se declara y qué **no**, que es lo importante:
 * - `Product` con `name`, `brand`, `image` y `description`.
 * - **Un solo `Offer`** con el precio de la variante más barata y la moneda del vendedor. Es lo honesto: la
 *   ficha puede tener varias presentaciones con precios distintos, y anunciar una horquilla no es válido para
 *   Google. El resto de precios se ven en la página.
 * - `availability` **solo** cuando el stock se comprobó de verdad. Si no se pudo, se omite el campo en lugar de
 *   decir `InStock` a ciegas.
 * - `aggregateRating` **solo** si hay reseñas (`count > 0`). Sin reseñas no se declara nada: declarar una nota
 *   inventada es exactamente lo que el proyecto prohíbe.
 * - No se declara `seller` ni `shippingDetails` porque la API pública todavía no devuelve los datos de la
 *   tienda ni los de envío (ver `docs/PENDIENTES-BACKEND.md`).
 */

export type JsonLdObject = Record<string, unknown>;

export type ProductJsonLdInput = {
  title: string;
  description: string | null;
  brand: string | null;
  /** SKU, solo cuando el producto tiene una única variante (si hay varias, no representa al producto). */
  sku: string | null;
  /** URL absoluta y canónica de la página. */
  url: string;
  /** URLs absolutas de las imágenes. */
  images: string[];
  variants: ProductVariant[];
  /** Código ISO 4217 de la moneda del vendedor. */
  currency: string;
  /** Unidades disponibles sumando variantes, o `null` si no se pudo comprobar el stock. */
  availableUnits: number | null;
  /** Nota media y número de reseñas. `null` cuando todavía no hay ninguna. */
  rating: { average: number; count: number } | null;
};

/** JSON-LD de tipo `Product` con su oferta (y su valoración, si la hay). */
export function buildProductJsonLd(input: ProductJsonLdInput): JsonLdObject {
  const cheapest = sortedVariants(input.variants)[0] ?? null;
  const inStock = input.availableUnits === null ? null : input.availableUnits > 0;
  const description = input.description?.trim() ?? "";

  const offer =
    cheapest === null
      ? null
      : {
          "@type": "Offer",
          url: input.url,
          price: cheapest.price,
          priceCurrency: input.currency,
          itemCondition: "https://schema.org/NewCondition",
          ...(inStock === null
            ? {}
            : {
                availability: inStock
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              }),
        };

  const aggregateRating =
    input.rating === null || input.rating.count <= 0
      ? null
      : {
          "@type": "AggregateRating",
          ratingValue: input.rating.average,
          reviewCount: input.rating.count,
          bestRating: 5,
          worstRating: 1,
        };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.title,
    url: input.url,
    ...(description.length === 0 ? {} : { description }),
    ...(input.brand === null || input.brand.trim().length === 0
      ? {}
      : { brand: { "@type": "Brand", name: input.brand.trim() } }),
    ...(input.sku === null ? {} : { sku: input.sku }),
    ...(input.images.length === 0 ? {} : { image: input.images }),
    ...(offer === null ? {} : { offers: offer }),
    ...(aggregateRating === null ? {} : { aggregateRating }),
  };
}

/** JSON-LD de migas de pan (`BreadcrumbList`), con la posición de cada nivel. */
export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
