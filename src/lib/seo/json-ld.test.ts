import { describe, expect, it } from "vitest";

import { serializeJsonLd } from "./json-ld";

/**
 * Pruebas de la serialización de JSON-LD.
 *
 * Es una regla de **seguridad**: el resultado se inserta dentro de una etiqueta `<script>`, y parte de los
 * datos los escribe un vendedor (el título de su producto). Si `</script>` sobreviviera, se podría inyectar
 * HTML en la página.
 */
describe("serializeJsonLd", () => {
  it("escapa los caracteres que romperían el script", () => {
    const serialized = serializeJsonLd({ name: "</script><script>alert(1)</script>" });

    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain(">");
    expect(serialized).toContain("\\u003c");
    // El JSON sigue siendo válido y con el mismo significado.
    expect(JSON.parse(serialized)).toEqual({ name: "</script><script>alert(1)</script>" });
  });

  it("escapa el ampersand y los separadores de línea de Unicode", () => {
    const serialized = serializeJsonLd({ text: "a & b\u2028c\u2029d" });

    expect(serialized).toContain("\\u0026");
    expect(serialized).not.toContain("\u2028");
    expect(JSON.parse(serialized).text).toBe("a & b\u2028c\u2029d");
  });

  it("no rompe con estructuras anidadas ni con valores nulos", () => {
    expect(JSON.parse(serializeJsonLd({ a: [1, "x", { b: null }] }))).toEqual({
      a: [1, "x", { b: null }],
    });
    expect(serializeJsonLd(undefined)).toBe("null");
  });
});
