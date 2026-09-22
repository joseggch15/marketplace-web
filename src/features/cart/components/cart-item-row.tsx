"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Price } from "@/components/domain/price";
import { QuantityStepper } from "@/components/domain/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/format/money";

import { MAX_CART_QUANTITY, MIN_CART_QUANTITY } from "../selectors";
import type { CartItem } from "../types";

/**
 * Una línea del carrito.
 *
 * Lo que esta línea **no** muestra, a propósito: ni foto, ni color/talla de la variante, ni aviso de «no queda
 * stock» o «cambió el precio». Nada de eso llega en `CartItemOut`, así que inventarlo sería mentir; está pedido
 * en el apartado 14 de `docs/PENDIENTES-BACKEND.md`. Lo que sí se muestra es exactamente lo que el backend
 * devuelve: SKU, precio actual de la variante y el subtotal de la línea **calculado en el servidor**.
 *
 * Estados: normal · pendiente (mientras el servidor confirma una operación, los importes se marcan como
 * pendientes en vez de mostrar una cifra recalculada en el navegador) · sin precio.
 */
export function CartItemRow({
  item,
  currency,
  locale,
  pending,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  currency: string;
  locale: string;
  pending: boolean;
  onQuantityChange: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
}) {
  const t = useTranslations("Cart");
  const lineTotal = formatMoney(item.subtotal, currency, locale);

  return (
    <li className="flex flex-col gap-4 border-t border-border py-4 first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={`/p/${item.product_id}`}
            className="font-medium underline-offset-4 hover:underline"
          >
            {item.product_title}
          </Link>
          <p className="text-xs text-muted-foreground">{t("item.sku", { sku: item.sku })}</p>
          <Price
            amount={item.unit_price}
            currency={currency}
            locale={locale}
            unavailableLabel={t("item.priceUnavailable")}
            size="sm"
          />
        </div>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          aria-label={t("item.removeLabel", { title: item.product_title })}
          onClick={() => {
            onRemove(item.variant_id);
          }}
        >
          <Trash2 aria-hidden />
          {t("item.remove")}
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t("item.quantityLabel")}</span>
          <QuantityStepper
            value={item.quantity}
            min={MIN_CART_QUANTITY}
            max={MAX_CART_QUANTITY}
            loading={pending}
            onChange={(quantity) => {
              onQuantityChange(item.variant_id, quantity);
            }}
            labels={{
              quantity: t("item.quantityLabel"),
              decrement: t("item.quantityDecrement"),
              increment: t("item.quantityIncrement"),
              maxMessage: t("item.quantityMax", { max: MAX_CART_QUANTITY }),
              minMessage: t("item.quantityMin", { min: MIN_CART_QUANTITY }),
            }}
          />
        </div>

        <p className="flex items-baseline gap-2 text-sm">
          <span className="text-muted-foreground">{t("item.lineTotal")}</span>
          {pending ? (
            <span aria-busy className="text-muted-foreground">
              {t("item.pending")}
            </span>
          ) : (
            <span className="font-heading font-semibold">
              {lineTotal ?? t("item.priceUnavailable")}
            </span>
          )}
        </p>
      </div>
    </li>
  );
}
