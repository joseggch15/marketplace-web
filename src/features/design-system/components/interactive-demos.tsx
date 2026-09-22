"use client";

import { useState } from "react";

import { ImageGallery } from "@/components/domain/image-gallery";
import { QuantityStepper } from "@/components/domain/quantity-stepper";
import { VariantSelector, type VariantOption } from "@/components/domain/variant-selector";

/**
 * Demos interactivas de la página `/design-system`.
 *
 * La página es un Server Component (no necesita JavaScript para verse), así que las tres piezas que sí
 * tienen estado (variantes, cantidad y galería) viven aquí, en el único componente cliente de la página.
 * Los textos llegan como props ya traducidos: así el navegador recibe solo lo que necesita (menos peso).
 */

/* -------------------------------------------------------------------------- */
/* Selector de variantes                                                       */
/* -------------------------------------------------------------------------- */

export interface VariantDemoLabels {
  colorGroup: string;
  sizeGroup: string;
  unavailable: string;
  colorBlack: string;
  colorIvory: string;
  sizeSmall: string;
  sizeMedium: string;
  sizeLarge: string;
  errorMessage: string;
}

export function VariantDemo({ labels }: { labels: VariantDemoLabels }) {
  const [color, setColor] = useState<string | null>("black");
  const [size, setSize] = useState<string | null>("m");

  const colors: VariantOption[] = [
    { value: "black", label: labels.colorBlack, swatch: "#1f2933", available: true },
    { value: "ivory", label: labels.colorIvory, swatch: "#f4efe6", available: true },
  ];

  const sizes: VariantOption[] = [
    { value: "s", label: labels.sizeSmall, available: false },
    { value: "m", label: labels.sizeMedium, available: true },
    { value: "l", label: labels.sizeLarge, available: true },
  ];

  return (
    <div className="flex flex-col gap-5">
      <VariantSelector
        groupLabel={labels.colorGroup}
        options={colors}
        value={color}
        onChange={setColor}
        labels={{ unavailable: labels.unavailable }}
      />
      <VariantSelector
        groupLabel={labels.sizeGroup}
        options={sizes}
        value={size}
        onChange={setSize}
        labels={{ unavailable: labels.unavailable }}
      />
      {/* Estado de error del componente */}
      <VariantSelector
        groupLabel={`${labels.colorGroup} (${labels.errorMessage})`}
        options={[{ value: "black", label: labels.colorBlack, available: true }]}
        value={null}
        onChange={() => {}}
        labels={{ unavailable: labels.unavailable }}
        errorMessage={labels.errorMessage}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Selector de cantidad                                                        */
/* -------------------------------------------------------------------------- */

export interface QuantityDemoLabels {
  quantity: string;
  decrement: string;
  increment: string;
  maxMessage: string;
  minMessage: string;
}

export function QuantityDemo({ labels }: { labels: QuantityDemoLabels }) {
  const [value, setValue] = useState(1);

  return (
    <div className="flex flex-col gap-6">
      <QuantityStepper value={value} min={1} max={5} onChange={setValue} labels={labels} />
      {/* Estado deshabilitado (sin stock) */}
      <QuantityStepper value={1} min={1} max={1} onChange={() => {}} labels={labels} disabled />
      {/* Estado cargando (mientras el servidor confirma el cambio) */}
      <QuantityStepper value={2} min={1} max={5} onChange={() => {}} labels={labels} loading />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Galería de imágenes                                                         */
/* -------------------------------------------------------------------------- */

export interface GalleryDemoLabels {
  previous: string;
  next: string;
  thumbnail: string;
  noImage: string;
  loadError: string;
  alt: string;
}

export function GalleryDemo({ labels }: { labels: GalleryDemoLabels }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <ImageGallery
        images={[
          { src: "/demo/product-1.png", alt: `${labels.alt} 1` },
          { src: "/demo/product-2.png", alt: `${labels.alt} 2` },
          { src: "/demo/product-3.png", alt: `${labels.alt} 3` },
        ]}
        labels={labels}
      />
      {/* Estado vacío: el producto todavía no tiene fotos */}
      <ImageGallery images={[]} labels={labels} />
    </div>
  );
}
