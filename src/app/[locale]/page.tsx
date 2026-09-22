import type { Metadata } from "next";
import { Suspense } from "react";
import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/domain/json-ld";
import { StateCard } from "@/components/domain/state-card";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { listCategories, searchProducts } from "@/features/catalog/api";
import { HomeHero } from "@/features/catalog/components/home-hero";
import { CategoryTiles, SectionHeader } from "@/features/catalog/components/home-sections";
import {
  ProductGrid,
  ProductGridSkeleton,
  type ProductGridLabels,
} from "@/features/catalog/components/product-grid";
import { DEFAULT_LIMIT, EMPTY_CATALOG_QUERY } from "@/features/catalog/params";
import { categoryTiles, topSoldItems } from "@/features/catalog/selectors";
import { Link } from "@/i18n/navigation";
import { defaultCurrency, routing } from "@/i18n/routing";
import { env } from "@/lib/env";

/**
 * Portada de la tienda (`/es`).
 *
 * Qué muestra y de dónde sale cada dato (todo real, nada de ejemplo):
 * - **Buscador protagonista** en el héroe + accesos rápidos a las categorías con productos.
 * - **Categorías** con su conteo real, tomado de las *facets* de `/catalog/search` y cruzado con
 *   `/catalog/categories` para tener la URL bonita (`/c/<slug>`).
 * - **Destacados**: lo más reciente del catálogo (`sort=newest`), con precio, reputación, tienda y unidades
 *   vendidas cuando existen.
 * - **Más vendidos**: se pide una página amplia por relevancia y se ordena por `sold_count` real (ver
 *   `topSoldItems`). La sección lo dice con números a la vista, no con una promesa de «lo más vendido de la
 *   tienda»: la API no tiene un orden `best_selling`.
 *
 * Lo que **no** aparece (a propósito): el estado técnico del backend ni el plan de fases. Al comprador no le
 * dicen nada; el estado del sistema vive en `/design-system`, que es una página interna.
 *
 * Estados: carga (esqueletos con la forma final, sección por sección), vacío (catálogo sin publicar, con una
 * acción sugerida), error (el backend no responde, explicado sin romper) y éxito.
 *
 * SEO: `canonical` y `hreflang` vienen del layout del idioma, y aquí se añade el JSON-LD del sitio con la
 * acción de búsqueda, para que Google entienda que hay un buscador.
 */

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

/** Cuántos productos muestra cada sección de la portada. */
const SECTION_SIZE = 8;

/** Página amplia de la que se sacan los «más vendidos» (se ordena en el servidor, sin JavaScript). */
const BEST_SELLERS_POOL = 24;

export async function generateMetadata(): Promise<Metadata> {
  // El layout del idioma ya define título, descripción y `hreflang`; aquí solo se fija el `canonical`.
  return { alternates: { canonical: "/" } };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  // El idioma se valida antes de usarlo: si la URL trae algo raro (`/xx`), la página no existe.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const [t, activeLocale] = await Promise.all([getTranslations("Home"), getLocale()]);

  const labels: ProductGridLabels = {
    noImage: t("card.noImage"),
    priceUnavailable: t("card.priceUnavailable"),
    ratingLabel: (rating: string, count: number) => t("card.ratingLabel", { rating, count }),
    ratingEmpty: t("card.ratingEmpty"),
    soldLabel: (count: number) => t("card.sold", { count }),
    storeLabel: (store: string) => t("card.store", { store }),
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 sm:py-8">
      <Suspense fallback={<HomeHeroSkeleton />}>
        <HeroSection locale={activeLocale} />
      </Suspense>

      <Suspense fallback={<CategoriesSkeleton title={t("categories.title")} />}>
        <CategoriesSection />
      </Suspense>

      <Suspense
        fallback={
          <SectionSkeleton
            id="featured-title"
            title={t("featured.title")}
            subtitle={t("featured.subtitle")}
          />
        }
      >
        <FeaturedSection
          locale={activeLocale}
          title={t("featured.title")}
          subtitle={t("featured.subtitle")}
          seeAll={t("featured.seeAll")}
          labels={labels}
        />
      </Suspense>

      <Suspense
        fallback={
          <SectionSkeleton
            id="best-sellers-title"
            title={t("bestSellers.title")}
            subtitle={t("bestSellers.subtitle")}
          />
        }
      >
        <BestSellersSection
          locale={activeLocale}
          title={t("bestSellers.title")}
          subtitle={t("bestSellers.subtitle")}
          note={t("bestSellers.note")}
          badge={t("bestSellers.badge")}
          labels={labels}
        />
      </Suspense>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: brand.name,
          url: `${env.NEXT_PUBLIC_SITE_URL}/${locale}`,
          potentialAction: {
            "@type": "SearchAction",
            target: `${env.NEXT_PUBLIC_SITE_URL}/${locale}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />
    </div>
  );
}

/**
 * Héroe: buscador y accesos rápidos. Los accesos usan las facets reales, así que van en su propio
 * `Suspense`: la portada se ve al instante y esta sección aparece en cuanto el backend responde.
 */
async function HeroSection({ locale }: { locale: string }) {
  const [t, results, categories] = await Promise.all([
    getTranslations("Home"),
    searchProducts(EMPTY_CATALOG_QUERY, DEFAULT_LIMIT),
    listCategories(),
  ]);

  const tiles =
    results.ok && categories.ok
      ? categoryTiles(results.data.facets.categories, categories.data, 6)
      : [];

  return (
    <HomeHero
      searchAction={`/${locale}/search`}
      tiles={tiles}
      labels={{
        title: t("hero.title"),
        subtitle: t("hero.subtitle"),
        searchLabel: t("hero.searchLabel"),
        searchPlaceholder: t("hero.searchPlaceholder"),
        searchSubmit: t("hero.searchSubmit"),
        quickLinksLabel: t("hero.quickLinksLabel"),
        browseAll: t("hero.browseAll"),
      }}
    />
  );
}

/** Categorías con su conteo real. Si el backend no responde (o no hay categorías con productos), no se pinta. */
async function CategoriesSection() {
  const [t, results, categories] = await Promise.all([
    getTranslations("Home"),
    searchProducts(EMPTY_CATALOG_QUERY, DEFAULT_LIMIT),
    listCategories(),
  ]);

  if (!results.ok || !categories.ok) {
    return null;
  }

  const tiles = categoryTiles(results.data.facets.categories, categories.data);

  if (tiles.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="categories-title" className="flex flex-col gap-4">
      <SectionHeader
        id="categories-title"
        title={t("categories.title")}
        subtitle={t("categories.subtitle")}
      />
      <CategoryTiles
        tiles={tiles}
        countLabel={(count: number) => t("categories.count", { count })}
      />
    </section>
  );
}

/** Lo más reciente del catálogo. */
async function FeaturedSection({
  locale,
  title,
  subtitle,
  seeAll,
  labels,
}: {
  locale: string;
  title: string;
  subtitle: string;
  seeAll: string;
  labels: ProductGridLabels;
}) {
  const t = await getTranslations("Home");
  const results = await searchProducts({ ...EMPTY_CATALOG_QUERY, sort: "newest" }, SECTION_SIZE);

  if (!results.ok) {
    return (
      <section aria-labelledby="featured-title" className="flex flex-col gap-4">
        <SectionHeader id="featured-title" title={title} subtitle={subtitle} />
        <StateCard
          tone="danger"
          title={t("unavailable.title")}
          description={t("unavailable.description")}
          action={
            <Button asChild variant="outline" size="lg">
              <Link href="/search">{t("unavailable.action")}</Link>
            </Button>
          }
        />
      </section>
    );
  }

  if (results.data.items.length === 0) {
    return (
      <section aria-labelledby="featured-title" className="flex flex-col gap-4">
        <SectionHeader id="featured-title" title={title} subtitle={subtitle} />
        <StateCard
          title={t("empty.title")}
          description={t("empty.description")}
          action={
            <Button asChild variant="outline" size="lg">
              <Link href="/search">{t("empty.action")}</Link>
            </Button>
          }
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="featured-title" className="flex flex-col gap-4">
      <SectionHeader
        id="featured-title"
        title={title}
        subtitle={subtitle}
        href="/search?sort=newest"
        linkLabel={seeAll}
      />
      <ProductGrid
        items={results.data.items}
        locale={locale}
        currency={defaultCurrency}
        labels={labels}
      />
    </section>
  );
}

/** Más vendidos por unidades reales dentro de la página pedida (ver `topSoldItems`). */
async function BestSellersSection({
  locale,
  title,
  subtitle,
  note,
  badge,
  labels,
}: {
  locale: string;
  title: string;
  subtitle: string;
  note: string;
  badge: string;
  labels: ProductGridLabels;
}) {
  const results = await searchProducts(EMPTY_CATALOG_QUERY, BEST_SELLERS_POOL);

  if (!results.ok) {
    return null;
  }

  const items = topSoldItems(results.data.items, SECTION_SIZE);

  // Sin unidades vendidas no hay sección: un «más vendidos» sin ventas no informa de nada.
  if (items.length === 0 || items[0].sold_count === 0) {
    return null;
  }

  /** Solo los tres primeros llevan la insignia; el resto muestra las unidades vendidas, que es el dato real. */
  const badged = new Set(items.slice(0, 3).map((item) => item.id));

  return (
    <section aria-labelledby="best-sellers-title" className="flex flex-col gap-4">
      <SectionHeader
        id="best-sellers-title"
        title={title}
        subtitle={subtitle}
        href="/search"
        linkLabel={note}
      />
      <ProductGrid
        items={items}
        locale={locale}
        currency={defaultCurrency}
        labels={labels}
        badgeFor={(item) => (badged.has(item.id) ? { kind: "best-seller", label: badge } : null)}
      />
    </section>
  );
}

/** Estado de carga del héroe: la misma forma final, para que la página no salte. */
function HomeHeroSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-8 sm:px-8 sm:py-12">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="h-5 w-44 animate-pulse rounded-full bg-muted" />
          <div className="h-9 w-full max-w-3xl animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-12 w-full max-w-3xl animate-pulse rounded-lg bg-muted" />
        <div className="flex flex-wrap gap-2">
          <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-28 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

/** Estado de carga de las categorías. */
function CategoriesSkeleton({ title }: { title: string }) {
  return (
    <section aria-labelledby="categories-title" className="flex flex-col gap-4">
      <SectionHeader id="categories-title" title={title} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl border border-border bg-muted"
          />
        ))}
      </div>
    </section>
  );
}

/** Estado de carga de una sección de productos: encabezado real + tarjetas con la silueta final. */
function SectionSkeleton({
  id,
  title,
  subtitle,
}: {
  id: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <SectionHeader id={id} title={title} subtitle={subtitle} />
      <ProductGridSkeleton count={4} />
    </section>
  );
}
