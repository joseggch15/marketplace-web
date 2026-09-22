import { CircleAlert, CircleCheck, Clock, PackageCheck, Truck, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

import { orderStatusKey, orderStatusTone, type OrderStatusKey, type StatusTone } from "../status";

/**
 * Insignia del estado de un pedido (presentación, sin estado propio).
 *
 * El significado **nunca depende del color**: cada estado lleva icono y texto traducido, así que se entiende
 * igual en escala de grises y con un lector de pantalla. Los tonos salen de los tokens del tema.
 */

const TONES: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-info-surface text-info-text",
  success: "bg-success-surface text-success-text",
  warning: "bg-warning-surface text-warning-text",
  danger: "bg-danger-surface text-danger-text",
};

const ICONS: Record<OrderStatusKey, typeof Clock> = {
  pending: Clock,
  paid: CircleCheck,
  completed: PackageCheck,
  cancelled: XCircle,
  refunded: CircleAlert,
  unknown: CircleAlert,
};

export function OrderStatusBadge({
  status,
  label,
  className,
}: {
  /** Código tal como lo devuelve la API (`pending`, `paid`, …). */
  status: string;
  /** Etiqueta ya traducida. */
  label: string;
  className?: string;
}) {
  const key = orderStatusKey(status);
  const Icon = ICONS[key];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        TONES[orderStatusTone(key)],
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {label}
    </span>
  );
}

/** Insignia de la línea de estado del vendedor (preparación y envío). */
export function SellerOrderStatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label: string;
  className?: string;
}) {
  const tones: Record<string, string> = {
    pending: TONES.warning,
    processing: TONES.info,
    shipped: TONES.info,
    delivered: TONES.success,
    cancelled: TONES.neutral,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[status] ?? TONES.neutral,
        className,
      )}
    >
      <Truck aria-hidden className="size-3.5" />
      {label}
    </span>
  );
}
