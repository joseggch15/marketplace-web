import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { Price } from "@/components/domain/price";
import { StateCard } from "@/components/domain/state-card";
import { Button } from "@/components/ui/button";
import { readSessionTokens } from "@/features/auth/session";
import { listMyProducts } from "@/features/seller/api";
import { SellerStatusBadge } from "@/features/seller/components/seller-status-badge";
import { canSell, loadMyStore } from "@/features/seller/server";
import { productStatusKey } from "@/features/seller/status";
import { cheapestPrice } from "@/features/seller/variants";
import { Link } from "@/i18n/navigation";
import { defaultCurrency, routing } from "@/i18n/routing";

/**
 * Mis productos (`/es/seller/products`).
 *
 * Lista **todos** los productos de la tienda con su estado, su precio más bajo, sus unidades disponibles y sus
 * ventas. La API no pagina este listado (devuelve el catálogo del vendedor completo) y tampoco admite filtros
 * por estado, así que no se inventan: se enseña todo, en el orden en que llega, con un enlace al alta arriba.
 *
 * Estados: vacío (con la acción de crear el primer producto), error (el backend no responde) y éxito. El
 * «cargando» no se dibuja porque la página se pinta ya con los datos en el servidor.
 */
export default async function SellerProductsPage({
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
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/seller/products`)}`);
  }

  const products = await listMyProducts(access);

  if (!products.ok) {
    return (
      <StateCard
        tone="danger"
        title={t("products.unavailableTitle")}
        description={t("products.unavailableDescription")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold">{t("products.title")}</h2>
        <Button asChild size="lg">
          <Link href="/seller/products/new">{t("products.newAction")}</Link>
        </Button>
      </div>

      {products.data.length === 0 ? (
        <StateCard
          title={t("products.emptyTitle")}
          description={t("products.emptyDescription")}
          action={
            <Button asChild size="lg">
              <Link href="/seller/products/new">{t("products.newAction")}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {products.data.map((product) => {
            const price = cheapestPrice(product);
            const variants = product.variants ?? [];

            return (
              <li key={product.id}>
                <article className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="flex min-w-60 flex-col gap-2">
                    <h3 className="font-heading text-base font-semibold">{product.title}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <SellerStatusBadge
                        status={product.status}
                        label={t(`product.status.${productStatusKey(product.status)}`)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {t("products.counts", {
                          variants: variants.length,
                          available: product.total_available,
                          sold: product.sold_count,
                        })}
                      </span>
                    </div>
                    {price === null ? (
                      <p className="text-sm text-muted-foreground">{t("products.noPrice")}</p>
                    ) : (
                      <Price
                        amount={price}
                        currency={defaultCurrency}
                        locale={activeLocale}
                        unavailableLabel={t("products.noPrice")}
                        size="sm"
                      />
                    )}
                  </div>

                  <Button asChild variant="outline" size="lg">
                    <Link href={`/seller/products/${product.id}`}>{t("products.edit")}</Link>
                  </Button>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
