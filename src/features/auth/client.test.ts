import { describe, expect, it } from "vitest";

import { toAddressBody } from "./client";
import { authErrorMessageKey, problemCode } from "./error-codes";

/**
 * Pruebas de la traducción de errores y de la conversión de direcciones.
 *
 * Son dos piezas pequeñas pero críticas: si el `code` no se reconoce, el usuario ve un texto genérico en vez
 * del motivo real, y si la conversión está mal, la dirección se guarda a medias.
 */

describe("authErrorMessageKey", () => {
  it("reconoce los códigos reales del backend", () => {
    expect(authErrorMessageKey("invalid_credentials")).toBe("invalid_credentials");
    expect(authErrorMessageKey("email_already_registered")).toBe("email_already_registered");
    expect(authErrorMessageKey("invalid_refresh_token")).toBe("invalid_refresh_token");
    expect(authErrorMessageKey("too_many_requests")).toBe("too_many_requests");
  });

  it("cae en `unknown` con códigos desconocidos o valores que no son texto", () => {
    expect(authErrorMessageKey("codigo_inventado")).toBe("unknown");
    expect(authErrorMessageKey(null)).toBe("unknown");
    expect(authErrorMessageKey(42)).toBe("unknown");
    expect(authErrorMessageKey(undefined)).toBe("unknown");
  });
});

describe("problemCode", () => {
  it("extrae el código del Problem Details", () => {
    expect(problemCode({ code: "invalid_token", status: 400 })).toBe("invalid_token");
  });

  it("devuelve null si no hay código", () => {
    expect(problemCode({ detail: "algo" })).toBeNull();
    expect(problemCode("texto plano")).toBeNull();
    expect(problemCode(null)).toBeNull();
  });
});

describe("toAddressBody", () => {
  const values = {
    label: "  Casa  ",
    recipientName: "Ana Pérez",
    line1: "Calle 10 # 20-30",
    line2: "",
    city: "Bogotá",
    state: "",
    postalCode: "",
    country: "co",
    phone: "  ",
    isDefault: true,
  };

  it("recorta los espacios y pone el país en mayúsculas", () => {
    const body = toAddressBody(values);
    expect(body.label).toBe("Casa");
    expect(body.country).toBe("CO");
  });

  it("envía null (no cadena vacía) en los campos opcionales sin dato", () => {
    const body = toAddressBody(values);
    expect(body.line2).toBeNull();
    expect(body.state).toBeNull();
    expect(body.postal_code).toBeNull();
    expect(body.phone).toBeNull();
  });

  it("conserva los opcionales que sí se rellenaron", () => {
    const body = toAddressBody({ ...values, line2: "Torre 3, apto 501", phone: "300 123 4567" });
    expect(body.line2).toBe("Torre 3, apto 501");
    expect(body.phone).toBe("300 123 4567");
  });

  it("usa los nombres de campo que espera la API", () => {
    const body = toAddressBody(values);
    expect(Object.keys(body).sort()).toEqual([
      "city",
      "country",
      "is_default",
      "label",
      "line1",
      "line2",
      "phone",
      "postal_code",
      "recipient_name",
      "state",
    ]);
  });
});
