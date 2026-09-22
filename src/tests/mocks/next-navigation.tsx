import type { AnchorHTMLAttributes, ReactNode } from "react";

/**
 * Doble de prueba de `next/navigation` y `next/link` (se sustituye por alias en `vitest.config.ts`).
 *
 * Motivo: `next-intl` y nuestros componentes usan el router de Next.js, que no existe en jsdom. Con este
 * doble se puede probar el comportamiento (nombres accesibles, teclado, enlaces) sin montar el framework.
 */

export function usePathname(): string {
  return "/";
}

export function useParams(): Record<string, string> {
  return { locale: "es" };
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams();
}

export function useRouter(): {
  push: (href: string) => void;
  replace: (href: string) => void;
  prefetch: (href: string) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
} {
  return {
    push: () => {},
    replace: () => {},
    prefetch: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
  };
}

export function redirect(): void {}
export function permanentRedirect(): void {}
export function notFound(): void {}

/** Enlace simplificado: un `<a>` normal, para poder comprobar `href` y el texto. */
export default function Link({
  href,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }): ReactNode {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
