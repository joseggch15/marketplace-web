"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DealBadge } from "@/components/domain/deal-badge";
import { Price } from "@/components/domain/price";
import { QuantityStepper } from "@/components/domain/quantity-stepper";
import { VariantSelector, type VariantOption } from "@/components/domain/variant-selector";
import { Button } from "@/components/ui/button";
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
 * Añadir al carrito llega en la **F5**; el botón ya está en su sitio, deshabilitado y explicado, para que la
 * caja de compra se vea como será sin prometer algo que aún no funciona.
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
  const ordered = sortedVariants(variants);
  const [selectedId, setSelectedId] = useState(() => defaultVariantId(ordered) ?? "");
  const [quantity, setQuantity] = useState(1);

  const selected = ordered.find((variant) => variant.id === selectedId) ?? ordered[0] ?? null;

  if (selected === null) {
    // Un producto sin variantes no se puede comprar: no hay nada que mostrar en la caja de compra.
    return null;
  }

  const available = availabilityOf(availability, selected.id);
  const options: VariantOption[] = ordered.map((variant) => ({
    value: variant.id,
    label: variant.sku,
    // Con la disponibilidad sin comprobar no se marca nada como agotado (sería afirmar algo que no sabemos).
    available: availabilityOf(availability, variant.id) !== 0,
  }));

  function selectVariant(nextId: string) {
    setSelectedId(nextId);
    // Cada presentación tiene su propio stock: la cantidad vuelve a 1 para no arrastrar un número que quizá ya
    // no sea válido.
    setQuantity(1);
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
            <p className="text-sm text-muted-foreground">{t("stock.available", { count: available })}</p>
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
        <Button type="button" size="lg" disabled className="w-full">
          <ShoppingCart aria-hidden />
          {t("buy.addToCart")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("buy.comingSoon")}</p>
      </div>
    </div>
  );
}
