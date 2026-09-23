"use client";

import { CircleAlert, CircleCheck } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Avisos de las pantallas de compra y del panel del vendedor.
 *
 * El mensaje se traduce **por el `code` estable** de la API (nunca por el texto en inglés) y viaja ya traducido
 * como prop, así este componente sirve a varias pantallas sin saber de qué espacio de mensajes viene el texto.
 *
 * Vive en `components/domain` porque lo usan dos features (pedidos y vendedor): antes estaba dentro de la de
 * pedidos y el panel del vendedor lo habría tenido que importar desde otra feature.
 */

export function ErrorNotice({ message, className }: { message: string; className?: string }) {
  return (
    <p
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-danger-text/30 bg-danger-surface px-3 py-2 text-sm text-danger-text",
        className,
      )}
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}

export function SuccessNotice({ message, className }: { message: string; className?: string }) {
  return (
    <p
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-success-text/30 bg-success-surface px-3 py-2 text-sm text-success-text",
        className,
      )}
    >
      <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}
