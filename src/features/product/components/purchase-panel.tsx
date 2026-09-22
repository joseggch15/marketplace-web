"use client";

import { Loader2, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DealBadge } from "@/components/domain/deal-badge";
import { Price } from "@/components/domain/price";
import { QuantityStepper } from "@/components/domain/quantity-stepper";
import { VariantSelector, type VariantOption } from "@/components/domain/variant-selector";
import { Button } from "@/components/ui/button";
import { cartErrorMessageKey, type KnownCartErrorCode } from "@/features/cart/error-codes";
import { useAddCartItem } from "@/features/cart/hooks";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { availabilityOf, defaultVariantId, sortedVariants } from "../selectors";
import type { Availability, ProductVariant } from "../types";

/**
 * Caja de compra de la página de producto (lo único interactivo de la ficha).
 *
 * Reglas de honestidad que se cumplen aquí:
 * - **El stock es real**: sale del inventario del backend. Si no se pudo comprobar, se dice y no se afirma
 *   nada; el selector de cantidad desaparece (no se inventa un máximo) y no se marca nada como agotado.
 * - **No hay urgencia ni escasez inventada**: solo el número de unidades que hay de verdad.
 * - El precio mostrado es el de **la presentación elegida**, con su precio anterior si lo tiene.
 *
 * Sobre las variantes: el backend todavía no expone los valores de atributo (color, talla) de cada variante,
 * así que se identifican por su SKU, que es un dato del vendedor. Está anotado en `docs/PENDIENTES-BACKEND.md`.
 *
 * **Agregar al carrito (F5):** el botón funciona desde esta fase. La operación pasa por la ruta BFF
 * `/api/cart/items` (el navegador no ve tokens) y los errores se traducen por su `code` estable. No hay
 * actualización optimista aquí a propósito: el navegador no conoce el precio ni el subtotal de la línea (los
 * calcula el servidor), así que mientras responde se muestra el estado «agregando» en lugar de inventar datos.
 * Si la disponibilidad no se pudo comprobar, el botón **no** se deshabilita: no sabemos que no haya stock, y
 * afirmarlo sería tan incorrecto como inventar unidades.
 */
export function PurchasePanel({
  variants,
  availability,
  currency,
  locale,
  className,
}: {
  variants: ProductVariant[];
  /** Unidades por variante, o `null` si no se pudieron comprobar. */
  availability: Availability | null;
  currency: string;
  locale: string;
  className?: string;
}) {
  const t = useTranslations("Product");
  const tCart = useTranslations("Cart");
  const addToCart = useAddCartItem();
  const ordered = sortedVariants(variants);
  const [selectedId, setSelectedId] = useState(() => defaultVariantId(ordered) ?? "");
  const [quantity, setQuantity] = useState(1);
  const [failure, setFailure] = useState<KnownCartErrorCode | "unknown" | null>(null);
  const [added, setAdded] = useState(false);

  const selected = ordered.find((variant) => variant.id === selectedId) ?? ordered[0] ?? null;

  if (selected === null) {
    // Un producto sin variantes no se puede comprar: no hay nada que mostrar en la caja de compra.
    return null;
  }

  const available = availabilityOf(availability, selected.id);
  const soldOut = available === 0;
  const options: VariantOption[] = ordered.map((variant) => ({
    value: variant.id,
    label: variant.sku,
    // Con la disponibilidad sin comprobar no se marca nada como agotado (sería afirmar algo que no sabemos).
    available: availabilityOf(availability, variant.id) !== 0,
  }));

  function selectVariant(nextId: string) {
    setSelectedId(nextId);
    // Cada presentación tiene su propio stock: la cantidad vuelve a 1 para no arrastrar un número que quizá ya
    // no sea válido. Además se limpian los avisos, que eran de la presentación anterior.
    setQuantity(1);
    setFailure(null);
    setAdded(false);
  }

  async function add() {
    if (selected === null) {
      return;
    }

    setFailure(null);
    setAdded(false);

    const result = await addToCart.mutateAsync({ variantId: selected.id, quantity });

    if (!result.ok) {
      setFailure(cartErrorMessageKey(result.code));
      return;
    }

    setAdded(true);
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <Price
          amount={selected.price}
          currency={currency}
          locale={locale}
          compareAt={selected.compare_at_price}
          unavailableLabel={t("priceUnavailable")}
          size="lg"
        />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {available === 0 ? <DealBadge kind="out-of-stock" label={t("stock.outOfStock")} /> : null}
          {available !== null && available > 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("stock.available", { count: available })}
            </p>
          ) : null}
          {available === null ? (
            <p className="text-sm text-muted-foreground">{t("stock.unknown")}</p>
          ) : null}
        </div>

        {ordered.length === 1 ? (
          <p className="text-xs text-muted-foreground">{t("sku", { sku: selected.sku })}</p>
        ) : null}
      </div>

      {ordered.length > 1 ? (
        <div className="flex flex-col gap-1">
          <VariantSelector
            groupLabel={t("variant.group")}
            options={options}
            value={selected.id}
            onChange={selectVariant}
            labels={{ unavailable: t("variant.unavailable") }}
            errorMessage={availability === null ? t("variant.availabilityError") : undefined}
          />
          <p className="text-xs text-muted-foreground">{t("variant.hint")}</p>
        </div>
      ) : null}

      {available !== null && available > 0 ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">{t("quantity.label")}</span>
          <QuantityStepper
            value={quantity}
            min={1}
            max={available}
            onChange={setQuantity}
            labels={{
              quantity: t("quantity.label"),
              decrement: t("quantity.decrement"),
              increment: t("quantity.increment"),
              maxMessage: t("quantity.max", { max: available }),
              minMessage: t("quantity.min", { min: 1 }),
            }}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={soldOut || addToCart.isPending}
          onClick={() => {
            void add();
          }}
        >
          {addToCart.isPending ? (
            <Loader2 aria-hidden className="animate-spin" />
          ) : (
            <ShoppingCart aria-hidden />
          )}
          {addToCart.isPending ? t("buy.adding") : t("buy.addToCart")}
        </Button>

        {soldOut ? (
          <p className="text-xs text-muted-foreground">{t("buy.outOfStockHint")}</p>
        ) : null}

        {failure !== null ? (
          <p role="alert" className="text-sm text-danger-text">
            {tCart(`errors.${failure}`)}
          </p>
        ) : null}

        {added ? (
          <p
            role="status"
            className="border-brand-success/40 bg-brand-success/10 rounded-lg border px-3 py-2 text-sm"
          >
            {t("buy.added")}{" "}
            <Link href="/cart" className="text-primary underline underline-offset-4">
              {t("buy.viewCart")}
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
