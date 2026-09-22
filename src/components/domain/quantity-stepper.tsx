"use client";

import { Minus, Plus } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Selector de cantidad.
 *
 * Los límites **no se inventan**: vienen del backend (mínimo de compra y stock real disponible). El
 * componente nunca ofrece comprar más de lo que hay.
 *
 * Estados: normal · hover · foco · deshabilitado (sin stock o sin permiso) · cargando (mientras el servidor
 * confirma, para evitar dobles clics) · error (mensaje claro con el límite que se superó).
 */

export interface QuantityStepperLabels {
  /** Nombre accesible del campo («Cantidad»). */
  quantity: string;
  /** Nombre accesible del botón de restar. */
  decrement: string;
  /** Nombre accesible del botón de sumar. */
  increment: string;
  /** Mensaje ya traducido e interpolado con el máximo real, p. ej. «Solo hay 5 disponibles». */
  maxMessage: string;
  /** Mensaje ya traducido e interpolado con el mínimo, p. ej. «El mínimo es 1». */
  minMessage: string;
}

export interface QuantityStepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  labels: QuantityStepperLabels;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function QuantityStepper({
  value,
  min,
  max,
  onChange,
  labels,
  disabled = false,
  loading = false,
  className,
}: QuantityStepperProps) {
  const inputId = useId();
  const [errorKey, setErrorKey] = useState<"max" | "min" | null>(null);

  const blocked = disabled || loading;
  const canDecrease = !blocked && value > min;
  const canIncrease = !blocked && value < max;
  const errorMessage =
    errorKey === "max" ? labels.maxMessage : errorKey === "min" ? labels.minMessage : null;

  /** Ajusta el valor dentro de los límites y avisa si el usuario se pasó. */
  function commit(next: number) {
    if (!Number.isFinite(next)) {
      return;
    }

    if (next > max) {
      setErrorKey("max");
      onChange(max);
      return;
    }

    if (next < min) {
      setErrorKey("min");
      onChange(min);
      return;
    }

    setErrorKey(null);
    onChange(next);
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={inputId} className="sr-only">
        {labels.quantity}
      </label>

      <div className="inline-flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={!canDecrease}
          aria-label={labels.decrement}
          onClick={() => {
            commit(value - 1);
          }}
        >
          <Minus aria-hidden className="size-4" />
        </Button>

        <Input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          value={value}
          disabled={blocked}
          aria-invalid={errorMessage !== null}
          aria-describedby={errorMessage !== null ? `${inputId}-error` : undefined}
          onChange={(event) => {
            commit(Number.parseInt(event.target.value, 10));
          }}
          className="h-8 w-16 text-center"
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={!canIncrease}
          aria-label={labels.increment}
          onClick={() => {
            commit(value + 1);
          }}
        >
          <Plus aria-hidden className="size-4" />
        </Button>

        {loading ? (
          <span role="status" className="text-xs text-muted-foreground">
            …
          </span>
        ) : null}
      </div>

      {errorMessage !== null ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-danger-text">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
