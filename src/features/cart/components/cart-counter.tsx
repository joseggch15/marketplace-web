"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { useCart } from "../hooks";

/**
 * Contador del carrito en la cabecera.
 *
 * Criterios:
 * - El número es **el real**: es `total_items`, que calcula el servidor sumando las cantidades. No es una
 *   estimación del navegador ni un dato guardado aparte que pueda quedar desincronizado.
 * - Si el servidor ya sabe que el visitante no tiene carrito (ni sesión ni cookie de invitado), `enabled` llega
 *   en `false` y **no se pide nada** a la API: un visitante nuevo no gasta una petición por mirar una página.
 * - Comparte la clave de caché con la página `/cart` y con el botón «Agregar al carrito», así que la primera
 *   petición la aprovechan las tres.
 * - Sin carrito no se muestra ninguna insignia (no se enseña un «0» que parezca un error).
 */
export function CartCounter({ enabled }: { enabled: boolean }) {
  const t = useTranslations("Cart");
  const { cart } = useCart({ enabled });
  const count = cart?.total_items ?? 0;

  return (
    <Link
      href="/cart"
      aria-label={t("counter.label", { count })}
      className="relative flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium hover:bg-muted"
    >
      <ShoppingCart aria-hidden className="size-4" />
      <span className="hidden sm:inline">{t("counter.text")}</span>
      {count > 0 ? (
        <span
          aria-hidden
          className="grid min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground"
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
