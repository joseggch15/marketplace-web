import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StateCard } from "@/components/domain/state-card";
import { Button } from "@/components/ui/button";
import { readSessionTokens } from "@/features/auth/session";
import { listMyProducts, listSellerOrders } from "@/features/seller/api";
import { MetricCards, type MetricCard } from "@/features/seller/components/metric-cards";
import { SellerStatusBadge } from "@/features/seller/components/seller-status-badge";
import { StoreForm } from "@/features/seller/components/store-form";
import { SALES_PAGE_LIMIT, SALES_PAGE_SIZE, summarizeSales } from "@/features/seller/metrics";
import { canSell, loadMyStore } from "@/features/seller/server";
import { storeStatusKey } from "@/features/seller/status";
import type { SellerOrderPage } from "@/features/seller/types";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { formatMoney } from "@/lib/format/money";

/**
 * Tablero del vendedor (`/es/seller`).
 *
 * Dos caras según el estado real de la tienda:
 * - **Sin tienda**: el formulario para solicitarla, explicando que un administrador la revisa antes.
 * - **Con tienda**: su estado y las **tres cifras** (ventas, pedidos y productos), sin gráficos.
 *
 * Las cifras no las da la API: no hay endpoint de totales para un vendedor (`/admin/metrics` es de
 * administración). Así que se pagina el listado de ventas por cursor con un tope (`SALES_PAGE_LIMIT` páginas) y
 * se suma lo leído **diciendo siempre sobre cuántas ventas** se está calculando: un número sin su alcance es un
 * número que miente. El dinero se suma en céntimos con `BigInt` (`summarizeSales`).
 */
export default async function SellerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
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
        action={
          <Button asChild variant="outline" size="lg">
            <Link href="/seller">{t("retry")}</Link>
          </Button>
        }
      />
    );
  }

  if (lookup.status === "none") {
    return (
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-xl font-semibold">{t("store.createTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("store.createSubtitle")}</p>
        </div>
        <StoreForm mode="create" />
      </section>
    );
  }

  const store = lookup.store;
  const { access } = await readSessionTokens();
  const products = access === undefined ? null : await listMyProducts(access);
  const sales = access === undefined ? [] : await readSalesPages(access);
  const summary = summarizeSales(sales, products?.ok === true ? products.data.length : 0);
  const currency =
    sales.find((page): page is SellerOrderPage => page !== null)?.items[0]?.currency ?? "COP";

  const cards: MetricCard[] = [
    {
      id: "sales",
      label: t("metrics.sales"),
      value: formatMoney(summary.sales, currency, activeLocale) ?? summary.sales,
      hint: t("metrics.salesHint"),
      tone: "brand",
    },
    {
      id: "payout",
      label: t("metrics.payout"),
      value: formatMoney(summary.payout, currency, activeLocale) ?? summary.payout,
      hint: t("metrics.payoutHint"),
    },
    {
      id: "orders",
      label: t("metrics.orders"),
      value: String(summary.orders),
      hint: t("metrics.ordersHint"),
    },
    {
      id: "products",
      label: t("metrics.products"),
      value: String(summary.products),
      hint: t("metrics.productsHint"),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2 rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-lg font-semibold">{t("store.stateTitle")}</h2>
          <SellerStatusBadge
            status={store.status}
            label={t(`store.status.${storeStatusKey(store.status)}`)}
          />
        </div>
        {store.status === "approved" ? null : (
          <p className="text-sm text-muted-foreground">
            {t(`store.hint.${storeStatusKey(store.status)}`)}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-semibold">{t("metrics.title")}</h2>
        <MetricCards cards={cards} />
        <p className="text-xs text-muted-foreground">
          {summary.complete
            ? t("metrics.scopeComplete", { count: summary.orders })
            : t("metrics.scope", {
                count: summary.orders,
                pages: summary.pagesRead,
                limit: summary.pageLimit,
              })}
        </p>
        {summary.complete ? null : (
          <p className="text-xs text-muted-foreground">{t("metrics.incomplete")}</p>
        )}
      </section>

      {canSell(store) ? null : (
        <StateCard title={t("cannotSell.title")} description={t("cannotSell.description")} />
      )}

      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <h2 className="font-heading text-lg font-semibold">{t("store.editTitle")}</h2>
        <StoreForm
          mode="edit"
          defaultName={store.name}
          defaultDescription={store.description ?? ""}
        />
      </section>
    </div>
  );
}

/**
 * Lee hasta `SALES_PAGE_LIMIT` páginas del listado de ventas.
 *
 * Se piden **en serie** porque cada página necesita el cursor de la anterior, y se corta en cuanto una falla o
 * el backend deja de mandar cursor: `summarizeSales` verá el hueco y dirá que el total está incompleto en lugar
 * de presentar una cifra falsamente definitiva.
 */
async function readSalesPages(access: string): Promise<(SellerOrderPage | null)[]> {
  const pages: (SellerOrderPage | null)[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < SALES_PAGE_LIMIT; page += 1) {
    const result = await listSellerOrders(access, { limit: SALES_PAGE_SIZE, cursor });

    if (!result.ok) {
      pages.push(null);
      break;
    }

    pages.push(result.data);
    cursor = result.data.next_cursor;

    if (cursor === null) {
      break;
    }
  }

  return pages;
}
