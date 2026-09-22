import { describe, expect, it } from "vitest";

import {
  availabilityOf,
  defaultVariantId,
  galleryImages,
  isOutOfStock,
  sortedVariants,
  summarizeText,
  totalAvailable,
} from "./selectors";
import type { ProductVariant } from "./types";

/**
 * Pruebas de las funciones puras de la ficha de producto.
 *
 * Se comprueban dos cosas sobre todo:
 * 1. Que el orden y los cálculos sean **exactos** con precios en texto (`Decimal`), sin punto flotante.
 * 2. Que cuando un dato no existe se devuelva `null` en vez de un valor inventado (stock, precio, imágenes).
 */

const cheap: ProductVariant = {
  id: "variante-b",
  sku: "AUD-NEG",
  price: "299900.00",
  compare_at_price: "399900.00",
};
const expensive: ProductVariant = {
  id: "variante-a",
  sku: "AUD-BLA",
  price: "319900.00",
  compare_at_price: null,
};
/** Mismo precio que `cheap`: hace falta un desempate estable (por SKU). */
const samePriceAsCheap: ProductVariant = {
  id: "variante-c",
  sku: "AUD-AAA",
  price: "299900.00",
  compare_at_price: null,
};

describe("sortedVariants", () => {
  it("ordena por precio, de la más barata a la más cara", () => {
    const ordered = sortedVariants([expensive, cheap]);

    expect(ordered.map((variant) => variant.id)).toEqual(["variante-b", "variante-a"]);
  });

  it("a igual precio usa el SKU, para que el orden sea estable", () => {
    const ordered = sortedVariants([cheap, samePriceAsCheap]);

    expect(ordered.map((variant) => variant.sku)).toEqual(["AUD-AAA", "AUD-NEG"]);
  });

  it("no modifica la lista original", () => {
    const original = [expensive, cheap];
    sortedVariants(original);

    expect(original[0]?.id).toBe("variante-a");
  });

  it("compara los decimales con exactitud (2,49 es menos que 2,50)", () => {
    const twoFifty: ProductVariant = {
      id: "p1",
      sku: "P1",
      price: "2.50",
      compare_at_price: null,
    };
    const twoFortyNine: ProductVariant = {
      id: "p2",
      sku: "P2",
      price: "2.49",
      compare_at_price: null,
    };

    expect(sortedVariants([twoFifty, twoFortyNine]).map((variant) => variant.id)).toEqual([
      "p2",
      "p1",
    ]);
  });
});

describe("defaultVariantId", () => {
  it("elige la variante más barata", () => {
    expect(defaultVariantId([expensive, cheap])).toBe("variante-b");
  });

  it("devuelve null si el producto no tiene variantes", () => {
    expect(defaultVariantId([])).toBeNull();
  });
});

describe("galleryImages", () => {
  const product = {
    title: "Audífonos inalámbricos",
    images: [
      {
        id: "2",
        object_key: "products/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.png",
        position: 2,
        alt: "Vista lateral",
      },
      {
        id: "1",
        object_key: "products/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg",
        position: 0,
        alt: "Vista frontal",
      },
    ],
  };

  it("respeta el orden del vendedor (`position`)", () => {
    const images = galleryImages(product);

    expect(images.map((image) => image.src)).toEqual([
      "/api/media/products/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg",
      "/api/media/products/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.png",
    ]);
  });

  it("usa el título del producto cuando la imagen no tiene texto alternativo", () => {
    const images = galleryImages({
      title: "Audífonos inalámbricos",
      images: [
        {
          id: "1",
          object_key: "products/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg",
          position: 0,
          alt: "  ",
        },
      ],
    });

    expect(images[0]?.alt).toBe("Audífonos inalámbricos");
  });

  it("descarta las claves que el proxy de medios no puede servir (nunca deja un enlace roto)", () => {
    const images = galleryImages({
      title: "Producto",
      images: [
        { id: "1", object_key: "invoices/factura.pdf", position: 0, alt: "Documento" },
        {
          id: "2",
          object_key: "products/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg",
          position: 1,
          alt: "Foto",
        },
      ],
    });

    expect(images).toHaveLength(1);
    expect(images[0]?.src).toBe("/api/media/products/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg");
  });

  it("devuelve una lista vacía si el producto no tiene imágenes", () => {
    expect(galleryImages({ title: "Producto", images: [] })).toEqual([]);
    expect(galleryImages({ title: "Producto" })).toEqual([]);
  });
});

describe("availabilityOf", () => {
  it("devuelve las unidades de la variante", () => {
    expect(availabilityOf({ "variante-b": 7 }, "variante-b")).toBe(7);
  });

  it("devuelve 0 cuando la variante no tiene registro de inventario", () => {
    expect(availabilityOf({ "variante-b": 7 }, "variante-otra")).toBe(0);
  });

  it("devuelve null cuando no se pudo comprobar el stock (no afirma nada)", () => {
    expect(availabilityOf(null, "variante-b")).toBeNull();
  });
});

describe("isOutOfStock", () => {
  const variants = [cheap, expensive];

  it("es cierto solo cuando ninguna variante tiene unidades", () => {
    expect(isOutOfStock(variants, { "variante-b": 0, "variante-a": 0 })).toBe(true);
    expect(isOutOfStock(variants, { "variante-b": 1, "variante-a": 0 })).toBe(false);
  });

  it("es falso si no se pudo comprobar el stock", () => {
    expect(isOutOfStock(variants, null)).toBe(false);
  });

  it("es falso si el producto no tiene variantes", () => {
    expect(isOutOfStock([], {})).toBe(false);
  });
});

describe("totalAvailable", () => {
  it("suma las unidades de todas las variantes", () => {
    expect(totalAvailable({ a: 3, b: 4 })).toBe(7);
  });

  it("ignora los valores negativos (no hay stock negativo que vender)", () => {
    expect(totalAvailable({ a: 3, b: -2 })).toBe(3);
  });

  it("devuelve null si no se pudo comprobar", () => {
    expect(totalAvailable(null)).toBeNull();
  });
});

describe("summarizeText", () => {
  it("deja el texto en una sola línea", () => {
    expect(summarizeText("  Hola\n\n  mundo  ")).toBe("Hola mundo");
  });

  it("recorta el texto largo con puntos suspensivos", () => {
    const summary = summarizeText("a".repeat(400));

    expect(summary).toHaveLength(300);
    expect(summary.endsWith("…")).toBe(true);
  });

  it("no toca el texto que ya es corto", () => {
    expect(summarizeText("Audífonos con cancelación de ruido")).toBe(
      "Audífonos con cancelación de ruido",
    );
  });
});
