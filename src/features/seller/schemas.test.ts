import { describe, expect, it } from "vitest";

import {
  moneySchema,
  productFormSchema,
  shipmentFormSchema,
  stockSchema,
  storeFormSchema,
  toShipmentBody,
  toVariants,
} from "./schemas";

/**
 * Pruebas de la validación del panel del vendedor.
 *
 * Estas reglas se cumplen **dos veces** (formulario y ruta BFF), así que aquí se protege lo que de verdad evita
 * errores: que el dinero sea decimal positivo en texto (nunca `number`), que no se pueda crear un producto sin
 * variantes y que un envío no se prepare sin transportadora.
 */

const VALID_PRODUCT = {
  title: "Camiseta de algodón",
  description: "",
  brand: "",
  categoryId: "9f1c1a2e-0000-4000-8000-000000000001",
  skuPrefix: "cami",
  price: "89900.00",
  stock: 12,
  attributes: [{ attributeId: "9f1c1a2e-0000-4000-8000-000000000002", valuesText: "rojo, azul" }],
};

describe("moneySchema", () => {
  it("acepta un decimal con dos cifras como texto", () => {
    expect(moneySchema.safeParse("89900.00").success).toBe(true);
    expect(moneySchema.safeParse("1500").success).toBe(true);
  });

  it("rechaza el cero (un producto no se regala) y los formatos raros", () => {
    expect(moneySchema.safeParse("0.00").success).toBe(false);
    expect(moneySchema.safeParse("12.345").success).toBe(false);
    expect(moneySchema.safeParse("1.500,00").success).toBe(false);
    expect(moneySchema.safeParse("").success).toBe(false);
  });

  it("acepta cadenas con espacios alrededor", () => {
    const result = moneySchema.safeParse("  2400.50  ");

    expect(result.success).toBe(true);
    expect(result.data).toBe("2400.50");
  });
});

describe("stockSchema", () => {
  it("convierte el texto del campo a entero y rechaza negativos o decimales", () => {
    expect(stockSchema.parse("12")).toBe(12);
    expect(stockSchema.safeParse("-1").success).toBe(false);
    expect(stockSchema.safeParse("1.5").success).toBe(false);
  });
});

describe("storeFormSchema", () => {
  it("exige un nombre con contenido y normaliza la descripción vacía a nulo", () => {
    expect(storeFormSchema.safeParse({ name: "ab", description: "" }).success).toBe(false);

    const result = storeFormSchema.parse({ name: "  Tienda Demo  ", description: "" });

    expect(result).toEqual({ name: "Tienda Demo", description: null });
  });
});

describe("productFormSchema y toVariants", () => {
  it("acepta un producto con valores y genera sus variantes", () => {
    const result = productFormSchema.safeParse(VALID_PRODUCT);

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    const variants = toVariants(result.data);

    expect(variants.map((variant) => variant.sku)).toEqual(["CAMI-ROJO-1", "CAMI-AZUL-2"]);
    expect(variants[0]).toEqual({
      sku: "CAMI-ROJO-1",
      price: "89900.00",
      stock: 12,
      attribute_values: [{ attribute_id: "9f1c1a2e-0000-4000-8000-000000000002", value: "rojo" }],
    });
  });

  it("no deja crear un producto sin ninguna variante", () => {
    const result = productFormSchema.safeParse({
      ...VALID_PRODUCT,
      attributes: [{ attributeId: VALID_PRODUCT.attributes[0].attributeId, valuesText: "  ,  " }],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("noVariants");
  });

  it("usa el título como código base cuando el vendedor no escribe SKU", () => {
    const result = productFormSchema.parse({ ...VALID_PRODUCT, skuPrefix: "" });

    // El prefijo se recorta a 12 caracteres para que el SKU siga siendo legible y corto.
    expect(toVariants(result)[0].sku).toBe("CAMISETADEAL-ROJO-1");
  });
});

describe("shipmentFormSchema y toShipmentBody", () => {
  it("exige transportadora y acepta el resto vacío", () => {
    const result = shipmentFormSchema.safeParse({
      carrier: "",
      trackingNumber: "",
      trackingUrl: "",
      cost: "0.00",
      notes: "",
    });

    expect(result.success).toBe(false);
  });

  it("no acepta una URL de seguimiento sin http", () => {
    const result = shipmentFormSchema.safeParse({
      carrier: "Servientrega",
      trackingNumber: "123",
      trackingUrl: "www.servientrega.com/guia",
      cost: "0.00",
      notes: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("url");
  });

  it("convierte a los nombres que espera la API", () => {
    const data = shipmentFormSchema.parse({
      carrier: " Servientrega ",
      trackingNumber: " 123 ",
      trackingUrl: "https://servientrega.com/guia/123",
      cost: "0.00",
      notes: "",
    });

    expect(toShipmentBody(data)).toEqual({
      carrier: "Servientrega",
      tracking_number: "123",
      tracking_url: "https://servientrega.com/guia/123",
      cost: "0.00",
      notes: null,
    });
  });
});
