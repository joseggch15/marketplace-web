import { describe, expect, it } from "vitest";

import { isPublicMediaKey } from "@/lib/media/keys";

/**
 * Pruebas de la validación de claves del proxy de medios.
 *
 * Esta es una regla de **seguridad**: si una de estas pruebas falla, el proxy podría estar sirviendo
 * archivos que no debería (por ejemplo, documentos de verificación de vendedores).
 */
describe("isPublicMediaKey", () => {
  it("acepta las claves que genera hoy el backend (products/<32 hex><ext>)", () => {
    expect(isPublicMediaKey("products/9c1f4a2b7d8e0f1a2b3c4d5e6f708192.jpg")).toBe(true);
    expect(isPublicMediaKey("products/a1b2c3d4e5f60718293a4b5c6d7e8f90.png")).toBe(true);
  });

  it("acepta logos de tienda (prefijo reservado stores/)", () => {
    expect(isPublicMediaKey("stores/logo-tienda.webp")).toBe(true);
  });

  it("rechaza prefijos que no son públicos", () => {
    expect(isPublicMediaKey("verification/cedula.jpg")).toBe(false);
    expect(isPublicMediaKey("sellers/documents/rut.pdf")).toBe(false);
    expect(isPublicMediaKey("invoices/2026/factura-001.pdf")).toBe(false);
    expect(isPublicMediaKey("products.jpg")).toBe(false);
  });

  it("rechaza recorridos de ruta y barras extra", () => {
    expect(isPublicMediaKey("products/../secreto.jpg")).toBe(false);
    expect(isPublicMediaKey("products/..%2Fsecreto.jpg")).toBe(false);
    expect(isPublicMediaKey("products/subcarpeta/foto.jpg")).toBe(false);
    expect(isPublicMediaKey("products/")).toBe(false);
    expect(isPublicMediaKey("products//foto.jpg")).toBe(false);
  });

  it("rechaza extensiones que no son de imagen", () => {
    expect(isPublicMediaKey("products/archivo.pdf")).toBe(false);
    expect(isPublicMediaKey("products/script.js")).toBe(false);
    expect(isPublicMediaKey("products/backup.sql")).toBe(false);
    expect(isPublicMediaKey("products/sin-extension")).toBe(false);
    expect(isPublicMediaKey("products/foto.jpg.exe")).toBe(false);
  });

  it("rechaza caracteres raros y claves vacías o demasiado largas", () => {
    expect(isPublicMediaKey("")).toBe(false);
    expect(isPublicMediaKey("products/foto con espacios.jpg")).toBe(false);
    expect(isPublicMediaKey("products/foto?x=1.jpg")).toBe(false);
    expect(isPublicMediaKey("products/foto#frag.jpg")).toBe(false);
    expect(isPublicMediaKey("products/foto:foto.jpg")).toBe(false);
    expect(isPublicMediaKey(`products/${"a".repeat(250)}.jpg`)).toBe(false);
  });
});
