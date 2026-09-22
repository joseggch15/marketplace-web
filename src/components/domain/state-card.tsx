import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Tarjeta de estado reutilizable (presentación, sin estado propio).
 *
 * Existe para que **todos** los estados «vacío» y «error» del proyecto se vean igual: un título que dice qué
 * pasó, una explicación corta y, cuando se puede, **una acción** que resuelve la situación (nunca un callejón
 * sin salida). La usan la portada, Mis compras, el panel del vendedor y el de administración.
 *
 * Accesibilidad: es una `<section>` con título; cuando el estado es un error se marca como `alert` para que un
 * lector de pantalla lo anuncie en cuanto aparece.
 */

export interface StateCardProps {
  title: string;
  description?: string;
  /** Acción sugerida (normalmente un `<Button asChild>` con un enlace). */
  action?: ReactNode;
  tone?: "neutral" | "danger";
  className?: string;
}

export function StateCard({
  title,
  description,
  action,
  tone = "neutral",
  className,
}: StateCardProps) {
  return (
    <section
      role={tone === "danger" ? "alert" : undefined}
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl border p-6",
        tone === "danger" ? "border-destructive/40 bg-danger-surface/40" : "border-border",
        className,
      )}
    >
      <h2
        className={cn(
          "font-heading text-lg font-semibold",
          tone === "danger" && "text-danger-text",
        )}
      >
        {title}
      </h2>
      {description === undefined ? null : (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {action}
    </section>
  );
}
