"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ErrorNotice, SuccessNotice } from "@/components/domain/notice";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

import { sellerErrorKey } from "../error-codes";
import {
  useCreateShipment,
  useUpdateSaleStatus,
  useUpdateShipment,
  useUpdateShipmentStatus,
} from "../hooks";
import { shipmentFormSchema, toShipmentBody } from "../schemas";
import type { ShipmentFormData, ShipmentFormValues } from "../schemas";
import type { SellerOrder, Shipment } from "../types";
import { SellerField, SellerSubmit } from "./fields";

/**
 * Gestionar una venta: prepararla, enviarla y entregarla.
 *
 * Cómo funciona de verdad (lo marca el backend, y aquí se refleja tal cual):
 * 1. La venta nace `pending`. **Preparar** la pasa a `processing`.
 * 2. Al **preparar el envío** (transportadora, guía y costo) se crea el envío en `ready`.
 * 3. Anotar el envío como `shipped` mueve la venta a `shipped`; anotarlo como `delivered` la mueve a
 *    `delivered` (y, si todas las ventas del pedido se entregan, el pedido se cierra como completado).
 *
 * El costo es un texto decimal (`0.00` también vale, y es lo normal cuando el vendedor no cobra aparte). Se
 * ofrecen **solo las acciones que el estado actual permite**: nada de botones que el backend vaya a rechazar.
 */
export function SaleActions({ sale, shipment }: { sale: SellerOrder; shipment: Shipment | null }) {
  const t = useTranslations("Seller");
  const router = useRouter();
  const updateStatus = useUpdateSaleStatus(sale.id);
  const createShipment = useCreateShipment(sale.id);
  const updateShipment = useUpdateShipment(sale.id);
  const updateShipmentStatus = useUpdateShipmentStatus(sale.id);
  const [failure, setFailure] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const form = useForm<ShipmentFormValues, unknown, ShipmentFormData>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: {
      carrier: shipment?.carrier ?? "",
      trackingNumber: shipment?.tracking_number ?? "",
      trackingUrl: shipment?.tracking_url ?? "",
      cost: shipment?.cost ?? "0.00",
      notes: shipment?.notes ?? "",
    },
  });

  const pending =
    updateStatus.isPending ||
    createShipment.isPending ||
    updateShipment.isPending ||
    updateShipmentStatus.isPending;

  /** Guarda los datos del envío: lo crea la primera vez y lo corrige después. */
  const onSaveShipment = form.handleSubmit(async (values) => {
    setFailure(null);
    setDone(null);

    const body = toShipmentBody(values);
    const result =
      shipment === null
        ? await createShipment.mutateAsync(body)
        : await updateShipment.mutateAsync(body);

    if (!result.ok) {
      setFailure(t(`errors.${sellerErrorKey(result.code)}`));
      return;
    }

    setDone(t("sales.shipmentSaved"));
    router.refresh();
  });

  async function changeStatus(status: "processing") {
    setFailure(null);
    setDone(null);
    const result = await updateStatus.mutateAsync(status);

    if (!result.ok) {
      setFailure(t(`errors.${sellerErrorKey(result.code)}`));
      return;
    }

    setDone(t("sales.statusSaved"));
    router.refresh();
  }

  async function advanceShipment(status: "shipped" | "delivered") {
    setFailure(null);
    setDone(null);
    const result = await updateShipmentStatus.mutateAsync({
      status,
      description: status === "delivered" ? t("sales.deliveredNote") : t("sales.shippedNote"),
    });

    if (!result.ok) {
      setFailure(t(`errors.${sellerErrorKey(result.code)}`));
      return;
    }

    setDone(t("sales.statusSaved"));
    router.refresh();
  }

  const closed = sale.status === "cancelled" || sale.status === "delivered";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
      {failure === null ? null : <ErrorNotice message={failure} />}
      {done === null ? null : <SuccessNotice message={done} />}

      {closed ? (
        <p className="text-sm text-muted-foreground">
          {sale.status === "cancelled" ? t("sales.cancelledHint") : t("sales.deliveredHint")}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {sale.status === "pending" ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                size="lg"
                disabled={pending}
                onClick={() => void changeStatus("processing")}
              >
                {updateStatus.isPending ? (
                  <>
                    <Loader2 aria-hidden className="animate-spin" />
                    {t("sales.working")}
                  </>
                ) : (
                  t("sales.prepare")
                )}
              </Button>
              <p className="text-xs text-muted-foreground">{t("sales.prepareHint")}</p>
            </div>
          ) : null}

          <form onSubmit={onSaveShipment} noValidate className="flex flex-col gap-4">
            <h3 className="font-heading text-sm font-semibold">
              {shipment === null ? t("sales.shipmentCreate") : t("sales.shipmentEdit")}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <SellerField
                id={`carrier-${sale.id}`}
                label={t("sales.carrier")}
                error={form.formState.errors.carrier?.message}
                registration={form.register("carrier")}
                maxLength={120}
                placeholder={t("sales.carrierPlaceholder")}
              />

              <SellerField
                id={`tracking-${sale.id}`}
                label={t("sales.trackingNumber")}
                hint={t("sales.trackingHint")}
                error={form.formState.errors.trackingNumber?.message}
                registration={form.register("trackingNumber")}
                maxLength={80}
              />

              <SellerField
                id={`tracking-url-${sale.id}`}
                label={t("sales.trackingUrl")}
                error={form.formState.errors.trackingUrl?.message}
                registration={form.register("trackingUrl")}
                maxLength={300}
                placeholder="https://"
              />

              <SellerField
                id={`ship-cost-${sale.id}`}
                label={t("sales.cost")}
                hint={t("sales.costHint")}
                error={form.formState.errors.cost?.message}
                registration={form.register("cost")}
                inputMode="decimal"
              />
            </div>

            <SellerField
              id={`ship-notes-${sale.id}`}
              label={t("sales.notes")}
              error={form.formState.errors.notes?.message}
              registration={form.register("notes")}
              textarea
              rows={2}
              maxLength={500}
            />

            <SellerSubmit
              pending={pending}
              label={shipment === null ? t("sales.saveShipment") : t("sales.updateShipment")}
              pendingLabel={t("sales.working")}
              className="sm:w-fit"
            />
          </form>

          {shipment === null ? null : (
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              {shipment.status === "ready" ? (
                <Button
                  type="button"
                  size="lg"
                  disabled={pending}
                  onClick={() => void advanceShipment("shipped")}
                >
                  {t("sales.markShipped")}
                </Button>
              ) : null}

              {shipment.status === "shipped" || shipment.status === "in_transit" ? (
                <Button
                  type="button"
                  size="lg"
                  disabled={pending}
                  onClick={() => void advanceShipment("delivered")}
                >
                  {t("sales.markDelivered")}
                </Button>
              ) : null}

              <p className="text-xs text-muted-foreground">
                {t("sales.shipmentStatus", { status: shipment.status })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
