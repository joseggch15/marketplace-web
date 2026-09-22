import { describe, expect, it } from "vitest";

import { formatDate, formatDateTime, parseDate } from "@/lib/format/date";

describe("parseDate", () => {
  it("convierte una fecha ISO en Date", () => {
    expect(parseDate("2026-03-10T15:04:00Z")).toBeInstanceOf(Date);
  });

  it("devuelve null cuando la fecha no es válida (no se inventan fechas)", () => {
    expect(parseDate("no es una fecha")).toBeNull();
    expect(parseDate("")).toBeNull();
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
  });
});

describe("formato de fechas con Intl", () => {
  it("formatea la fecha en el idioma pedido", () => {
    const spanish = formatDate("2026-03-10T15:04:00Z", "es-CO");
    const english = formatDate("2026-03-10T15:04:00Z", "en-US");

    expect(spanish).not.toBeNull();
    expect(english).not.toBeNull();
    expect(spanish).not.toBe(english);
  });

  it("formatea fecha y hora", () => {
    const formatted = formatDateTime("2026-03-10T15:04:00Z", "es-CO");

    expect(formatted).not.toBeNull();
    // El año siempre aparece, sea cual sea el formato elegido por Intl.
    expect(formatted).toContain("2026");
  });

  it("respeta la zona horaria indicada", () => {
    const bogota = formatDateTime("2026-03-10T15:04:00Z", "es-CO", "America/Bogota");
    const madrid = formatDateTime("2026-03-10T15:04:00Z", "es-CO", "Europe/Madrid");

    // Bogotá va 6 horas por detrás de Madrid: la hora formateada debe cambiar.
    expect(bogota).not.toBe(madrid);
  });
});
