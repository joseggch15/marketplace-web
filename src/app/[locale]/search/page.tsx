import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { listCategories, searchProducts } from "@/features/catalog/api";
import { ProductGrid } from "@/features/catalog/components/product-grid";
import { SearchFilters } from "@/features/catalog/components/search-filters";
import { catalogHref, hasActiveFilters, parseCatalogQuery } from "@/features/catalog/params";
import { topLevelCategories } from "@/features/catalog/selectors";
import { Link } from "@/i18n/navigation";
import { defaultCurrency, routing } from "@/i18n/routing";

/**
 * Página de resultados (`/es/search?q=…&sort=…`).
 *
 * `noindex`: el buscador no debe llenar los índices de Google con combinaciones de filtros. Lo que sí se
 * indexa son las categorías (`/c/…`), que tienen contenido propio.
 */
export const metadata: Metadata = { robots: { index: false, follow: true } };

type SearchPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Catalog");
  const query = parseCatalogQuery(await searchParams);

  const [results, categories] = await Promise.all([searchProducts(query), listCategories()]);
  const filterCategories = categories.ok ? topLevelCategories(categories.data) : [];
  const labels = {
    noImage: t("card.noImage"),
    priceUnavailable: t("card.priceUnavailable"),
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">
          {query.q.length > 0 ? t("resultsFor", { query: query.q }) : t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </header>

      <SearchFilters query={query} categories={filterCategories} />

      {!results.ok ? (
        <section className="flex flex-col items-start gap-3 rounded-xl border border-border p-6">
          <h2 className="font-heading text-lg font-semibold">{t("unavailable.title")}</h2>
          <p className="text-muted-foreground">{t("unavailable.description")}</p>
          <Button asChild variant="outline" size="lg">
            <Link href="/">{t("unavailable.action")}</Link>
          </Button>
        </section>
      ) : results.data.items.length === 0 ? (
        <section className="flex flex-col items-start gap-2 rounded-xl border border-border p-6">
          <h2 className="font-heading text-lg font-semibold">{t("empty.title")}</h2>
          <p className="text-muted-foreground">{t("empty.description")}</p>
          {hasActiveFilters(query) ? (
            <Button asChild variant="outline" size="lg">
              <Link href="/search">{t("filters.clear")}</Link>
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
                <Link href={catalogHref("/search", query, { cursor: results.data.next_cursor })}>
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
