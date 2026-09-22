import { describe, expect, it } from "vitest";

import { cartErrorMessageKey } from "./error-codes";

/**
 * Pruebas de la traducción de errores del carrito.
 *
 * La regla del proyecto: el mensaje sale del campo `code` **estable** de la API, nunca del texto en inglés ni
 * de una suposición. Un código desconocido cae en `unknown` para no enseñar nunca un código crudo al usuario.
 */

describe("errores del carrito", () => {
  it("reconoce los códigos que puede devolver la API", () => {
    expect(cartErrorMessageKey("insufficient_stock")).toBe("insufficient_stock");
    expect(cartErrorMessageKey("variant_not_found")).toBe("variant_not_found");
    expect(cartErrorMessageKey("cart_item_not_found")).toBe("cart_item_not_found");
    expect(cartErrorMessageKey("quantity_limit_exceeded")).toBe("quantity_limit_exceeded");
    expect(cartErrorMessageKey("cart_token_required")).toBe("cart_token_required");
    expect(cartErrorMessageKey("too_many_requests")).toBe("too_many_requests");
  });

  it("reconoce el fallo de red que produce nuestro propio cliente", () => {
    expect(cartErrorMessageKey("network_error")).toBe("network_error");
  });

  it("cae en `unknown` con códigos desconocidos o valores que no son texto", () => {
    expect(cartErrorMessageKey("algo_que_no_existe")).toBe("unknown");
    expect(cartErrorMessageKey(undefined)).toBe("unknown");
    expect(cartErrorMessageKey(null)).toBe("unknown");
    expect(cartErrorMessageKey(42)).toBe("unknown");
    expect(cartErrorMessageKey({ code: "not_found" })).toBe("unknown");
  });
});
