import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { StateCard } from "@/components/domain/state-card";
import { readSessionTokens } from "@/features/auth/session";
import { listCategories } from "@/features/catalog/api";
import { ProductForm } from "@/features/seller/components/product-form";
import { canSell, loadMyStore } from "@/features/seller/server";
import { routing, defaultCurrency } from "@/i18n/routing";

/**
 * Crear un producto (`/es/seller/products/new`).
 *
 * Las **categorías** son públicas y son el primer paso del formulario, porque de la categoría salen los
 * atributos que admiten variantes (color, talla…). Si la lista de categorías no se puede leer, se dice y no se
 * pinta un formulario que no podría enviarse.
 *
 * El formulario lo construye el componente cliente `ProductForm`, que carga los atributos al vuelo y calcula
 * cuántas variantes van a salir antes de enviar nada. El precio que se escribe es el de la **moneda del
 * vendedor** (COP por defecto en la API): no hay conversión aquí, la conversión es informativa para el
 * comprador y la hace la ficha pública.
 */
export default async function NewSellerProductPage({
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
      />
    );
  }

  if (!canSell(lookup.store)) {
    return <StateCard title={t("cannotSell.title")} description={t("cannotSell.description")} />;
  }

  const { access } = await readSessionTokens();

  if (access === undefined) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/seller/products/new`)}`);
  }

  const categories = await listCategories();

  if (!categories.ok || categories.data.length === 0) {
    return (
      <StateCard
        tone="danger"
        title={t("categories.unavailableTitle")}
        description={t("categories.unavailableDescription")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-xl font-semibold">{t("product.newTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("product.newSubtitle")}</p>
      </div>

      <ProductForm
        categories={categories.data.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        locale={activeLocale}
        currency={defaultCurrency}
      />
    </div>
  );
}
