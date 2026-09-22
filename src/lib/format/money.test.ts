import { describe, expect, it } from "vitest";

import {
  compareAmounts,
  discountPercent,
  formatApproximateMoney,
  formatMoney,
  toAmount,
  toMinorUnits,
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

describe("compareAmounts", () => {
  it("compara precios en texto sin usar punto flotante", () => {
    expect(compareAmounts("299900.00", "319900.00")).toBe(-1);
    expect(compareAmounts("319900.00", "299900.00")).toBe(1);
    expect(compareAmounts("299900.00", "299900.00")).toBe(0);
  });

  it("distingue céntimos que un float redondearía mal", () => {
    expect(compareAmounts("0.1", "0.2")).toBe(-1);
    expect(compareAmounts("123456789012345.67", "123456789012345.68")).toBe(-1);
  });

  it("acepta números y cadenas por igual", () => {
    expect(compareAmounts(125000, "125000.00")).toBe(0);
  });

  it("devuelve null cuando algún monto no es válido (no adivina)", () => {
    expect(compareAmounts("—", "100")).toBeNull();
    expect(compareAmounts(null, "100")).toBeNull();
    expect(compareAmounts("1.234.567", "100")).toBeNull();
    expect(compareAmounts("10.999", "11")).toBeNull();
  });
});

describe("toMinorUnits", () => {
  it("convierte el monto a unidades menores exactas", () => {
    // Se construyen con `BigInt(...)` y no con literales (`0n`) porque `tsconfig` compila por debajo de ES2020
    // y TypeScript rechaza los literales de BigInt en ese objetivo.
    expect(toMinorUnits("299900.00")).toBe(BigInt(29990000));
    expect(toMinorUnits("299900")).toBe(BigInt(29990000));
    expect(toMinorUnits("0.05")).toBe(BigInt(5));
  });

  it("devuelve null si el valor no es un monto", () => {
    expect(toMinorUnits("")).toBeNull();
    expect(toMinorUnits("no disponible")).toBeNull();
    expect(toMinorUnits(Number.POSITIVE_INFINITY)).toBeNull();
    expect(toMinorUnits(undefined)).toBeNull();
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
