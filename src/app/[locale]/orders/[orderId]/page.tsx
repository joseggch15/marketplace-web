import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { OrderTimeline } from "@/components/domain/order-timeline";
import { Price } from "@/components/domain/price";
import { StateCard } from "@/components/domain/state-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser, readSessionTokens } from "@/features/auth/session";
import {
  fetchPublicStore,
  getOrder,
  listOrderPayments,
  listShipments,
  reviewedProductIds,
} from "@/features/orders/api";
import { CancelOrderButton } from "@/features/orders/components/cancel-order-button";
import {
  OrderStatusBadge,
  SellerOrderStatusBadge,
} from "@/features/orders/components/order-status-badge";
import { ReviewForm } from "@/features/orders/components/review-form";
import { isOrderId } from "@/features/orders/params";
import {
  buildTimeline,
  canCancelOrder,
  canReviewItem,
  orderStatusKey,
  paymentStatusKey,
  sellerStatusKey,
} from "@/features/orders/status";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { formatDateTime } from "@/lib/format/date";

/**
 * Detalle de un pedido propio (`/es/orders/{id}`), que también es la **confirmación de compra**.
 *
 * Todo lo que se ve sale de la API: el pedido con sus sub-órdenes y líneas, el estado del pago, los envíos con su
 * transportadora y su guía, y el nombre de cada tienda (por `store_id`, con los datos públicos de la tienda).
 *
 * La confirmación (`?paid=1`) no enseña un «gracias» vacío: dice qué ha pasado, **qué pasa ahora** (los tres pasos
 * reales del pedido) y lleva a seguir comprando. Tampoco promete un correo: la API no tiene plantilla de correo de
 * pedido, así que no se puede afirmar que se haya enviado.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

type OrderPageProps = {
  params: Promise<{ locale: string; orderId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrderDetailPage({ params, searchParams }: OrderPageProps) {
  const { locale, orderId } = await params;

  if (!hasLocale(routing.locales, locale) || !isOrderId(orderId)) {
    notFound();
  }

  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (user === null) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/orders/${orderId}`)}`);
  }

  const t = await getTranslations("Orders");
  const activeLocale = await getLocale();
  const query = await searchParams;
  const justPaid = query.paid === "1";
  const { access } = await readSessionTokens();

  if (access === undefined) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/orders/${orderId}`)}`);
  }

  const order = await getOrder(access, orderId);

  if (!order.ok && order.status === 404) {
    notFound();
  }

  if (!order.ok) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <StateCard
          tone="danger"
          title={t("detail.unavailable.title")}
          description={t("detail.unavailable.description")}
          action={
            <Button asChild variant="outline" size="lg">
              <Link href="/orders">{t("detail.back")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const [shipments, payments, storeNames, reviewed] = await Promise.all([
    listShipments(access, orderId),
    listOrderPayments(access, orderId),
    Promise.all(
      order.data.seller_orders.map(async (sellerOrder) => {
        const store = await fetchPublicStore(sellerOrder.store_id);
        return [sellerOrder.store_id, store.ok ? store.data.name : null] as const;
      }),
    ),
    reviewedProductIds(
      access,
      user.id,
      order.data.seller_orders.flatMap((sellerOrder) =>
        sellerOrder.items.flatMap((item) => (item.product_id === null ? [] : [item.product_id])),
      ),
    ),
  ]);

  const stores = new Map(storeNames);
  const shipmentList = shipments.ok ? shipments.data : [];
  const paidPayment = (payments.ok ? payments.data : []).find(
    (payment) => payment.paid_at !== null,
  );
  const timeline = buildTimeline(order.data, {
    paidAt: paidPayment?.paid_at ?? null,
    shipments: shipmentList,
  });
  const address = order.data.shipping_address as Record<string, unknown>;
  const addressLines = [
    typeof address["recipient"] === "string" ? (address["recipient"] as string) : null,
    typeof address["line1"] === "string" ? (address["line1"] as string) : null,
    typeof address["line2"] === "string" ? (address["line2"] as string) : null,
    [address["city"], address["state"], address["postal_code"]]
      .filter((part): part is string => typeof part === "string" && part.length > 0)
      .join(", "),
    typeof address["country"] === "string" ? (address["country"] as string) : null,
    typeof address["phone"] === "string" ? (address["phone"] as string) : null,
  ].filter((line): line is string => line !== null && line.length > 0);
  const currency = order.data.currency;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <nav aria-label={t("detail.back")}>
        <Link
          href="/orders"
          className="text-sm text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {t("detail.back")}
        </Link>
      </nav>

      {justPaid ? (
        <section
          aria-labelledby="order-confirmation-title"
          className="flex flex-col gap-3 rounded-xl border border-success-text/30 bg-success-surface/50 p-4 sm:p-6"
        >
          <h2 id="order-confirmation-title" className="font-heading text-xl font-bold">
            {t("confirmation.title")}
          </h2>
          <p className="text-sm">
            {t("confirmation.description", { number: order.data.order_number })}
          </p>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="font-heading text-sm font-semibold">{t("confirmation.nextTitle")}</p>
            <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-sm text-muted-foreground">
              <li>{t("confirmation.next1")}</li>
              <li>{t("confirmation.next2")}</li>
              <li>{t("confirmation.next3")}</li>
            </ol>
          </div>
          <Button asChild variant="outline" size="lg" className="w-fit">
            <Link href="/search">{t("confirmation.continueShopping")}</Link>
          </Button>
        </section>
      ) : null}

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">
            {t("detail.title", { number: order.data.order_number })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("detail.placed", {
              date: formatDateTime(order.data.created_at, activeLocale) ?? "",
            })}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2">
          <OrderStatusBadge
            status={order.data.status}
            label={t(`status.${orderStatusKey(order.data.status)}`)}
          />
          <OrderStatusBadge
            status={order.data.payment_status === "paid" ? "paid" : "pending"}
            label={t(`paymentStatus.${paymentStatusKey(order.data.payment_status)}`)}
          />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          {order.data.seller_orders.map((sellerOrder) => (
            <section
              key={sellerOrder.id}
              aria-labelledby={`seller-order-${sellerOrder.id}`}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <header className="flex flex-wrap items-center justify-between gap-2">
                <h2
                  id={`seller-order-${sellerOrder.id}`}
                  className="font-heading text-base font-semibold"
                >
                  {stores.get(sellerOrder.store_id) === null ||
                  stores.get(sellerOrder.store_id) === undefined
                    ? t("detail.unknownStore")
                    : t("detail.soldBy", { store: stores.get(sellerOrder.store_id) ?? "" })}
                </h2>
                <SellerOrderStatusBadge
                  status={sellerOrder.status}
                  label={t(`sellerStatus.${sellerStatusKey(sellerOrder.status)}`)}
                />
              </header>

              <ul className="flex flex-col gap-3 border-t border-border pt-3">
                {sellerOrder.items.map((item) => (
                  <li key={item.id} className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium">{item.product_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.variant_label === null
                            ? item.sku
                            : `${item.sku} · ${item.variant_label}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("detail.quantity", { count: item.quantity })}
                        </p>
                      </div>
                      <Price
                        amount={item.line_total}
                        currency={item.currency}
                        locale={activeLocale}
                        unavailableLabel="-"
                        size="sm"
                      />
                    </div>

                    {item.product_id === null ? null : canReviewItem(
                        sellerOrder,
                        item,
                        reviewed,
                      ) ? (
                      <ReviewForm productId={item.product_id} productTitle={item.product_title} />
                    ) : reviewed.has(item.product_id) ? (
                      <p className="text-xs text-muted-foreground">{t("review.reviewed")}</p>
                    ) : sellerOrder.status === "delivered" ? null : (
                      <p className="text-xs text-muted-foreground">{t("review.notDelivered")}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section
            aria-labelledby="order-timeline-title"
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
          >
            <h2 id="order-timeline-title" className="font-heading text-base font-semibold">
              {t("detail.timelineTitle")}
            </h2>
            <OrderTimeline
              items={timeline.map((entry) => ({
                id: entry.id,
                label: t(`detail.timeline.${entry.labelKey}`),
                date: entry.date,
              }))}
              states={timeline.map((entry) => entry.state)}
              locale={activeLocale}
              pendingDateLabel={t("detail.pendingDate")}
            />
          </section>

          <section
            aria-labelledby="order-tracking-title"
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
          >
            <h2 id="order-tracking-title" className="font-heading text-base font-semibold">
              {t("detail.trackingTitle")}
            </h2>
            {shipmentList.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("detail.noTracking")}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {shipmentList.map((shipment) => (
                  <li key={shipment.id} className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">
                      {t(`sellerStatus.${sellerStatusKey(shipment.status)}`)}
                    </span>
                    {shipment.carrier === null ? null : (
                      <span className="text-muted-foreground">
                        {t("detail.carrier", { carrier: shipment.carrier })}
                      </span>
                    )}
                    {shipment.tracking_number === null ? null : (
                      <span className="text-muted-foreground">
                        {t("detail.trackingNumber", { number: shipment.tracking_number })}
                      </span>
                    )}
                    {shipment.tracking_url === null ? null : (
                      <a
                        href={shipment.tracking_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="w-fit text-primary underline underline-offset-4"
                      >
                        {t("detail.trackingLink")}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section
            aria-labelledby="order-totals-title"
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
          >
            <h2 id="order-totals-title" className="font-heading text-base font-semibold">
              {t("detail.totalsTitle")}
            </h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{t("detail.subtotal")}</dt>
                <dd className="font-medium tabular-nums">
                  <Price
                    amount={order.data.subtotal}
                    currency={currency}
                    locale={activeLocale}
                    unavailableLabel="-"
                    size="sm"
                  />
                </dd>
              </div>
              {order.data.discount_total.startsWith("0.00") ? null : (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">{t("detail.discount")}</dt>
                  <dd className="font-medium tabular-nums">
                    <Price
                      amount={order.data.discount_total}
                      currency={currency}
                      locale={activeLocale}
                      unavailableLabel="-"
                      size="sm"
                    />
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{t("detail.shipping")}</dt>
                <dd className="font-medium tabular-nums">
                  <Price
                    amount={order.data.shipping_total}
                    currency={currency}
                    locale={activeLocale}
                    unavailableLabel="-"
                    size="sm"
                  />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
                <dt className="font-heading font-semibold">{t("detail.total")}</dt>
                <dd className="font-heading font-semibold tabular-nums">
                  <Price
                    amount={order.data.total}
                    currency={currency}
                    locale={activeLocale}
                    unavailableLabel="-"
                    size="md"
                  />
                </dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">{t("detail.paidIn", { currency })}</p>

            {canCancelOrder(order.data) ? (
              <CancelOrderButton orderId={order.data.id} orderNumber={order.data.order_number} />
            ) : null}
          </section>

          <section
            aria-labelledby="order-address-title"
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
          >
            <h2 id="order-address-title" className="font-heading text-base font-semibold">
              {t("detail.shipToTitle")}
            </h2>
            <address className="text-sm text-muted-foreground not-italic">
              {addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            {order.data.notes === null ? null : (
              <>
                <h3 className="mt-2 font-heading text-sm font-semibold">
                  {t("detail.notesTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">{order.data.notes}</p>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
