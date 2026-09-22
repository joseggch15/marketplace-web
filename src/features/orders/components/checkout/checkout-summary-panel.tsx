"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { Price } from "@/components/domain/price";
import type { Cart, CartItem } from "@/features/cart/types";
import { mediaUrl } from "@/lib/media/url";

import type { CouponPreview } from "../../types";

/**
 * Resumen del pedido del checkout (pegajoso en escritorio).
 *
 * Qué enseña y de dónde sale:
 * - Las líneas del carrito con su **subtotal de línea** tal como lo devuelve el servidor (el navegador no hace
 *   aritmética de dinero).
 * - El **descuento del cupón** solo cuando el backend lo confirmó (`coupon`): es él quien lo calcula.
 * - El **envío** no se estima aquí. Durante el checkout se dice que lo calcula la tienda; cuando el pedido ya
 *   existe (confirmación), se muestra el importe real.
 * - El **total** que se cobra, en la moneda del vendedor.
 */
export function CheckoutSummaryPanel({
  cart,
  coupon = null,
  shippingTotal = null,
  total = null,
  pending,
  className,
}: {
  cart: Cart;
  coupon?: CouponPreview | null;
  /** Importe real del envío (solo cuando el pedido ya existe). */
  shippingTotal?: string | null;
  /** Total real del pedido, si ya existe (lo calcula el backend). */
  total?: string | null;
  pending: boolean;
  className?: string;
}) {
  const t = useTranslations("Checkout");
  const locale = useLocale();
  const currency = coupon?.currency ?? cart.currency;

  return (
    <aside
      aria-labelledby="checkout-summary-title"
      className={className ?? "rounded-xl border border-border bg-card p-4 lg:sticky lg:top-20"}
    >
      <h2 id="checkout-summary-title" className="font-heading text-base font-semibold">
        {t("summary.title")}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("summary.items", { count: cart.total_items })}
      </p>

      <ul className="mt-4 flex flex-col gap-3 border-b border-border pb-4">
        {cart.items.map((item: CartItem) => {
          const src = mediaUrl(item.thumbnail);

          return (
            <li key={item.variant_id} className="flex gap-3">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {src === null ? null : (
                  <Image
                    src={src}
                    alt=""
                    width={48}
                    height={48}
                    className="size-full object-cover"
                  />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-sm font-medium">{item.product_title}</span>
                <span className="text-xs text-muted-foreground">
                  {t("summary.items", { count: item.quantity })}
                </span>
                <Price
                  amount={item.subtotal}
                  currency={currency}
                  locale={locale}
                  unavailableLabel="-"
                  size="sm"
                />
              </span>
            </li>
          );
        })}
      </ul>

      <dl className="mt-4 flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{t("summary.subtotal")}</dt>
          <dd className="font-medium tabular-nums">
            <Price
              amount={coupon?.subtotal ?? cart.subtotal}
              currency={currency}
              locale={locale}
              unavailableLabel="-"
              size="sm"
            />
          </dd>
        </div>

        {coupon === null ? null : (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">{t("summary.discount")}</dt>
            <dd className="font-medium tabular-nums">
              <Price
                amount={coupon.discount_amount}
                currency={currency}
                locale={locale}
                unavailableLabel="-"
                size="sm"
              />
            </dd>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{t("summary.shipping")}</dt>
          <dd className="font-medium tabular-nums">
            {shippingTotal === null ? (
              <span className="text-xs text-muted-foreground">{t("summary.processing")}</span>
            ) : (
              <Price
                amount={shippingTotal}
                currency={currency}
                locale={locale}
                unavailableLabel="-"
                size="sm"
              />
            )}
          </dd>
        </div>

        <div className="mt-1 flex items-center justify-between gap-2 border-t border-border pt-3">
          <dt className="font-heading font-semibold">{t("summary.total")}</dt>
          <dd className="font-heading font-semibold tabular-nums">
            {total === null ? (
              <span className="text-sm text-muted-foreground">{t("summary.processing")}</span>
            ) : (
              <Price
                amount={total}
                currency={currency}
                locale={locale}
                unavailableLabel="-"
                size="md"
              />
            )}
          </dd>
        </div>
      </dl>

      {pending ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 aria-hidden className="size-3.5 animate-spin" />
          {t("summary.processing")}
        </p>
      ) : null}

      <p className="mt-3 text-xs text-muted-foreground">{t("summary.note")}</p>
    </aside>
  );
}
