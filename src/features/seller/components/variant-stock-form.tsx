"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ErrorNotice, SuccessNotice } from "@/components/domain/notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";

import { sellerErrorKey } from "../error-codes";
import { useUpdateVariantStock } from "../hooks";
import { variantLabel } from "../variants";
import type { ProductVariant } from "../types";

/**
 * Stock de cada variante: un campo numérico por presentación.
 *
 * El valor que se manda es el **total** que el vendedor tiene en el almacén (no un incremento) y el servidor
 * calcula el delta con bloqueo de fila. Nunca baja por debajo de las unidades reservadas por pedidos en curso:
 * eso responde 409 `insufficient_stock` y la pantalla lo explica en lugar de dejar el campo en un valor falso.
 *
 * Se enseña además lo **reservado** (`stock - available`), porque es la única forma de que el vendedor entienda
 * por qué no puede bajar de cierto número.
 */
export function VariantStockForm({
  productId,
  variants,
}: {
  productId: string;
  variants: ProductVariant[];
}) {
  const t = useTranslations("Seller");
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(variants.map((variant) => [variant.id, String(variant.stock)])),
  );
  const [failure, setFailure] = useState<string | null>(null);
  const [savedVariantId, setSavedVariantId] = useState<string | null>(null);
  const [pendingVariantId, setPendingVariantId] = useState<string | null>(null);
  const updateStock = useUpdateVariantStock(productId);

  if (variants.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("stock.none")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {failure === null ? null : <ErrorNotice message={failure} />}

      <ul className="flex flex-col gap-3">
        {variants.map((variant) => {
          const reserved = Math.max(0, variant.stock - variant.available);
          const current = values[variant.id] ?? String(variant.stock);
          const changed = current.trim() !== String(variant.stock);

          return (
            <li
              key={variant.id}
              className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-3"
            >
              <div className="flex min-w-40 flex-col gap-1">
                <p className="text-sm font-medium">{variantLabel(variant)}</p>
                <p className="text-xs text-muted-foreground">
                  {t("stock.detail", {
                    sku: variant.sku,
                    available: variant.available,
                    reserved,
                  })}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`stock-${variant.id}`}>{t("stock.label")}</Label>
                <Input
                  id={`stock-${variant.id}`}
                  className="w-28"
                  inputMode="numeric"
                  value={current}
                  onChange={(event) =>
                    setValues((state) => ({ ...state, [variant.id]: event.target.value }))
                  }
                />
              </div>

              <Button
                type="button"
                size="lg"
                variant="outline"
                disabled={!changed || pendingVariantId !== null}
                onClick={() => void save(variant.id, current)}
              >
                {pendingVariantId === variant.id ? (
                  <>
                    <Loader2 aria-hidden className="animate-spin" />
                    {t("stock.saving")}
                  </>
                ) : (
                  t("stock.save")
                )}
              </Button>

              {savedVariantId === variant.id ? (
                <SuccessNotice message={t("stock.saved")} className="w-full sm:w-auto" />
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-muted-foreground">{t("stock.hint")}</p>
    </div>
  );

  async function save(variantId: string, raw: string) {
    setFailure(null);
    setSavedVariantId(null);

    const parsed = Number(raw.trim());

    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100_000) {
      setFailure(t("validation.invalid"));
      return;
    }

    setPendingVariantId(variantId);
    const result = await updateStock.mutateAsync({ variantId, stock: parsed });
    setPendingVariantId(null);

    if (!result.ok) {
      setFailure(t(`errors.${sellerErrorKey(result.code)}`));
      return;
    }

    setSavedVariantId(variantId);
    router.refresh();
  }
}
