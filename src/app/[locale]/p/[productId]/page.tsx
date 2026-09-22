import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Breadcrumbs, type BreadcrumbItem } from "@/components/domain/breadcrumbs";
import { DealBadge } from "@/components/domain/deal-badge";
import { ImageGallery } from "@/components/domain/image-gallery";
import { JsonLd } from "@/components/domain/json-ld";
import { RatingStars } from "@/components/domain/rating-stars";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/session";
import { listCategories } from "@/features/catalog/api";
import {
  QUESTIONS_PAGE_SIZE,
  REVIEWS_PAGE_SIZE,
  fetchAvailability,
  fetchProduct,
  fetchProductBySlug,
  fetchQuestions,
  fetchReviews,
} from "@/features/product/api";
import { PurchasePanel } from "@/features/product/components/purchase-panel";
import { QuestionForm } from "@/features/product/components/question-form";
import { QuestionsSection } from "@/features/product/components/questions-section";
import { ReviewsSection } from "@/features/product/components/reviews-section";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/features/product/json-ld";
import {
  isProductId,
  isProductRef,
  parseReviewsCursor,
  reviewsHref,
} from "@/features/product/params";
import {
  galleryImages,
  isOutOfStock,
  summarizeText,
  totalAvailable,
} from "@/features/product/selectors";
import { Link } from "@/i18n/navigation";
import { defaultCurrency, routing } from "@/i18n/routing";
import { env } from "@/lib/env";
import { toAmount } from "@/lib/format/money";

/**
 * Página de producto (`/es/p/{slug}` o `/es/p/{identificador}`).
 *
 * Las dos formas valen: el **slug** es la URL bonita que se comparte y se indexa (y la que usa el
 * `sitemap.xml`), y el **identificador** se sigue aceptando para que ningún enlace antiguo se rompa. El
 * `canonical` apunta siempre al slug, así que un producto tiene una sola dirección a ojos de un buscador.
 *
 * Todo lo que se ve sale de la API:
 * - El producto, sus variantes y sus imágenes (`/catalog/products/{id}`).
 * - El **stock real** de cada variante (`/inventory/items/{variant_id}`). Si no se puede comprobar, se dice.
 * - La nota media y las reseñas, y las preguntas con las respuestas del vendedor.
 *
 * Lo que **no** se muestra porque la API pública todavía no lo devuelve: el nombre y la reputación de la
 * tienda, y los datos de envío. Están pedidos en `docs/PENDIENTES-BACKEND.md` (apartados 10 y 11).
 *
 * Cuatro estados, como en el resto del proyecto: éxito (la ficha completa), vacío (producto sin imágenes, sin
 * reseñas o sin preguntas), error (el backend no responde → aviso traducido) y no encontrado (producto
 * inexistente → 404 real, no un 200 con texto de "no existe").
 *
 * **No hay `loading.tsx` a propósito**: al añadirlo, Next.js empieza a enviar la página en streaming y el
 * estado HTTP se fija en 200 **antes** de resolverse el `notFound()`, así que un producto que no existe
 * respondería 200 (un «soft 404», que Google penaliza). El 404 correcto vale más que un esqueleto de carga
 * que aquí duraría milisegundos.
 */

type ProductPageProps = {
  params: Promise<{ locale: string; productId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * El producto se pide **una sola vez por visita**: `generateMetadata` y la página comparten el resultado.
 * Sin esto, cada visita haría dos peticiones al backend para lo mismo.
 */
const loadProduct = cache((ref: string) =>
  isProductId(ref) ? fetchProduct(ref) : fetchProductBySlug(ref),
);

/** URL canónica de la ficha (sin el cursor de reseñas): es la misma página, no una distinta. */
function productCanonical(locale: string, productId: string): string {
  return `/${locale}/p/${productId}`;
}

/**
 * URL absoluta de una ruta interna, **sin barra final** para que coincida exactamente con el `canonical`.
 * Se usa para los datos estructurados, que exigen URLs completas (`https://…`).
 */
function absoluteUrl(locale: string, path: string): string {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const cleanPath = path === "/" ? "" : path;

  return `${base}/${locale}${cleanPath}`;
}

/**
 * URL absoluta de un archivo servido por nuestro proxy de medios.
 *
 * Ojo: `/api/media/...` **no** lleva el prefijo del idioma (es una ruta de la API, no una página), así que no
 * se puede usar `absoluteUrl` aquí: saldría `/es/api/media/...`, que no existe.
 */
function absoluteMediaUrl(src: string): string {
  return `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}${src}`;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale, productId } = await params;

  if (!hasLocale(routing.locales, locale) || !isProductRef(productId)) {
    return { robots: { index: false, follow: true } };
  }

  const result = await loadProduct(productId);

  if (!result.ok) {
    // Sin datos no hay nada que ofrecer a un buscador: se deja que la página decida su estado.
    return { robots: { index: false, follow: true } };
  }

  const product = result.data;
  const t = await getTranslations({ locale, namespace: "Product" });
  const description = product.description?.trim() ?? "";
  const summary =
    description.length > 0
      ? summarizeText(description)
      : t("meta.description", { title: product.title });
  // La canónica es siempre la **URL por slug**, aunque se haya llegado por identificador: una sola dirección
  // por producto, que es lo que evita contenido duplicado en los buscadores.
  const canonical = productCanonical(locale, product.slug);
  const image = galleryImages(product)[0]?.src;

  return {
    title: product.title,
    description: summary,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((option) => [option, productCanonical(option, product.slug)]),
      ),
    },
    openGraph: {
      type: "website",
      title: product.title,
      description: summary,
      ...(image === undefined ? {} : { images: [{ url: image, alt: product.title }] }),
    },
    robots: { index: true, follow: true },
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { locale, productId } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  // Una dirección como `/p/hola` (ni identificador ni slug) no tiene por qué llegar al backend.
  if (!isProductRef(productId)) {
    notFound();
  }

  const t = await getTranslations("Product");
  const result = await loadProduct(productId);

  if (!result.ok && result.reason === "not_found") {
    notFound();
  }

  if (!result.ok) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-4 py-10">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">{t("unavailable.title")}</h1>
        <p className="text-muted-foreground">{t("unavailable.description")}</p>
        <Button asChild variant="outline" size="lg">
          <Link href="/">{t("unavailable.action")}</Link>
        </Button>
      </div>
    );
  }

  const product = result.data;
  const variants = product.variants ?? [];
  const reviewsCursor = parseReviewsCursor(await searchParams);

  // Todo se pide en paralelo: la ficha no depende de las reseñas ni de las preguntas.
  const [availability, reviews, questions, categories, user] = await Promise.all([
    fetchAvailability(variants.map((variant) => variant.id)),
    fetchReviews(product.id, { limit: REVIEWS_PAGE_SIZE, cursor: reviewsCursor }),
    fetchQuestions(product.id, { limit: QUESTIONS_PAGE_SIZE }),
    listCategories(),
    getCurrentUser(),
  ]);

  const gallery = galleryImages(product);
  const stock = availability.ok ? totalAvailable(availability.data) : null;
  const reviewData = reviews.ok ? reviews.data : null;
  const average = reviewData === null ? null : toAmount(reviewData.rating_average);
  const hasReviews = average !== null && reviewData !== null && reviewData.rating_count > 0;
  const category = categories.ok
    ? (categories.data.find((item) => item.id === product.category_id) ?? null)
    : null;

  const productPath = `/p/${product.slug}`;
  const productUrl = absoluteUrl(locale, productPath);
  const numberFormat = new Intl.NumberFormat(locale);
  const ratingFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const labels = {
    ratingEmpty: t("rating.empty"),
    outOfStock: t("stock.outOfStock"),
  };

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t("home"), href: "/" },
    ...(category === null ? [] : [{ label: category.name, href: `/c/${category.slug}` }]),
    { label: product.title },
  ];

  const ratingLabel =
    hasReviews && average !== null && reviewData !== null
      ? t("rating.label", {
          average: ratingFormat.format(average),
          count: numberFormat.format(reviewData.rating_count),
        })
      : labels.ratingEmpty;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <Breadcrumbs items={breadcrumbItems} label={t("breadcrumbLabel")} />

      <div className="grid gap-8 lg:grid-cols-2">
        <ImageGallery
          images={gallery}
          labels={{
            previous: t("gallery.previous"),
            next: t("gallery.next"),
            thumbnail: t("gallery.thumbnail"),
            noImage: t("gallery.noImage"),
            loadError: t("gallery.loadError"),
          }}
        />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">{product.title}</h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {product.brand !== null && product.brand.trim().length > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("brand", { brand: product.brand })}
                </p>
              ) : null}
              {isOutOfStock(variants, availability.ok ? availability.data : null) ? (
                <DealBadge kind="out-of-stock" label={labels.outOfStock} />
              ) : null}
            </div>

            {hasReviews && average !== null && reviewData !== null ? (
              <RatingStars
                average={average}
                count={reviewData.rating_count}
                label={ratingLabel}
                emptyLabel={labels.ratingEmpty}
                locale={locale}
                size="md"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{labels.ratingEmpty}</p>
            )}
          </div>

          <PurchasePanel
            variants={variants}
            availability={availability.ok ? availability.data : null}
            currency={defaultCurrency}
            locale={locale}
          />

          <section aria-labelledby="description-title" className="flex flex-col gap-2">
            <h2 id="description-title" className="font-heading text-lg font-semibold">
              {t("descriptionTitle")}
            </h2>
            {product.description !== null && product.description.trim().length > 0 ? (
              <p className="text-sm whitespace-pre-line text-muted-foreground">
                {product.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noDescription")}</p>
            )}
          </section>
        </div>
      </div>

      <ReviewsSection
        reviews={reviewData}
        locale={locale}
        labels={{
          title: t("reviews.title"),
          average: ratingLabel,
          empty: t("reviews.empty"),
          unavailable: t("reviews.unavailable"),
          verified: t("reviews.verified"),
          ratingOf: (rating: number) =>
            t("reviews.rating", { rating: numberFormat.format(rating) }),
          more: t("reviews.more"),
          reset: t("reviews.reset"),
        }}
        moreHref={
          reviewData !== null && reviewData.next_cursor !== null
            ? reviewsHref(productPath, reviewData.next_cursor)
            : null
        }
        resetHref={reviewsCursor === null ? null : productPath}
      />

      <QuestionsSection
        questions={questions.ok ? questions.data : null}
        locale={locale}
        labels={{
          title: t("questions.title"),
          empty: t("questions.empty"),
          unavailable: t("questions.unavailable"),
          sellerAnswer: t("questions.sellerAnswer"),
        }}
      >
        {user === null ? (
          <div className="flex flex-col items-start gap-2 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">{t("questions.signInToAsk")}</p>
            <Button asChild size="lg" className="w-full sm:w-fit">
              <Link href={`/login?next=${encodeURIComponent(productPath)}`}>
                {t("questions.signIn")}
              </Link>
            </Button>
          </div>
        ) : (
          <QuestionForm productId={product.id} />
        )}
      </QuestionsSection>

      <JsonLd
        data={buildProductJsonLd({
          title: product.title,
          description: product.description,
          brand: product.brand,
          // El SKU solo representa al producto cuando hay una única variante.
          sku: variants.length === 1 ? (variants[0]?.sku ?? null) : null,
          url: productUrl,
          images: gallery.map((image) => absoluteMediaUrl(image.src)),
          variants,
          currency: defaultCurrency,
          availableUnits: stock,
          rating:
            hasReviews && average !== null && reviewData !== null
              ? { average, count: reviewData.rating_count }
              : null,
        })}
      />

      <JsonLd
        data={buildBreadcrumbJsonLd(
          breadcrumbItems.map((item) => ({
            name: item.label,
            url: new URL(
              `/${locale}${item.href ?? productPath}`,
              env.NEXT_PUBLIC_SITE_URL,
            ).toString(),
          })),
        )}
      />
    </div>
  );
}
