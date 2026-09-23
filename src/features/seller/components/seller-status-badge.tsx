import { cn } from "@/lib/utils";

import { sellerTone, type SellerTone } from "../status";

/**
 * Insignia de estado del panel del vendedor (presentación, sin estado propio).
 *
 * El significado nunca depende del color: cada insignia lleva **texto traducido** y el tono sale de los tokens
 * del tema. Se usa para el estado de la tienda, de un producto y de un envío, que son los tres estados que
 * maneja el panel.
 */

const TONES: Record<SellerTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-info-surface text-info-text",
  success: "bg-success-surface text-success-text",
  warning: "bg-warning-surface text-warning-text",
  danger: "bg-danger-surface text-danger-text",
};

export function SellerStatusBadge({
  status,
  label,
  className,
}: {
  /** Código tal como lo devuelve la API (`draft`, `approved`, `ready`…). */
  status: string;
  /** Etiqueta ya traducida. */
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        TONES[sellerTone(status)],
        className,
      )}
    >
      {label}
    </span>
  );
}
