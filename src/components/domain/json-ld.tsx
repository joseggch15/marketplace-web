import { serializeJsonLd } from "@/lib/seo/json-ld";

/**
 * Etiqueta `<script type="application/ld+json">` con los datos estructurados de la página.
 *
 * El contenido se serializa con `serializeJsonLd`, que escapa los caracteres peligrosos: parte de estos datos
 * los escribe un vendedor y `JSON.stringify` por sí solo permitiría cerrar el `<script>` con un `</script>`
 * dentro del título de un producto.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // El contenido es JSON ya escapado por `serializeJsonLd`, nunca HTML.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
