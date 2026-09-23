import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { Price } from "@/components/domain/price";
import { StateCard } from "@/components/domain/state-card";
import { Button } from "@/components/ui/button";
import { readSessionTokens } from "@/features/auth/session";
import { getProduct } from "@/features/seller/api";
import { ProductDetailsForm } from "@/features/seller/components/product-details-form";
import { ProductImages } from "@/features/seller/components/product-images";
import { PublicationActions } from "@/features/seller/components/publication-actions";
import { SellerStatusBadge } from "@/features/seller/components/seller-status-badge";
import { VariantStockForm } from "@/features/seller/components/variant-stock-form";
import { isProductId } from "@/features/seller/params";
import { canSell, loadMyStore } from "@/features/seller/server";
import { productStatusKey } from "@/features/seller/status";
import { Link } from "@/i18n/navigation";
import { defaultCurrency, routing } from "@/i18n/routing";

/**
 * Editar un producto (`/es/seller/products/{id}`).
 *
 * Cuatro bloques, en el orden en que se trabaja: **estado y publicación**, **datos** (título, descripción y
 * marca), **stock por variante** e **imágenes**.
 *
 * Comprobación honesta de límites, para no ofrecer campos que la API ignora:
 * - El **precio** no se puede cambiar (`ProductUpdate` solo admite título, descripción y marca): se muestra en
 *   solo lectura con una nota.
 * - Las **variantes** tampoco se pueden añadir ni borrar desde la interfaz del prototipo; su **stock** sí, por
 *   un endpoint propio.
 *
 * Un producto de otra tienda responde 404 (`product_not_found`) y aquí se cuenta como tal: identificar el
 * producto no autoriza a nadie.
 */
export default async function SellerProductPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { locale, productId } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Seller");
  const activeLocale = await getLocale();
  const lookup = await loadMyStore();

  if (lookup.status !== "ok" || !canSell(lookup.store)) {
    return (
      <StateCard
        title={t("cannotSell.title")}
        description={t("cannotSell.description")}
        action={
          <Button asChild variant="outline" size="lg">
            <Link href="/seller">{t("nav.dashboard")}</Link>
          </Button>
        }
      />
    );
  }

  const { access } = await readSessionTokens();

  if (access === undefined) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/seller`)}`);
  }

  const product = isProductId(productId) ? await getProduct(access, productId) : null;

  // Un producto de otra tienda se trata como inexistente: el backend rechazaría el cambio (403), pero es mejor
  // no enseñar siquiera su ficha. La autorización de verdad la hace el servidor; esto es no dar falsas salidas.
  if (product === null || !product.ok || product.data.store_id !== lookup.store.id) {
    return (
      <StateCard
        tone="danger"
        title={t("product.notFoundTitle")}
        description={t("product.notFoundDescription")}
        action={
          <Button asChild variant="outline" size="lg">
            <Link href="/seller/products">{t("nav.products")}</Link>
          </Button>
        }
      />
    );
  }

  const variants = product.data.variants ?? [];
  const images = product.data.images ?? [];
  const cheapest = variants.length > 0 ? variants[0].price : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-xl font-semibold">{product.data.title}</h2>
        <SellerStatusBadge
          status={product.data.status}
          label={t(`product.status.${productStatusKey(product.data.status)}`)}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="font-heading text-lg font-semibold">{t("publication.title")}</h3>
        <PublicationActions product={product.data} />
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h3 className="font-heading text-lg font-semibold">{t("details.title")}</h3>
        {cheapest === null ? null : (
          <Price
            amount={cheapest}
            currency={defaultCurrency}
            locale={activeLocale}
            unavailableLabel={t("products.noPrice")}
            size="md"
          />
        )}
        <ProductDetailsForm
          productId={product.data.id}
          defaultTitle={product.data.title}
          defaultDescription={product.data.description ?? ""}
          defaultBrand={product.data.brand ?? ""}
        />
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h3 className="font-heading text-lg font-semibold">{t("stock.title")}</h3>
        <VariantStockForm productId={product.data.id} variants={variants} />
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h3 className="font-heading text-lg font-semibold">{t("images.title")}</h3>
        <ProductImages productId={product.data.id} images={images} />
      </section>
    </div>
  );
}
