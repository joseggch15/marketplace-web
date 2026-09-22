import { notFound } from "next/navigation";

/**
 * Ruta comodín dentro de cada idioma.
 *
 * Sin este archivo, una URL como `/es/no-existe` no encontraría la página 404 personalizada. Al llamar a
 * `notFound()`, Next.js renderiza `not-found.tsx` con el idioma ya aplicado.
 */
export default function CatchAllPage() {
  notFound();
}
