/**
 * Doble de prueba de `next/image` (se sustituye por alias en `vitest.config.ts`).
 *
 * En jsdom no existe el optimizador de imágenes de Next.js. Aquí lo importante es comprobar que el
 * componente pasa el texto alternativo y las clases; el resto (tamaños, formato, carga diferida) lo
 * verifica el navegador real en las pruebas end-to-end.
 */

export interface MockImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  onError?: () => void;
}

export default function MockImage({ src, alt, className }: MockImageProps) {
  // Se usa `<img>` a propósito: es un doble de prueba, no una imagen real de la aplicación.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />;
}
