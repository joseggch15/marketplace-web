import { describe, expect, it } from "vitest";

import type { ProductVariant, SellerProduct } from "./types";
import {
  buildVariants,
  canClose,
  canPause,
  canPublish,
  countCombinations,
  parseValues,
  skuFor,
  totalAvailable,
  usableAttributes,
  variantLabel,
} from "./variants";

/**
 * Pruebas de la construcción de variantes.
 *
 * Es la lógica más delicada de la F8: lo que salga de aquí se manda al backend al crear un producto. Se protege
 * lo que de verdad importa: que un valor no se duplique, que el cartesiano no se coma combinaciones, que los SKU
 * sean usables (sin acentos, sin espacios, no vacíos) y que la interfaz no ofrezca acciones que la API rechaza.
 */

function variant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: "variant-1",
    sku: "CAMI-ROJO-M-1",
    price: "89900.00",
    compare_at_price: null,
    stock: 10,
    available: 8,
    attribute_values: [
      { attribute_id: "attr-color", name: "Color", value: "Rojo" },
      { attribute_id: "attr-size", name: "Talla", value: "M" },
    ],
    ...overrides,
  };
}

function product(overrides: Partial<SellerProduct> = {}): SellerProduct {
  return {
    id: "product-1",
    store_id: "store-1",
    category_id: "category-1",
    title: "Camiseta",
    slug: "camiseta",
    description: null,
    brand: null,
    status: "draft",
    created_at: "2026-09-22T12:00:00Z",
    total_available: 8,
    sold_count: 0,
    variants: [variant()],
    images: [],
    ...overrides,
  };
}

describe("parseValues", () => {
  it("limpia espacios, descarta vacíos y no repite valores", () => {
    expect(parseValues(" rojo, azul , ,Rojo,  ")).toEqual(["rojo", "azul"]);
  });

  it("devuelve una lista vacía cuando el campo está vacío", () => {
    expect(parseValues("")).toEqual([]);
    expect(parseValues("   ,  , ")).toEqual([]);
  });

  it("conserva el valor tal como lo escribió la primera vez", () => {
    expect(parseValues("Negro, NEGRO")).toEqual(["Negro"]);
  });
});

describe("countCombinations", () => {
  it("multiplica los valores de los atributos que tienen valores", () => {
    expect(
      countCombinations([
        { attributeId: "a", name: "Color", values: ["Rojo", "Azul"] },
        { attributeId: "b", name: "Talla", values: ["S", "M", "L"] },
      ]),
    ).toBe(6);
  });

  it("ignora los atributos sin valores (el de una categoría que no se usa)", () => {
    expect(
      countCombinations([
        { attributeId: "a", name: "Color", values: ["Rojo"] },
        { attributeId: "b", name: "Talla", values: [] },
      ]),
    ).toBe(1);
  });

  it("devuelve 0 cuando no hay nada que generar", () => {
    expect(countCombinations([])).toEqual(0);
    expect(usableAttributes([{ attributeId: "a", name: "Color", values: [] }])).toEqual([]);
  });
});

describe("skuFor", () => {
  it("junta el prefijo, los valores y el número, sin acentos ni espacios", () => {
    expect(skuFor("Camiseta niño", ["Azul marino", "M"], 0)).toBe("CAMISETANINO-AZULMARINO-M-1");
  });

  it("nunca devuelve un SKU vacío aunque el prefijo y los valores no sirvan", () => {
    expect(skuFor("", ["---"], 2)).toBe("3");
  });
});

describe("buildVariants", () => {
  it("genera el producto cartesiano con el mismo precio y stock", () => {
    const variants = buildVariants({
      attributes: [
        { attributeId: "attr-color", name: "Color", values: ["Rojo", "Azul"] },
        { attributeId: "attr-size", name: "Talla", values: ["S", "M"] },
      ],
      price: "89900.00",
      stock: 4,
      skuPrefix: "camiseta",
    });

    expect(variants).toHaveLength(4);
    expect(variants[0]).toEqual({
      sku: "CAMISETA-ROJO-S-1",
      price: "89900.00",
      stock: 4,
      attribute_values: [
        { attribute_id: "attr-color", value: "Rojo" },
        { attribute_id: "attr-size", value: "S" },
      ],
    });
    expect(variants[3].sku).toBe("CAMISETA-AZUL-M-4");
    expect(variants[3].attribute_values).toEqual([
      { attribute_id: "attr-color", value: "Azul" },
      { attribute_id: "attr-size", value: "M" },
    ]);
  });

  it("no genera nada si ningún atributo tiene valores (la interfaz lo avisa)", () => {
    expect(
      buildVariants({
        attributes: [{ attributeId: "attr-color", name: "Color", values: [] }],
        price: "1000.00",
        stock: 1,
        skuPrefix: "x",
      }),
    ).toEqual([]);
  });
});

describe("variantLabel", () => {
  it("lee los atributos de la variante con su nombre", () => {
    expect(variantLabel(variant())).toBe("Color: Rojo / Talla: M");
  });

  it("usa el SKU cuando la variante no tiene atributos", () => {
    expect(variantLabel(variant({ attribute_values: [], sku: "UNICA-1" }))).toBe("UNICA-1");
  });
});

describe("totalAvailable y estados del producto", () => {
  it("suma lo disponible de todas las variantes (no el stock total)", () => {
    expect(
      totalAvailable(product({ variants: [variant(), variant({ id: "v2", available: 0 })] })),
    ).toBe(8);
  });

  it("respeta la máquina de estados del backend", () => {
    expect(canPublish(product({ status: "draft" }))).toBe(true);
    expect(canPublish(product({ status: "active" }))).toBe(false);
    expect(canPause(product({ status: "active" }))).toBe(true);
    expect(canPause(product({ status: "paused" }))).toBe(false);
    expect(canClose(product({ status: "closed" }))).toBe(false);
    expect(canClose(product({ status: "paused" }))).toBe(true);
  });
});
