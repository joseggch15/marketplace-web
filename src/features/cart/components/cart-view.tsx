"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/format/money";

import { cartErrorMessageKey, type KnownCartErrorCode } from "../error-codes";
import {
  useCart,
  useCartPending,
  useClearCart,
  useRemoveCartItem,
  useUpdateCartItemQuantity,
} from "../hooks";
import { CartItemRow } from "./cart-item-row";

/**
 * Carrito (`/cart`), con sus cuatro estados.
 *
 * Por qué es un componente cliente: toda la pantalla es interactiva (cantidad, quitar, vaciar) y comparte la
 * caché del carrito con el contador de la cabecera y con el botón «Agregar al carrito». Además, la página del
 * carrito no tiene ningún valor para el SEO (`noindex`), así que no hay motivo para renderizarla en el servidor
 * y volver a pedirla en el navegador: eso serían dos peticiones para lo mismo.
 *
 * Todo el dinero viene calculado del servidor (`unit_price`, `subtotal` de cada línea y `subtotal` del
 * carrito). El navegador solo formatea; nunca suma.
 */
export function CartView() {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const { cart, loading, failed, reload } = useCart();
  const pending = useCartPending();
  const updateQuantity = useUpdateCartItemQuantity();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();
  const [failure, setFailure] = useState<KnownCartErrorCode | "unknown" | null>(null);

  async function changeQuantity(variantId: string, quantity: number): Promise<void> {
    setFailure(null);
    const result = await updateQuantity.mutateAsync({ variantId, quantity });

    if (!result.ok) {
      setFailure(cartErrorMessageKey(result.code));
    }
  }

  async function remove(variantId: string): Promise<void> {
    setFailure(null);
    const result = await removeItem.mutateAsync(variantId);

    if (!result.ok) {
      setFailure(cartErrorMessageKey(result.code));
    }
  }

  async function clear(): Promise<void> {
    setFailure(null);
    const result = await clearCart.mutateAsync();

    if (!result.ok) {
      setFailure(cartErrorMessageKey(result.code));
    }
  }

  if (loading) {
    return <CartSkeleton />;
  }

  if (failed || cart === null) {
    return <CartFailure onRetry={reload} />;
  }

  const alert =
    failure === null ? null : (
      <p
        role="alert"
        className="rounded-lg border border-danger-text/30 bg-danger-surface px-3 py-2 text-sm text-danger-text"
      >
        {t(`errors.${failure}`)}
      </p>
    );

  if (cart.items.length === 0) {
    return (
      <div className="flex max-w-lg flex-col gap-4">
        {alert}
        <div className="flex flex-col gap-2 rounded-xl border border-border p-6 text-center">
          <h2 className="font-heading text-lg font-semibold">{t("empty.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("empty.description")}</p>
          <Button asChild size="lg" className="mx-auto mt-2">
            <Link href="/">{t("empty.action")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = formatMoney(cart.subtotal, cart.currency, locale);

  return (
    <div className="flex flex-col gap-6">
      {alert}

      <ul className="flex flex-col">
        {cart.items.map((item) => (
          <CartItemRow
            key={item.variant_id}
            item={item}
            currency={cart.currency}
            locale={locale}
            pending={
              (updateQuantity.isPending &&
                updateQuantity.variables?.variantId === item.variant_id) ||
              (removeItem.isPending && removeItem.variables === item.variant_id)
            }
            onQuantityChange={changeQuantity}
            onRemove={remove}
          />
        ))}
      </ul>

      <section
        aria-labelledby="cart-summary-title"
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
      >
        <h2 id="cart-summary-title" className="font-heading text-lg font-semibold">
          {t("summary.title")}
        </h2>

        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{t("summary.items", { count: cart.total_items })}</dt>
            <dd className="font-medium">{cart.currency}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">{t("summary.subtotal")}</dt>
            <dd className="font-heading text-lg font-semibold" aria-busy={pending}>
              {pending ? (
                <span className="text-base font-normal text-muted-foreground">
                  {t("summary.updating")}
                </span>
              ) : (
                (subtotal ?? t("item.priceUnavailable"))
              )}
            </dd>
          </div>
        </dl>

        <p className="text-xs text-muted-foreground">{t("summary.note")}</p>

        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={pending}
          className="sm:w-fit"
          onClick={() => {
            void clear();
          }}
        >
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
          {t("summary.clear")}
        </Button>

        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          <Button type="button" size="lg" disabled>
            {t("summary.checkout")}
          </Button>
          <p className="text-xs text-muted-foreground">{t("summary.checkoutComingSoon")}</p>
          <Button asChild variant="link" size="sm" className="justify-start px-0">
            <Link href="/">{t("summary.continueShopping")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

/** Estado «cargando»: esqueletos con la forma final, para que la página no salte al llegar los datos. */
function CartSkeleton() {
  const t = useTranslations("Cart");

  return (
    <div className="flex flex-col gap-6" aria-busy>
      <p role="status" className="sr-only">
        {t("loading")}
      </p>
      <ul aria-hidden className="flex flex-col">
        {[0, 1].map((index) => (
          <li
            key={index}
            className="flex flex-col gap-4 border-t border-border py-4 first:border-t-0"
          >
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-5 w-24" />
            </div>
          </li>
        ))}
      </ul>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

/** Estado de error: se explica qué pasó y se ofrece volver a intentarlo. */
function CartFailure({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("Cart");

  return (
    <div className="flex max-w-lg flex-col items-start gap-3 rounded-xl border border-border p-6">
      <TriangleAlert aria-hidden className="size-5 text-danger-text" />
      <h2 className="font-heading text-lg font-semibold">{t("failure.title")}</h2>
      <p className="text-sm text-muted-foreground">{t("failure.description")}</p>
      <Button type="button" size="lg" onClick={onRetry}>
        {t("failure.retry")}
      </Button>
    </div>
  );
}
