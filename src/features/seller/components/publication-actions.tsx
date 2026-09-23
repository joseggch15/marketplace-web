"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ErrorNotice } from "@/components/domain/notice";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

import { sellerErrorKey } from "../error-codes";
import { useSetPublication } from "../hooks";
import type { SellerProduct } from "../types";
import { canClose, canPause, canPublish } from "../variants";

/**
 * Publicar, pausar o cerrar un producto.
 *
 * Se ofrece **solo lo que el producto puede hacer** (`canPublish`, `canPause`, `canClose`): la API rechazaría lo
 * demás con `invalid_product_status` y es mejor no enseñar un botón que va a fallar. Cerrar un producto es
 * irreversible desde aquí (la API no reabre un producto cerrado), así que pide confirmación con el nombre del
 * producto delante y dice qué va a pasar.
 */
export function PublicationActions({ product }: { product: SellerProduct }) {
  const t = useTranslations("Seller");
  const router = useRouter();
  const setPublication = useSetPublication(product.id);
  const [failure, setFailure] = useState<string | null>(null);
  const [confirmingClose, setConfirmingClose] = useState(false);

  async function run(action: "publish" | "pause" | "close") {
    setFailure(null);
    const result = await setPublication.mutateAsync(action);

    if (!result.ok) {
      setFailure(t(`errors.${sellerErrorKey(result.code)}`));
      setConfirmingClose(false);
      return;
    }

    setConfirmingClose(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {failure === null ? null : <ErrorNotice message={failure} />}

      <div className="flex flex-wrap gap-2">
        {canPublish(product) ? (
          <Button
            type="button"
            size="lg"
            disabled={setPublication.isPending}
            onClick={() => void run("publish")}
          >
            {setPublication.isPending ? (
              <>
                <Loader2 aria-hidden className="animate-spin" />
                {t("publication.working")}
              </>
            ) : (
              t("publication.publish")
            )}
          </Button>
        ) : null}

        {canPause(product) ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={setPublication.isPending}
            onClick={() => void run("pause")}
          >
            {t("publication.pause")}
          </Button>
        ) : null}

        {canClose(product) ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            disabled={setPublication.isPending}
            onClick={() => setConfirmingClose(true)}
          >
            {t("publication.close")}
          </Button>
        ) : null}
      </div>

      {confirmingClose ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <p className="font-heading text-sm font-semibold">
            {t("publication.closeConfirmTitle", { product: product.title })}
          </p>
          <p className="text-sm text-muted-foreground">{t("publication.closeConfirmHint")}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              size="lg"
              disabled={setPublication.isPending}
              onClick={() => void run("close")}
            >
              {t("publication.closeConfirm")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={setPublication.isPending}
              onClick={() => setConfirmingClose(false)}
            >
              {t("publication.closeCancel")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
