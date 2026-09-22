import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/features/catalog/components/product-grid";
import { listCategories, searchProducts } from "@/features/catalog/api";
import { parseCatalogQuery, hasActiveFilters, catalogHref } from "@/features/catalog/params";
import { findCategoryBySlug } from "@/features/catalog/selectors";
import { Link } from "@/i18n/navigation";
import { defaultCurrency, routing } from "@/i18n/routing";

type CategoryPageProps = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Página de categoría (`/es/c/tecnologia`).
 *
 * Es una **página indexable** (a diferencia de /search): tiene título propio, descripción, `canonical` y
 * `hreflang`, y el filtro de categoría va fijado por la ruta para que el enlace sea corto y estable.
 *
 * Limitación honesta: el backend filtra por `category_id` exacto (no incluye subcategorías), así que un
 * producto de una subcategoría no aparece en la categoría padre. Está anotado en
 * `docs/decisiones/0009-catalogo-y-busqueda.md`.
 */
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const categories = await listCategories();
  const category = categories.ok ? findCategoryBySlug(categories.data, slug) : null;

  if (category === null) {
    return { robots: { index: false, follow: true } };
  }

  const t = await getTranslations({ locale, namespace: "Catalog" });

  return {
    title: category.name,
    description: t("categoryDescription", { name: category.name }),
    alternates: {
      canonical: `/${locale}/c/${category.slug}`,
      languages: Object.fromEntries(
        routing.locales.map((option) => [option, `/${option}/c/${category.slug}`]),
      ),
    },
    robots: { index: true, follow: true },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Catalog");
  const categories = await listCategories();
  const category = categories.ok ? findCategoryBySlug(categories.data, slug) : null;

  if (category === null) {
    notFound();
  }

  const query = parseCatalogQuery(await searchParams);
  const results = await searchProducts({ ...query, categoryId: category.id, cursor: query.cursor });

  const labels = {
    noImage: t("card.noImage"),
    priceUnavailable: t("card.priceUnavailable"),
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">{category.name}</h1>
        <p className="text-muted-foreground">{t("categorySubtitle")}</p>
      </header>

      {!results.ok ? (
        <section className="flex flex-col items-start gap-3 rounded-xl border border-border p-6">
          <h2 className="font-heading text-lg font-semibold">{t("unavailable.title")}</h2>
          <p className="text-muted-foreground">{t("unavailable.description")}</p>
          <Button asChild variant="outline" size="lg">
            <Link href="/search">{t("unavailable.action")}</Link>
          </Button>
        </section>
      ) : results.data.items.length === 0 ? (
        <section className="flex flex-col items-start gap-2 rounded-xl border border-border p-6">
          <h2 className="font-heading text-lg font-semibold">{t("empty.title")}</h2>
          <p className="text-muted-foreground">{t("empty.description")}</p>
          {hasActiveFilters(query) ? (
            <Button asChild variant="outline" size="lg">
              <Link href={catalogHref("/search", query, { categoryId: null, cursor: null })}>
                {t("filters.clear")}
              </Link>
            </Button>
          ) : null}
        </section>
      ) : (
        <>
          <ProductGrid
            items={results.data.items}
            locale={locale}
            currency={defaultCurrency}
            labels={labels}
          />

          {results.data.next_cursor !== null ? (
            <div className="flex justify-center">
              <Button asChild variant="outline" size="lg">
                <Link
                  href={catalogHref(`/c/${category.slug}`, query, {
                    categoryId: category.id,
                    cursor: results.data.next_cursor,
                  })}
                >
                  {t("moreResults")}
                </Link>
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
