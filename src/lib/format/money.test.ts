import { describe, expect, it } from "vitest";

import {
  discountPercent,
  formatApproximateMoney,
  formatMoney,
  toAmount,
} from "@/lib/format/money";

describe("toAmount", () => {
  it("acepta números y cadenas (el backend envía Decimal)", () => {
    expect(toAmount(125000)).toBe(125000);
    expect(toAmount("125000.50")).toBe(125000.5);
  });

  it("devuelve null cuando el valor no es un monto válido", () => {
    expect(toAmount("—")).toBeNull();
    expect(toAmount("")).toBeNull();
    expect(toAmount(null)).toBeNull();
    expect(toAmount(undefined)).toBeNull();
    expect(toAmount("no disponible")).toBeNull();
  });
});

describe("formatMoney", () => {
  it("formatea en la moneda e idioma indicados", () => {
    const formatted = formatMoney(125000, "COP", "es-CO");

    expect(formatted).not.toBeNull();
    expect(formatted).toContain("125");
  });

  it("respeta el idioma al formatear", () => {
    const spanish = formatMoney(1234.5, "USD", "es-CO");
    const english = formatMoney(1234.5, "USD", "en-US");

    expect(spanish).not.toBe(english);
  });

  it("devuelve null si el monto no es válido (nunca inventa un número)", () => {
    expect(formatMoney("—", "COP", "es-CO")).toBeNull();
  });
});

describe("formatApproximateMoney", () => {
  it("antepone «≈» porque el precio convertido es informativo", () => {
    const formatted = formatApproximateMoney(31.5, "USD", "es-CO");

    expect(formatted?.startsWith("≈")).toBe(true);
  });

  it("devuelve null si el monto no es válido", () => {
    expect(formatApproximateMoney("—", "USD", "es-CO")).toBeNull();
  });
});

describe("discountPercent", () => {
  it("calcula el porcentaje solo cuando hay descuento real", () => {
    expect(discountPercent(125000, 162000)).toBe(23);
  });

  it("devuelve null si no hay precio anterior, es igual o es menor", () => {
    expect(discountPercent(125000, null)).toBeNull();
    expect(discountPercent(125000, 125000)).toBeNull();
    expect(discountPercent(125000, 100000)).toBeNull();
    expect(discountPercent(125000, 0)).toBeNull();
  });
});
