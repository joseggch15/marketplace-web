import { describe, expect, it } from "vitest";

import {
  isProductId,
  isProductRef,
  isProductSlug,
  parseReviewsCursor,
  reviewsHref,
  REVIEWS_CURSOR_PARAM,
} from "./params";

/**
 * Pruebas de los parámetros de la ficha de producto.
 *
 * Un fallo aquí es silencioso: la página parecería funcionar llamando al backend con basura o señalando a un
 * `canonical` equivocado, que es justo lo que estos filtros evitan.
 */

describe("isProductId", () => {
  it("acepta un UUID en cualquier combinación de mayúsculas y minúsculas", () => {
    expect(isProductId("11111111-1111-1111-1111-111111111111")).toBe(true);
    expect(isProductId("A1B2C3D4-1111-2222-3333-444455556666")).toBe(true);
  });

  it("rechaza lo que no es un identificador", () => {
    expect(isProductId("hola")).toBe(false);
    expect(isProductId("11111111-1111-1111-1111-11111111111")).toBe(false);
    expect(isProductId("11111111111111111111111111111111")).toBe(false);
    expect(isProductId("")).toBe(false);
    expect(isProductId("11111111-1111-1111-1111-11111111111z")).toBe(false);
  });
});

describe("isProductSlug", () => {
  it("acepta el slug que genera el backend a partir del título", () => {
    expect(isProductSlug("balon-de-futbol-profesional-no5")).toBe(true);
    expect(isProductSlug("mancuernas-ajustables-par-20-kg")).toBe(true);
    expect(isProductSlug("producto")).toBe(true);
  });

  it("rechaza lo que no es un slug (mayúsculas, espacios, barras o guiones sueltos)", () => {
    expect(isProductSlug("Producto")).toBe(false);
    expect(isProductSlug("con espacio")).toBe(false);
    expect(isProductSlug("con/barra")).toBe(false);
    expect(isProductSlug("-empieza-con-guion")).toBe(false);
    expect(isProductSlug("termina-con-guion-")).toBe(false);
    expect(isProductSlug("")).toBe(false);
    expect(isProductSlug("a".repeat(161))).toBe(false);
  });

  it("rechaza un intento de inyección en la ruta", () => {
    expect(isProductSlug("../../etc/passwd")).toBe(false);
    expect(isProductSlug("<script>")).toBe(false);
  });
});

describe("isProductRef", () => {
  it("deja pasar las dos formas de URL de la ficha (identificador y slug)", () => {
    expect(isProductRef("11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isProductRef("audifonos-inalambricos")).toBe(true);
  });

  it("deja fuera cualquier otra cosa", () => {
    expect(isProductRef("hola")).toBe(true);
    expect(isProductRef("HOLA")).toBe(false);
    expect(isProductRef("")).toBe(false);
  });
});

describe("parseReviewsCursor", () => {
  it("acepta un cursor con el formato del backend", () => {
    expect(parseReviewsCursor({ [REVIEWS_CURSOR_PARAM]: "MjAyNi0wOS0yMlQxMDowMDowMA==" })).toBe(
      "MjAyNi0wOS0yMlQxMDowMDowMA==",
    );
  });

  it("toma el primer valor si el parámetro llega repetido", () => {
    expect(parseReviewsCursor({ [REVIEWS_CURSOR_PARAM]: ["abc123", "otro"] })).toBe("abc123");
  });

  it("descarta cursores con caracteres raros, vacíos o demasiado largos", () => {
    expect(parseReviewsCursor({ [REVIEWS_CURSOR_PARAM]: "con espacios" })).toBeNull();
    expect(parseReviewsCursor({ [REVIEWS_CURSOR_PARAM]: "<?php" })).toBeNull();
    expect(parseReviewsCursor({ [REVIEWS_CURSOR_PARAM]: "   " })).toBeNull();
    expect(parseReviewsCursor({ [REVIEWS_CURSOR_PARAM]: "a".repeat(600) })).toBeNull();
    expect(parseReviewsCursor({})).toBeNull();
  });
});

describe("reviewsHref", () => {
  it("devuelve la ruta limpia cuando no hay cursor (es la que se indexa)", () => {
    expect(reviewsHref("/p/1111", null)).toBe("/p/1111");
  });

  it("añade el cursor codificado", () => {
    expect(reviewsHref("/p/1111", "abc=123")).toBe(`/p/1111?${REVIEWS_CURSOR_PARAM}=abc%3D123`);
  });
});
