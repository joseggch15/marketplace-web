import { compareAmounts } from "@/lib/format/money";
import { mediaUrl } from "@/lib/media/url";

import type { Availability, Product, ProductVariant } from "./types";

/**
 * Ayudas para trabajar con los datos de un producto.
 *
 * Son funciones **puras** (sin estado, sin peticiones y sin depender de React), así que se pueden probar a
 * fondo. Es el mismo criterio que en `features/catalog/selectors.ts`.
 *
 * Honestidad de datos: todo lo que devuelven sale del backend. Cuando un dato no existe, la función devuelve
 * `null` y la interfaz muestra su estado vacío en vez de inventar un valor.
 */

export type GalleryEntry = { src: string; alt: string };

/**
 * Imágenes de la galería: en el orden que eligió el vendedor (`position`) y solo las que el proxy de medios
 * puede servir (`mediaUrl` valida la clave y devuelve `null` si no es pública).
 */
export function galleryImages(product: Pick<Product, "title" | "images">): GalleryEntry[] {
  const ordered = [...(product.images ?? [])].sort((a, b) => a.position - b.position);

  return ordered.flatMap((image) => {
    const src = mediaUrl(image.object_key);
    const alt = image.alt?.trim() ?? "";

    // Si la imagen no tiene texto alternativo se usa el título del producto: una imagen de producto **siempre**
    // debe tener texto alternativo (WCAG 2.2 AA).
    return src === null ? [] : [{ src, alt: alt.length > 0 ? alt : product.title }];
  });
}

/**
 * Variantes ordenadas por precio (la más barata primero) y, a igual precio, por SKU.
 *
 * Por qué un orden propio: el backend devuelve las variantes sin un orden garantizado, y una ficha con la
 * presentación más barata primero es más útil. `compareAmounts` compara en unidades menores exactas (nada de
 * punto flotante con dinero) y devuelve `null` si un precio no se puede leer, en cuyo caso se usa el SKU.
 */
export function sortedVariants(variants: ProductVariant[]): ProductVariant[] {
  return [...variants].sort((a, b) => {
    const byPrice = compareAmounts(a.price, b.price);

    if (byPrice !== null && byPrice !== 0) {
      return byPrice;
    }

    return a.sku.localeCompare(b.sku);
  });
}

/** Variante que se muestra seleccionada al abrir la página: la más barata. `null` si no hay variantes. */
export function defaultVariantId(variants: ProductVariant[]): string | null {
  return sortedVariants(variants)[0]?.id ?? null;
}

/** Rango de precios de las variantes, como texto (tal cual llega del backend). `null` si no hay ninguna. */
export function variantPriceRange(variants: ProductVariant[]): { min: string; max: string } | null {
  const ordered = sortedVariants(variants);
  const cheapest = ordered[0];

  if (cheapest === undefined) {
    return null;
  }

  const mostExpensive = ordered[ordered.length - 1] ?? cheapest;

  return { min: cheapest.price, max: mostExpensive.price };
}

/**
 * Texto corto de una sola línea para `description` y Open Graph.
 *
 * La descripción de un producto puede tener hasta 5000 caracteres; los buscadores y las tarjetas de las redes
 * muestran alrededor de 300, así que se recorta **en el resumen** y no en la página: la ficha muestra el texto
 * completo en su sección de descripción.
 */
export function summarizeText(text: string, maxLength = 300): string {
  const single = text.replace(/\s+/g, " ").trim();

  return single.length > maxLength ? `${single.slice(0, maxLength - 1).trimEnd()}…` : single;
}

/**
 * Unidades disponibles de una variante.
 *
 * - `null` cuando **no se pudo comprobar** el stock (el backend no responde): la interfaz lo dice y no afirma
 *   nada.
 * - `0` cuando la variante no tiene registro de inventario: no hay nada que vender.
 */
export function availabilityOf(
  availability: Availability | null,
  variantId: string,
): number | null {
  if (availability === null) {
    return null;
  }

  return availability[variantId] ?? 0;
}

/**
 * ¿Ninguna variante tiene unidades?
 *
 * Solo se puede afirmar cuando el stock se comprobó: si no se pudo, devuelve `false` y la interfaz muestra
 * "no pudimos comprobar el stock" en lugar de "agotado".
 */
export function isOutOfStock(
  variants: ProductVariant[],
  availability: Availability | null,
): boolean {
  if (availability === null || variants.length === 0) {
    return false;
  }

  return variants.every((variant) => (availability[variant.id] ?? 0) <= 0);
}

/** Unidades disponibles sumando todas las variantes, o `null` si no se pudo comprobar. */
export function totalAvailable(availability: Availability | null): number | null {
  if (availability === null) {
    return null;
  }

  return Object.values(availability).reduce((total, units) => total + Math.max(0, units), 0);
}
