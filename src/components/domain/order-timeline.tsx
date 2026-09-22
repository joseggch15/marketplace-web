import { Check, CircleAlert, CircleDot, Circle } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format/date";
import { cn } from "@/lib/utils";

/**
 * Línea de tiempo del pedido (presentación, sin estado propio).
 *
 * Refleja los **estados reales** que devuelve el backend (`pending`, `paid`, `processing`, `shipped`,
 * `delivered`, `cancelled`), con la fecha de cada evento. No hay pasos prometidos de más: si el backend no
 * informa una fecha, se muestra el texto de «pendiente de confirmar».
 *
 * Accesibilidad: lista ordenada con iconos **y** texto; el estado no depende del color.
 *
 * Estados: completado · actual · próximo · fallido/cancelado · cargando (esqueleto) · error.
 */

export type OrderTimelineState = "done" | "current" | "upcoming" | "failed";

export interface OrderTimelineItem {
  id: string;
  /** Etiqueta del evento, ya traducida. */
  label: string;
  /** Fecha ISO del evento (opcional). */
  date?: string | null;
}

export interface OrderTimelineProps {
  items: OrderTimelineItem[];
  /** Estado de cada elemento, en el mismo orden que `items`. */
  states: OrderTimelineState[];
  /** Idioma y zona horaria para formatear las fechas. */
  locale: string;
  timeZone?: string;
  /** Texto para los eventos sin fecha confirmada. */
  pendingDateLabel: string;
  /** Mensaje de error ya traducido (si no se pudieron cargar los eventos). */
  errorMessage?: string;
  className?: string;
}

const MARKER_STYLES: Record<OrderTimelineState, { className: string; Icon: typeof Check }> = {
  done: { className: "border-success bg-success text-primary-foreground", Icon: Check },
  current: { className: "border-brand bg-brand-surface text-brand-text", Icon: CircleDot },
  upcoming: { className: "border-border bg-muted text-muted-foreground", Icon: Circle },
  failed: { className: "border-destructive bg-danger-surface text-danger-text", Icon: CircleAlert },
};

export function OrderTimeline({
  items,
  states,
  locale,
  timeZone,
  pendingDateLabel,
  errorMessage,
  className,
}: OrderTimelineProps) {
  if (errorMessage !== undefined) {
    return (
      <p role="alert" className={cn("text-sm text-danger-text", className)}>
        {errorMessage}
      </p>
    );
  }

  return (
    <ol className={cn("flex flex-col", className)}>
      {items.map((item, index) => {
        const state = states[index] ?? "upcoming";
        const { className: markerTone, Icon } = MARKER_STYLES[state];
        const formattedDate = formatDateTime(item.date, locale, timeZone);
        const isLast = index === items.length - 1;

        return (
          <li key={item.id} className="relative flex gap-3 pb-6 last:pb-0">
            {/* Línea que une los eventos (decorativa). */}
            {!isLast ? (
              <span aria-hidden className="absolute top-6 left-[11px] h-full w-px bg-border" />
            ) : null}

            <span
              aria-hidden
              className={cn(
                "relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border",
                markerTone,
              )}
            >
              <Icon className="size-3.5" />
            </span>

            <span className="flex flex-col">
              <span
                className={cn(
                  "text-sm",
                  state === "current" ? "font-semibold text-foreground" : "text-foreground",
                  state === "upcoming" && "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {formattedDate ?? pendingDateLabel}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Estado "cargando" de la línea de tiempo. */
export function OrderTimelineSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex gap-3">
          <Skeleton className="size-6 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
