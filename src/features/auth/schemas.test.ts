import { describe, expect, it } from "vitest";

import {
  addressSchema,
  asValidationKey,
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema,
} from "./schemas";

/**
 * Pruebas de la validación de formularios.
 *
 * Los límites probados aquí son los del backend (`app/modules/identity/schemas.py`). Si alguien cambia uno
 * en el esquema, esta prueba falla y obliga a mirar también el backend: es la red que evita que el usuario
 * vea un error en el navegador y otro distinto del servidor.
 */

describe("loginSchema", () => {
  it("acepta un correo y una contraseña correctos", () => {
    expect(loginSchema.safeParse({ email: "ana@correo.com", password: "secreta123" }).success).toBe(
      true,
    );
  });

  it("normaliza el correo (espacios y mayúsculas)", () => {
    const parsed = loginSchema.parse({ email: "  Ana@Correo.COM ", password: "secreta123" });
    expect(parsed.email).toBe("ana@correo.com");
  });

  it("rechaza un correo con formato inválido", () => {
    const result = loginSchema.safeParse({ email: "no-es-un-correo", password: "secreta123" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("emailInvalid");
  });

  it("rechaza una contraseña vacía (el backend exige al menos 1 carácter)", () => {
    const result = loginSchema.safeParse({ email: "ana@correo.com", password: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("required");
  });
});

describe("registerSchema", () => {
  const valid = {
    fullName: "Ana Pérez",
    email: "ana@correo.com",
    password: "secreta123",
    confirmPassword: "secreta123",
  };

  it("acepta un registro completo", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("exige 8 caracteres de contraseña, igual que el backend", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "corta12",
      confirmPassword: "corta12",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("passwordShort");
  });

  it("avisa cuando las dos contraseñas no coinciden y señala el segundo campo", () => {
    const result = registerSchema.safeParse({
      ...valid,
      confirmPassword: "otra-cosa-123",
    });
    const issue = result.error?.issues[0];
    expect(issue?.message).toBe("passwordMismatch");
    expect(issue?.path).toEqual(["confirmPassword"]);
  });

  it("exige el nombre", () => {
    const result = registerSchema.safeParse({ ...valid, fullName: "   " });
    expect(result.error?.issues[0]?.message).toBe("fullNameRequired");
  });
});

describe("resetPasswordSchema", () => {
  it("exige que las contraseñas coincidan", () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: "nueva-clave-1",
      confirmPassword: "nueva-clave-2",
    });
    expect(result.error?.issues[0]?.message).toBe("passwordMismatch");
  });

  it("acepta una contraseña nueva válida", () => {
    expect(
      resetPasswordSchema.safeParse({
        newPassword: "nueva-clave-1",
        confirmPassword: "nueva-clave-1",
      }).success,
    ).toBe(true);
  });
});

describe("forgotPasswordSchema", () => {
  it("rechaza un correo vacío", () => {
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("pasa la moneda a mayúsculas (el backend la guarda en mayúsculas)", () => {
    const parsed = profileSchema.parse({
      fullName: "Ana Pérez",
      preferredCurrency: "cop",
      preferredLanguage: "es",
      timezone: "America/Bogota",
    });
    expect(parsed.preferredCurrency).toBe("COP");
  });

  it("exige exactamente tres letras de moneda", () => {
    const result = profileSchema.safeParse({
      fullName: "Ana Pérez",
      preferredCurrency: "CO",
      preferredLanguage: "es",
      timezone: "America/Bogota",
    });
    expect(result.error?.issues[0]?.message).toBe("currencyCode");
  });
});

describe("addressSchema", () => {
  const valid = {
    label: "Casa",
    recipientName: "Ana Pérez",
    line1: "Calle 10 # 20-30",
    line2: "",
    city: "Bogotá",
    state: "",
    postalCode: "",
    country: "co",
    phone: "",
    isDefault: true,
  };

  it("acepta una dirección con los campos opcionales vacíos", () => {
    const parsed = addressSchema.parse(valid);
    expect(parsed.country).toBe("CO");
  });

  it("exige un país de dos letras", () => {
    const result = addressSchema.safeParse({ ...valid, country: "COL" });
    expect(result.error?.issues[0]?.message).toBe("countryCode");
  });

  it("exige etiqueta, destinatario y dirección", () => {
    const result = addressSchema.safeParse({ ...valid, label: "", recipientName: "", line1: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "required",
      "required",
      "required",
    ]);
  });
});

describe("asValidationKey", () => {
  it("acepta solo claves de traducción conocidas", () => {
    expect(asValidationKey("required")).toBe("required");
    expect(asValidationKey("algo-raro")).toBeUndefined();
    expect(asValidationKey(undefined)).toBeUndefined();
  });
});
