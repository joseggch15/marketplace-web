import { ChevronRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Migas de pan (componente de presentación).
 *
 * Accesibilidad: es un `<nav>` con nombre propio y dentro una lista ordenada, que es la forma canónica de
 * representar una ruta de navegación. El último nivel **no** es un enlace (ya estás ahí) y lleva
 * `aria-current="page"`; el separador es decorativo (`aria-hidden`) porque no aporta información.
 *
 * Estados: normal · hover · foco en los enlaces intermedios · último nivel (página actual, sin enlace).
 */

export type BreadcrumbItem = {
  label: string;
  /** Sin destino = nivel actual (o un nivel que no tiene página propia). */
  href?: string;
};

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Nombre accesible de la navegación, ya traducido («Ruta de navegación»). */
  label: string;
  className?: string;
}

export function Breadcrumbs({ items, label, className }: BreadcrumbsProps) {
  return (
    <nav aria-label={label} className={cn("w-full", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-x-2">
              {index > 0 ? <ChevronRight aria-hidden className="size-4 shrink-0" /> : null}

              {item.href === undefined || isLast ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn("truncate", isLast && "font-medium text-foreground")}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="truncate underline-offset-2 hover:text-foreground hover:underline"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
