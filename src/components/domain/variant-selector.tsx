"use client";

import { useId } from "react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Selector de variantes (color, talla, sabor…).
 *
 * Por qué un grupo de opciones (radio) y no botones sueltos: es el patrón accesible correcto para «elige
 * una de estas opciones». Se recorre con las flechas del teclado, se anuncia cuál está elegida y el foco
 * es visible. Las variantes **sin stock se deshabilitan** y se avisa con texto para lectores de pantalla.
 *
 * Estados: normal · hover · foco · seleccionada · deshabilitada (sin stock) · cargando (esqueleto) ·
 * error (cuando no se pudo saber la disponibilidad).
 */

export interface VariantOption {
  value: string;
  label: string;
  /** Color en formato CSS. Es un **dato** que viene del backend, no un token de diseño. */
  swatch?: string | null;
  /** `false` cuando no hay stock de esa variante. */
  available: boolean;
}

export interface VariantSelectorLabels {
  /** Aviso para lectores de pantalla cuando la variante no tiene stock. */
  unavailable: string;
}

export interface VariantSelectorProps {
  /** Título del grupo, ya traducido («Color», «Talla»…). */
  groupLabel: string;
  options: VariantOption[];
  value: string | null;
  onChange: (value: string) => void;
  labels: VariantSelectorLabels;
  /** Mensaje de error ya traducido (p. ej. no se pudo cargar la disponibilidad). */
  errorMessage?: string;
  className?: string;
}

export function VariantSelector({
  groupLabel,
  options,
  value,
  onChange,
  labels,
  errorMessage,
  className,
}: VariantSelectorProps) {
  const baseId = useId();

  return (
    <fieldset className={cn("flex flex-col gap-2", className)}>
      <legend className="text-sm font-medium text-foreground">{groupLabel}</legend>

      <RadioGroup value={value ?? ""} onValueChange={onChange} className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map((option) => {
          const optionId = `${baseId}-${option.value}`;

          return (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem
                id={optionId}
                value={option.value}
                disabled={!option.available}
                aria-describedby={option.available ? undefined : `${optionId}-unavailable`}
              />
              <label
                htmlFor={optionId}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  option.available ? "cursor-pointer" : "cursor-not-allowed text-muted-foreground",
                )}
              >
                {option.swatch !== null && option.swatch !== undefined ? (
                  <span
                    aria-hidden
                    style={{ backgroundColor: option.swatch }}
                    className="size-4 rounded-full border border-border"
                  />
                ) : null}
                {option.label}
                {!option.available ? (
                  <span id={`${optionId}-unavailable`} className="text-xs">
                    ({labels.unavailable})
                  </span>
                ) : null}
              </label>
            </div>
          );
        })}
      </RadioGroup>

      {errorMessage !== undefined ? (
        <p role="alert" className="text-xs text-danger-text">
          {errorMessage}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Estado "cargando" del selector: la silueta de las opciones. */
export function VariantSelectorSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-16" />
      <div className="flex gap-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}
