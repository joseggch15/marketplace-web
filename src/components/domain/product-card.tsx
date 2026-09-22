import { ImageOff } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de producto (presentación).
 *
 * Composición por "huecos" (`price`, `rating`, `badges`): así la tarjeta no conoce el idioma ni el formato
 * de moneda y se puede reutilizar en el catálogo (F3), en favoritos y en el panel del vendedor.
 *
 * Estados cubiertos:
 * - **normal**, **hover** y **foco**: el conjunto es un enlace con anillo de foco visible y la imagen hace
 *   un zoom muy leve (respetando `prefers-reduced-motion`).
 * - **agotado**: velo sobre la imagen + insignia (texto traducido).
 * - **error / sin imagen**: si no hay imagen (o falla la carga, que en `next/image` cae al `alt`), se
 *   muestra un marcador con el texto «sin imagen» para que la tarjeta nunca quede vacía.
 * - **cargando**: `ProductCardSkeleton`, con la misma forma para que la grilla no salte.
 *
 * Accesibilidad: la tarjeta completa es **un solo enlace** (no un enlace por cada texto), el título es el
 * texto del enlace y la imagen tiene texto alternativo obligatorio.
 */

export interface ProductCardProps {
  href: string;
  title: string;
  /** Imagen principal. `null` = el producto no tiene imágenes todavía. */
  image: { src: string; alt: string } | null;
  /** Texto traducido para el marcador de "sin imagen". */
  noImageLabel: string;
  /** Normalmente `<Price />`. */
  price: ReactNode;
  /** Normalmente `<RatingStars />`. */
  rating?: ReactNode;
  /** Insignias (`<DealBadge />`) que se muestran sobre la imagen. */
  badges?: ReactNode;
  /** Acciones de la tarjeta (p. ej. favoritos). No debe contener enlaces anidados. */
  actions?: ReactNode;
  outOfStock?: boolean;
  /** Texto traducido de "agotado" (obligatorio si `outOfStock`). */
  outOfStockLabel?: string;
  className?: string;
}

export function ProductCard({
  href,
  title,
  image,
  noImageLabel,
  price,
  rating,
  badges,
  actions,
  outOfStock = false,
  outOfStockLabel,
  className,
}: ProductCardProps) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow focus-within:shadow-popover focus-within:ring-2 focus-within:ring-ring hover:shadow-popover",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {image !== null ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            // La grilla del catálogo muestra 2 columnas en celular y 4 en escritorio.
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100",
              outOfStock && "opacity-50",
            )}
          />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff aria-hidden className="size-6" />
            <span className="text-xs">{noImageLabel}</span>
          </span>
        )}

        {badges !== null && badges !== undefined ? (
          <span className="absolute top-2 left-2 flex max-w-[85%] flex-wrap gap-1">{badges}</span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="font-heading text-sm leading-snug font-medium">
          {/* El enlace cubre toda la tarjeta para que sea un objetivo grande y fácil de tocar. */}
          <Link href={href} className="after:absolute after:inset-0">
            {title}
          </Link>
        </h3>

        {rating !== undefined ? rating : null}
        {price}

        {outOfStock && outOfStockLabel !== undefined ? (
          <p className="text-xs font-medium text-danger-text">{outOfStockLabel}</p>
        ) : null}

        {actions !== undefined ? (
          <div className="relative z-10 mt-auto flex items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </article>
  );
}

/** Estado "cargando": misma silueta que la tarjeta final. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-28" />
      </div>
    </div>
  );
}
