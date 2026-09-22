import { describe, expect, it } from "vitest";

import { sellerErrorKey } from "./error-codes";

/**
 * Pruebas de la traducción de códigos de error.
 *
 * Lo que se protege: que un código conocido se traduzca (el vendedor lee qué pasó), que uno **desconocido no se
 * disfrace** de un error conocido y que una petición que no llegó a responder se cuente como problema de red.
 */
describe("sellerErrorKey", () => {
  it("traduce los códigos que el backend usa de verdad", () => {
    expect(sellerErrorKey("store_not_approved")).toBe("store_not_approved");
    expect(sellerErrorKey("sku_already_exists")).toBe("sku_already_exists");
    expect(sellerErrorKey("insufficient_stock")).toBe("insufficient_stock");
    expect(sellerErrorKey("invalid_status_transition")).toBe("invalid_status_transition");
  });

  it("marca como desconocido un código nuevo del backend", () => {
    expect(sellerErrorKey("codigo_que_no_existe")).toBe("unknown");
    expect(sellerErrorKey("")).toBe("unknown");
  });

  it("cuenta como problema de red la petición sin respuesta", () => {
    expect(sellerErrorKey(null)).toBe("network_error");
    expect(sellerErrorKey(undefined)).toBe("network_error");
  });
});
