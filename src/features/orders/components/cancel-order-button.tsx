"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

import { orderErrorKey } from "../error-codes";
import { useCancelOrder } from "../hooks";
import { ErrorNotice } from "./notice";

/**
 * Cancelar un pedido pendiente (con confirmación explícita).
 *
 * Dos decisiones:
 * - **La confirmación es un paso dentro de la propia tarjeta**, no un diálogo modal: se ve el número del pedido y
 *   qué va a pasar («se liberan las unidades reservadas»), y la acción destructiva no se dispara con un clic.
 * - Solo se ofrece cuando el pedido está **pendiente de pago**, que es exactamente lo que acepta el backend. Si el
 *   estado cambió (otra pestaña, otra sesión), la API responde con su `code` y aquí se traduce.
 */
export function CancelOrderButton({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: string;
}) {
  const t = useTranslations("Orders");
  const router = useRouter();
  const cancelOrder = useCancelOrder();
  const [confirming, setConfirming] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function confirm() {
    setFailure(null);
    const result = await cancelOrder.mutateAsync(orderId);

    if (!result.ok) {
      setFailure(t(`errors.${orderErrorKey(result.code)}`));
      setConfirming(false);
      return;
    }

    setConfirming(false);
    router.refresh();
  }

  if (!confirming) {
    return (
      <div className="flex flex-col gap-2">
        {failure === null ? null : <ErrorNotice message={failure} />}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-fit"
          onClick={() => setConfirming(true)}
        >
          {t("cancel.action")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3">
      <p className="font-heading text-sm font-semibold">
        {t("cancel.confirmTitle", { number: orderNumber })}
      </p>
      <p className="text-sm text-muted-foreground">{t("cancel.confirmDescription")}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="destructive"
          size="lg"
          disabled={cancelOrder.isPending}
          onClick={() => void confirm()}
        >
          {cancelOrder.isPending ? (
            <>
              <Loader2 aria-hidden className="animate-spin" />
              {t("cancel.pending")}
            </>
          ) : (
            t("cancel.confirm")
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          disabled={cancelOrder.isPending}
          onClick={() => setConfirming(false)}
        >
          {t("cancel.keep")}
        </Button>
      </div>
    </div>
  );
}
