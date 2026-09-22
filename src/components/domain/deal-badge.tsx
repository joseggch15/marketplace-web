import { Ban, BadgeCheck, Tag, TrendingUp, Truck } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Insignias del dominio (envío gratis, oferta, más vendido, tienda oficial, agotado).
 *
 * **Decisiones de producto importantes:**
 * - No existe ninguna insignia de urgencia ni de escasez inventada (nada de «¡quedan 2!» ni contadores).
 *   Si algún día se muestra el stock, será **el stock real** que devuelve el backend.
 * - El significado nunca depende solo del color: cada insignia lleva icono + texto.
 *
 * Las insignias no son interactivas, así que su único estado es el normal.
 */

export type DealBadgeKind = "free-shipping" | "deal" | "best-seller" | "official" | "out-of-stock";

export interface DealBadgeProps {
  kind: DealBadgeKind;
  /** Texto ya traducido (la insignia no conoce el idioma por sí sola). */
  label: string;
  className?: string;
}

const BADGE_STYLES: Record<DealBadgeKind, { className: string; icon: typeof Truck }> = {
  "free-shipping": { className: "bg-success-surface text-success-text", icon: Truck },
  deal: { className: "bg-brand-surface text-brand-text", icon: Tag },
  "best-seller": { className: "bg-warning-surface text-warning-text", icon: TrendingUp },
  official: { className: "bg-info-surface text-info-text", icon: BadgeCheck },
  "out-of-stock": { className: "bg-danger-surface text-danger-text", icon: Ban },
};

export function DealBadge({ kind, label, className }: DealBadgeProps) {
  const { className: tone, icon: Icon } = BADGE_STYLES[kind];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {label}
    </span>
  );
}
