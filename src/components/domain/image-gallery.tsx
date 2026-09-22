"use client";

import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Galería de imágenes del producto.
 *
 * Accesibilidad y rendimiento:
 * - La imagen grande usa `next/image` con `sizes` y `priority` solo en la primera (suele ser el LCP).
 * - Se cambia de imagen con el teclado: cada miniatura es un botón (se recorre con Tab) y además las flechas
 *   ← → cambian la imagen activa. El cambio se anuncia con `aria-live`, sin mover el foco.
 * - El texto alternativo es obligatorio (viene del backend).
 *
 * Estados: normal · miniatura activa · hover · foco · sin imágenes (producto nuevo) · error de carga ·
 * cargando (esqueleto).
 */

export interface GalleryImage {
  src: string;
  alt: string;
}

export interface ImageGalleryLabels {
  /** Nombre accesible del botón «imagen anterior». */
  previous: string;
  /** Nombre accesible del botón «imagen siguiente». */
  next: string;
  /** Prefijo del nombre de cada miniatura; se le añade el número. */
  thumbnail: string;
  /** Texto del estado «sin imágenes». */
  noImage: string;
  /** Texto del estado de error de carga. */
  loadError: string;
}

export interface ImageGalleryProps {
  images: GalleryImage[];
  labels: ImageGalleryLabels;
  className?: string;
}

export function ImageGallery({ images, labels, className }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedIndexes, setFailedIndexes] = useState<number[]>([]);

  const goTo = useCallback(
    (index: number) => {
      if (images.length === 0) {
        return;
      }
      // Se mueve en ciclo para que las flechas nunca choquen con un extremo.
      setActiveIndex((index + images.length) % images.length);
    },
    [images.length],
  );

  if (images.length === 0) {
    return (
      <div
        className={cn(
          "flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted text-muted-foreground",
          className,
        )}
      >
        <ImageOff aria-hidden className="size-8" />
        <p className="text-sm">{labels.noImage}</p>
      </div>
    );
  }

  const activeImage = images[activeIndex];
  const hasFailed = failedIndexes.includes(activeIndex);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted">
        {activeImage !== undefined && !hasFailed ? (
          <Image
            key={activeImage.src}
            src={activeImage.src}
            alt={activeImage.alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={activeIndex === 0}
            className="object-contain"
            onError={() => {
              setFailedIndexes((previous) => [...previous, activeIndex]);
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff aria-hidden className="size-8" />
            <p className="text-sm">{labels.loadError}</p>
          </div>
        )}

        {images.length > 1 ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label={labels.previous}
              onClick={() => {
                goTo(activeIndex - 1);
              }}
              className="absolute top-1/2 left-2 -translate-y-1/2"
            >
              <ChevronLeft aria-hidden className="size-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label={labels.next}
              onClick={() => {
                goTo(activeIndex + 1);
              }}
              className="absolute top-1/2 right-2 -translate-y-1/2"
            >
              <ChevronRight aria-hidden className="size-4" />
            </Button>
          </>
        ) : null}

        <p role="status" aria-live="polite" className="sr-only">
          {`${labels.thumbnail} ${activeIndex + 1} / ${images.length}`}
        </p>
      </div>

      {images.length > 1 ? (
        <ul
          className="flex gap-2 overflow-x-auto pb-1"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              goTo(activeIndex + 1);
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              goTo(activeIndex - 1);
            }
          }}
        >
          {images.map((image, index) => (
            <li key={image.src}>
              <button
                type="button"
                aria-current={index === activeIndex}
                aria-label={`${labels.thumbnail} ${index + 1}`}
                onClick={() => {
                  goTo(index);
                }}
                className={cn(
                  "relative size-16 shrink-0 overflow-hidden rounded-lg border bg-muted",
                  index === activeIndex
                    ? "border-brand-text ring-2 ring-brand/40"
                    : "border-border hover:border-input",
                )}
              >
                <Image src={image.src} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Estado "cargando" de la galería. */
export function ImageGallerySkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="size-16 rounded-lg" />
        <Skeleton className="size-16 rounded-lg" />
        <Skeleton className="size-16 rounded-lg" />
      </div>
    </div>
  );
}
