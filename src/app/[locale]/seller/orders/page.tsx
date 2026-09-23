import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { Price } from "@/components/domain/price";
import { StateCard } from "@/components/domain/state-card";
import { Button } from "@/components/ui/button";
import { readSessionTokens } from "@/features/auth/session";
import { sellerStatusKey } from "@/features/orders/status";
import { getShipment, listSellerOrders } from "@/features/seller/api";
import { SaleActions } from "@/features/seller/components/sale-actions";
import { SellerStatusBadge } from "@/features/seller/components/seller-status-badge";
import { parseCursor } from "@/features/seller/params";
import { canSell, loadMyStore } from "@/features/seller/server";
import { shipmentStatusKey } from "@/features/seller/status";
import type { SellerOrder, Shipment } from "@/features/seller/types";
import { Link } from "@/i18n/navigation";
import { defaultCurrency, routing } from "@/i18n/routing";
import { formatDateTime } from "@/lib/format/date";
import { formatMoney } from "@/lib/format/money";

/**
 * Ventas (`/es/seller/orders`).
 *
 * Cada venta es una **sub-orden** (la parte del pedido que le toca a esta tienda) con su comisión y su monto a
 * liquidar. La API devuelve el resumen sin líneas y pagina por cursor, así que el botón «ver ventas anteriores»
 * lleva el cursor en la URL: la página es compartible y el botón «atrás» funciona.
 *
 * Para poder ofrecer «marcar como enviado» hace falta saber si la venta ya tiene envío preparado, y eso es otra
 * consulta (una por venta). Se piden **en paralelo** y solo para las ventas abiertas: si una falla, esa venta se
 * muestra sin las acciones de envío en lugar de romper la pantalla entera.
 */
export default async function SellerOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Seller");
  const activeLocale = await getLocale();
  const lookup = await loadMyStore();

  if (lookup.status === "unavailable") {
    return (
      <StateCard
        tone="danger"
        title={t("unavailable.title")}
        description={t("unavailable.description")}
      />
    );
  }

  if (lookup.status === "none") {
    return (
      <StateCard
        title={t("products.noStoreTitle")}
        description={t("products.noStoreDescription")}
        action={
          <Button asChild size="lg">
            <Link href="/seller">{t("products.noStoreAction")}</Link>
          </Button>
        }
      />
    );
  }

  if (!canSell(lookup.store)) {
    return <StateCard title={t("cannotSell.title")} description={t("cannotSell.description")} />;
  }

  const { access } = await readSessionTokens();

  if (access === undefined) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/seller/orders`)}`);
  }

  const query = await searchParams;
  const cursor = parseCursor(query.cursor);
  const orders = await listSellerOrders(access, { limit: 20, cursor });

  if (!orders.ok) {
    return (
      <StateCard
        tone="danger"
        title={t("sales.unavailableTitle")}
        description={t("sales.unavailableDescription")}
      />
    );
  }

  const shipments = await loadShipments(access, orders.data.items);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-xl font-semibold">{t("sales.title")}</h2>

      {orders.data.items.length === 0 ? (
        <StateCard title={t("sales.emptyTitle")} description={t("sales.emptyDescription")} />
      ) : (
        <>
          <ul className="flex flex-col gap-4">
            {orders.data.items.map((sale) => {
              const shipment = shipments.get(sale.id) ?? null;
              const currency = sale.currency.length > 0 ? sale.currency : defaultCurrency;

              return (
                <li key={sale.id}>
                  <article className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <h3 className="font-heading text-base font-semibold">
                          {t("sales.saleNumber", { id: sale.id.slice(0, 8) })}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t("sales.placed", {
                            date: formatDateTime(sale.created_at, activeLocale) ?? "",
                          })}
                        </p>
                        <SellerStatusBadge
                          status={sale.status}
                          label={t(`sales.status.${sellerStatusKey(sale.status)}`)}
                          className="w-fit"
                        />
                      </div>

                      <dl className="flex flex-col gap-1 text-sm sm:items-end">
                        <div className="flex items-baseline gap-2">
                          <dt className="text-xs text-muted-foreground">{t("sales.subtotal")}</dt>
                          <dd>
                            <Price
                              amount={sale.subtotal}
                              currency={currency}
                              locale={activeLocale}
                              unavailableLabel="-"
                              size="sm"
                            />
                          </dd>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <dt className="text-xs text-muted-foreground">{t("sales.commission")}</dt>
                          <dd className="text-muted-foreground">
                            {formatMoney(sale.commission_amount, currency, activeLocale) ??
                              sale.commission_amount}
                          </dd>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <dt className="text-xs text-muted-foreground">{t("sales.payout")}</dt>
                          <dd className="font-medium">
                            {formatMoney(sale.payout_amount, currency, activeLocale) ??
                              sale.payout_amount}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {shipment === null
                        ? t("sales.noShipment")
                        : t("sales.shipmentLine", {
                            carrier: shipment.carrier ?? t("sales.unknownCarrier"),
                            tracking: shipment.tracking_number ?? t("sales.noTracking"),
                            status: t(`sales.shipment.${shipmentStatusKey(shipment.status)}`),
                          })}
                    </p>

                    <SaleActions sale={sale} shipment={shipment} />
                  </article>
                </li>
              );
            })}
          </ul>

          {orders.data.next_cursor === null ? null : (
            <div className="flex justify-center">
              <Button asChild variant="outline" size="lg">
                <Link href={`/seller/orders?cursor=${encodeURIComponent(orders.data.next_cursor)}`}>
                  {t("sales.more")}
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Envío de cada venta **abierta**, en paralelo.
 *
 * Las ventas entregadas o canceladas no lo necesitan (ya no se pueden tocar), así que ni se preguntan: menos
 * peticiones y la pantalla responde antes. Si una consulta falla, esa venta queda sin envío y conserva las
 * acciones básicas.
 */
async function loadShipments(access: string, sales: SellerOrder[]): Promise<Map<string, Shipment>> {
  const open = sales.filter((sale) => sale.status !== "delivered" && sale.status !== "cancelled");

  const results = await Promise.all(
    open.map(async (sale) => {
      const result = await getShipment(access, sale.id);
      return result.ok ? ([sale.id, result.data] as const) : null;
    }),
  );

  return new Map(results.filter((entry): entry is readonly [string, Shipment] => entry !== null));
}
