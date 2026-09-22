import { describe, expect, it } from "vitest";

import { buildBreadcrumbJsonLd, buildProductJsonLd } from "./json-ld";
import type { ProductVariant } from "./types";

/**
 * Pruebas de los datos estructurados (SEO).
 *
 * Lo que se protege aquí no es "que salga un JSON", sino las reglas que evitan anunciar datos falsos a los
 * buscadores: sin reseñas no hay valoración, y la disponibilidad solo se declara cuando se comprobó.
 */

const variants: ProductVariant[] = [
  { id: "v1", sku: "AUD-NEG", price: "299900.00", compare_at_price: null, stock: 0, available: 0 },
  { id: "v2", sku: "AUD-BLA", price: "319900.00", compare_at_price: null, stock: 0, available: 0 },
];

const base = {
  title: "Audífonos inalámbricos",
  description: "  Con cancelación de ruido.  ",
  brand: "MarcaViva",
  sku: null,
  url: "http://localhost:3000/es/p/11111111-1111-1111-1111-111111111111",
  images: ["http://localhost:3000/api/media/products/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg"],
  variants,
  currency: "COP",
};

describe("buildProductJsonLd", () => {
  it("declara el producto con su oferta más barata en la moneda del vendedor", () => {
    const data = buildProductJsonLd({ ...base, availableUnits: 5, rating: null });

    expect(data["@type"]).toBe("Product");
    expect(data.name).toBe("Audífonos inalámbricos");
    expect(data.description).toBe("Con cancelación de ruido.");
    expect(data.brand).toEqual({ "@type": "Brand", name: "MarcaViva" });
    expect(data.offers).toMatchObject({
      "@type": "Offer",
      price: "299900.00",
      priceCurrency: "COP",
      availability: "https://schema.org/InStock",
    });
  });

  it("marca la oferta como agotada solo si de verdad no hay unidades", () => {
    const data = buildProductJsonLd({ ...base, availableUnits: 0, rating: null });

    expect(data.offers).toMatchObject({ availability: "https://schema.org/OutOfStock" });
  });

  it("omite la disponibilidad cuando no se pudo comprobar el stock", () => {
    const data = buildProductJsonLd({ ...base, availableUnits: null, rating: null });
    const offers = data.offers as Record<string, unknown>;

    expect(offers).not.toHaveProperty("availability");
    expect(offers.price).toBe("299900.00");
  });

  it("no declara valoración si todavía no hay reseñas", () => {
    const data = buildProductJsonLd({ ...base, availableUnits: 1, rating: null });

    expect(data).not.toHaveProperty("aggregateRating");
  });

  it("declara la valoración con su nota media y su número de reseñas", () => {
    const data = buildProductJsonLd({
      ...base,
      availableUnits: 1,
      rating: { average: 4.5, count: 12 },
    });

    expect(data.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.5,
      reviewCount: 12,
      bestRating: 5,
      worstRating: 1,
    });
  });

  it("no incluye un SKU que no representa al producto (varias variantes)", () => {
    const data = buildProductJsonLd({ ...base, availableUnits: 1, rating: null });

    expect(data).not.toHaveProperty("sku");
  });

  it("incluye el SKU cuando el producto tiene una sola variante", () => {
    const data = buildProductJsonLd({
      ...base,
      sku: "AUD-NEG",
      variants: [variants[0] as ProductVariant],
      availableUnits: 1,
      rating: null,
    });

    expect(data.sku).toBe("AUD-NEG");
  });

  it("no inventa oferta ni imágenes si el producto no tiene ninguna", () => {
    const data = buildProductJsonLd({
      ...base,
      variants: [],
      images: [],
      availableUnits: 0,
      rating: null,
    });

    expect(data).not.toHaveProperty("offers");
    expect(data).not.toHaveProperty("image");
  });

  it("no declara marca ni descripción vacías", () => {
    const data = buildProductJsonLd({
      ...base,
      brand: "   ",
      description: null,
      availableUnits: 1,
      rating: null,
    });

    expect(data).not.toHaveProperty("brand");
    expect(data).not.toHaveProperty("description");
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("numera los niveles empezando por 1", () => {
    const data = buildBreadcrumbJsonLd([
      { name: "Inicio", url: "http://localhost:3000/es" },
      { name: "Tecnología", url: "http://localhost:3000/es/c/tecnologia" },
      { name: "Audífonos", url: "http://localhost:3000/es/p/v1" },
    ]);

    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Inicio", item: "http://localhost:3000/es" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tecnología",
        item: "http://localhost:3000/es/c/tecnologia",
      },
      { "@type": "ListItem", position: 3, name: "Audífonos", item: "http://localhost:3000/es/p/v1" },
    ]);
  });
});
