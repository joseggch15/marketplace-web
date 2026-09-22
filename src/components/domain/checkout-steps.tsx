import { Check } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Pasos del checkout (presentación, sin estado propio).
 *
 * El pedido se completa en pocos pasos, así que la barra siempre está a la vista: el usuario sabe dónde
 * está y cuánto le falta (principio de «comprar con el menor número de pasos posible»).
 *
 * Accesibilidad: es una lista ordenada; el paso actual lleva `aria-current="step"` y los ya completados se
 * marcan con icono **y texto** para lectores de pantalla (no solo con color).
 *
 * Estados: completado · actual · pendiente · cargando (esqueleto).
 */

export interface CheckoutStep {
  id: string;
  label: string;
}

export interface CheckoutStepsProps {
  steps: CheckoutStep[];
  /** Índice del paso actual (empezando en 0). */
  currentIndex: number;
  /** Texto traducido que se anuncia en los pasos ya completados. */
  completedLabel: string;
  /** Texto traducido que se anuncia en el paso actual. */
  currentLabel: string;
  className?: string;
}

export function CheckoutSteps({
  steps,
  currentIndex,
  completedLabel,
  currentLabel,
  className,
}: CheckoutStepsProps) {
  return (
    <nav aria-label={currentLabel} className={className}>
      <ol className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li
              key={step.id}
              aria-current={isCurrent ? "step" : undefined}
              className="flex items-center gap-2"
            >
              <span
                aria-hidden
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                  isCompleted && "border-success-strong bg-success-strong text-success-on-strong",
                  isCurrent && "border-brand bg-brand-surface text-brand-text",
                  !isCompleted && !isCurrent && "border-border bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? <Check className="size-3.5" /> : index + 1}
              </span>

              <span
                className={cn(
                  "text-sm",
                  isCurrent ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>

              {/* Texto solo para lectores de pantalla: el estado no depende del color. */}
              <span className="sr-only">{isCompleted ? completedLabel : currentLabel}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Estado "cargando" de los pasos. */
export function CheckoutStepsSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Skeleton className="h-6 w-32 rounded-full" />
      <Skeleton className="h-6 w-28 rounded-full" />
      <Skeleton className="h-6 w-36 rounded-full" />
    </div>
  );
}
