import { describe, expect, it } from "vitest";

import { declaredImageExtension, isImageContentType, isPublicMediaKey } from "@/lib/media/keys";

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

  it("acepta el formato sin punto que genera hoy el backend (products/<32 hex>png)", () => {
    expect(isPublicMediaKey("products/32fea407815043478c76ab412cbd2b49png")).toBe(true);
    expect(isPublicMediaKey("products/d52d65bd5a51404aa0d9c47866e54cf1jpg")).toBe(true);
    expect(isPublicMediaKey("stores/9c1f4a2b7d8e0f1a2b3c4d5e6f708192webp")).toBe(true);
  });

  it("con extensión pegada sigue rechazando prefijos privados y nombres con truco", () => {
    expect(isPublicMediaKey("verification/32fea407815043478c76ab412cbd2b49png")).toBe(false);
    expect(isPublicMediaKey("invoices/factura001png")).toBe(false);
    expect(isPublicMediaKey("products/backup.sql")).toBe(false);
    expect(isPublicMediaKey("products/../32fea407815043478c76ab412cbd2b49png")).toBe(false);
    expect(isPublicMediaKey("products/subcarpeta/foto.png")).toBe(false);
  });

  it("un nombre que solo termina en 'png' pasa el filtro de nombre (a propósito)", () => {
    // La comprobación por nombre no puede saber qué contiene el archivo: por eso NO es la barrera de
    // seguridad. Quien decide es el Content-Type real (`isImageContentType`) dentro de la ruta.
    expect(isPublicMediaKey("products/backup_sqlpng")).toBe(true);
  });

  it("la extensión pegada solo cuenta si es de la lista blanca", () => {
    expect(declaredImageExtension("abc123png")).toBe("png");
    expect(declaredImageExtension("abc123.JPG")).toBe("jpg");
    expect(declaredImageExtension("abc123.pdf")).toBeNull();
    expect(declaredImageExtension("abc123")).toBeNull();
  });
});

/**
 * Regla que sustituye a exigir extensión en el nombre: **el tipo real manda**.
 *
 * Si el almacenamiento dice que el archivo no es una imagen, la ruta responde 404 aunque la clave parezca
 * válida. Es lo que impide usar el proxy de imágenes para descargar cualquier otro archivo del bucket.
 */
describe("isImageContentType", () => {
  it("acepta la lista exacta de formatos de imagen", () => {
    expect(isImageContentType("image/jpeg")).toBe(true);
    expect(isImageContentType("image/png")).toBe(true);
    expect(isImageContentType("image/webp")).toBe(true);
    expect(isImageContentType("image/avif")).toBe(true);
    expect(isImageContentType("image/gif")).toBe(true);
  });

  it("normaliza mayúsculas, parámetros y espacios antes de comparar", () => {
    expect(isImageContentType("IMAGE/PNG; charset=binary")).toBe(true);
    expect(isImageContentType("image/png ")).toBe(true);
    expect(isImageContentType("  image/WebP  ")).toBe(true);
  });

  it("rechaza SVG, que puede llevar JavaScript dentro (404)", () => {
    // El caso importante: `image/svg+xml` empieza por `image/` pero NO es una imagen inofensiva. Servido
    // desde nuestro dominio, un SVG con script se ejecutaría con el origen de la tienda.
    expect(isImageContentType("image/svg+xml")).toBe(false);
    expect(isImageContentType("IMAGE/SVG+XML")).toBe(false);
    expect(isImageContentType("image/svg+xml; charset=utf-8")).toBe(false);
  });

  it("rechaza cualquier otro tipo y los valores vacíos (la ruta responde 404)", () => {
    expect(isImageContentType("application/pdf")).toBe(false);
    expect(isImageContentType("text/html")).toBe(false);
    expect(isImageContentType("application/json")).toBe(false);
    expect(isImageContentType("application/octet-stream")).toBe(false);
    expect(isImageContentType("image/bmp")).toBe(false);
    expect(isImageContentType("image/tiff")).toBe(false);
    expect(isImageContentType("")).toBe(false);
    expect(isImageContentType(null)).toBe(false);
    expect(isImageContentType(undefined)).toBe(false);
  });
});
