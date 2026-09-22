import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { Price } from "@/components/domain/price";
import { StateCard } from "@/components/domain/state-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser, readSessionTokens } from "@/features/auth/session";
import { listOrders } from "@/features/orders/api";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { orderStatusKey } from "@/features/orders/status";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { formatDateTime } from "@/lib/format/date";

/**
 * Mis compras (`/es/orders`).
 *
 * Es la lista de pedidos del usuario con sesión, paginada **por cursor** (el botón «ver pedidos más antiguos»
 * lleva el cursor en la URL, así que la página es compartible y el botón «atrás» funciona).
 *
 * Cada tarjeta enseña lo que la API devuelve en el listado: número de pedido, fecha, estado, estado del pago y
 * total. Las líneas y el seguimiento están en el detalle, para no pedir toda la información de cada pedido.
 *
 * Estados: carga (no hay: la página se renderiza en el servidor con esqueletos de `Suspense` no hacen falta
 * porque el listado es liviano), vacío (sin pedidos, con acción sugerida), error (el backend no responde) y éxito.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

type OrdersPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrdersPage({ params, searchParams }: OrdersPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (user === null) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/orders`)}`);
  }

  const t = await getTranslations("Orders");
  const activeLocale = await getLocale();
  const query = await searchParams;
  const cursorParam = Array.isArray(query.cursor) ? query.cursor[0] : query.cursor;
  const cursor =
    cursorParam !== undefined && /^[A-Za-z0-9_=:+-]{1,512}$/.test(cursorParam) ? cursorParam : null;
  const { access } = await readSessionTokens();

  if (access === undefined) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/orders`)}`);
  }

  const orders = await listOrders(access, { limit: 20, cursor });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {!orders.ok ? (
        <StateCard
          tone="danger"
          title={t("unavailable.title")}
          description={t("unavailable.description")}
          action={
            <Button asChild variant="outline" size="lg">
              <Link href="/orders">{t("retry")}</Link>
            </Button>
          }
        />
      ) : orders.data.items.length === 0 ? (
        <StateCard
          title={t("empty.title")}
          description={t("empty.description")}
          action={
            <Button asChild size="lg">
              <Link href="/search">{t("empty.action")}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {orders.data.items.map((order) => (
              <li key={order.id}>
                <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="font-heading text-base font-semibold">
                      {t("list.orderNumber", { number: order.order_number })}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t("list.placed", {
                        date: formatDateTime(order.created_at, activeLocale) ?? "",
                      })}
                    </p>
                    <OrderStatusBadge
                      status={order.status}
                      label={t(`status.${orderStatusKey(order.status)}`)}
                      className="mt-1 w-fit"
                    />
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span className="flex items-baseline gap-2">
                      <span className="text-xs text-muted-foreground">{t("list.total")}</span>
                      <Price
                        amount={order.total}
                        currency={order.currency}
                        locale={activeLocale}
                        unavailableLabel="-"
                        size="md"
                      />
                    </span>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/orders/${order.id}`}>{t("list.seeDetail")}</Link>
                    </Button>
                  </div>
                </article>
              </li>
            ))}
          </ul>

          {orders.data.next_cursor === null ? null : (
            <div className="flex justify-center">
              <Button asChild variant="outline" size="lg">
                <Link href={`/orders?cursor=${encodeURIComponent(orders.data.next_cursor)}`}>
                  {t("list.more")}
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
