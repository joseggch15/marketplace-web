/**
 * Serialización de datos estructurados (JSON-LD).
 *
 * Por qué no basta `JSON.stringify`: el resultado se inserta en la página dentro de un `<script>` con
 * `dangerouslySetInnerHTML`, y una cadena que contenga `</script>` cerraría la etiqueta y permitiría inyectar
 * HTML. Aquí parte de los datos los escribe un vendedor (el título y la descripción de su producto), así que
 * hay que escapar los caracteres peligrosos.
 *
 * `\u003c` es JSON perfectamente válido y significa exactamente lo mismo: Google lee el mismo dato.
 */
export function serializeJsonLd(value: unknown): string {
  const json = JSON.stringify(value ?? null);

  return (
    json
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026")
      // Separadores de línea de Unicode: rompen el script en algunos analizadores.
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029")
  );
}
