import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { LoaderCircle, Star } from "lucide-react";

import { CheckoutSteps, CheckoutStepsSkeleton } from "@/components/domain/checkout-steps";
import { DealBadge } from "@/components/domain/deal-badge";
import { ImageGallerySkeleton } from "@/components/domain/image-gallery";
import { OrderTimeline, OrderTimelineSkeleton } from "@/components/domain/order-timeline";
import { Price, PriceSkeleton } from "@/components/domain/price";
import { ProductCard, ProductCardSkeleton } from "@/components/domain/product-card";
import { RatingStars, RatingStarsSkeleton } from "@/components/domain/rating-stars";
import { VariantSelectorSkeleton } from "@/components/domain/variant-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GalleryDemo,
  QuantityDemo,
  VariantDemo,
} from "@/features/design-system/components/interactive-demos";
import { routing } from "@/i18n/routing";

/**
 * Página interna del sistema de diseño (Fase 1).
 *
 * Para qué sirve: ver **todos** los componentes con sus variantes y estados (normal, hover, foco,
 * deshabilitado, cargando, vacío y error), en modo claro y oscuro, a 375 px y 1280 px, y elegir el acento
 * de marca. Es una página de trabajo, así que lleva `noindex` y queda fuera del sitemap.
 *
 * Es un Server Component: solo las demos con estado (variantes, cantidad, galería) son componentes cliente.
 * Los textos salen de `messages/*.json`; no hay ni una cadena visible escrita aquí.
 */

type DesignSystemPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: DesignSystemPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "DesignSystem" });

  return {
    title: t("title"),
    description: t("subtitle"),
    // Página interna: no debe aparecer en buscadores (tampoco está en el sitemap).
    robots: { index: false, follow: false },
  };
}

/** Sección de la página, siempre con su encabezado y su ancla. */
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-title`} className="border-t border-border pt-8">
      <h2 id={`${id}-title`} className="font-heading text-xl font-semibold">
        {title}
      </h2>
      <div className="mt-5 flex flex-col gap-6">{children}</div>
    </section>
  );
}

/** Tarjeta que muestra un caso concreto (un estado) de un componente. */
function Case({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}

/** Muestras de color: los nombres son los tokens que usan los componentes. */
const COLOR_TOKENS = [
  { name: "--background", className: "bg-background border-border" },
  { name: "--foreground", className: "bg-foreground" },
  { name: "--card", className: "bg-card border-border" },
  { name: "--primary", className: "bg-primary" },
  { name: "--primary-foreground", className: "bg-primary-foreground border-border" },
  { name: "--secondary", className: "bg-secondary" },
  { name: "--muted", className: "bg-muted" },
  { name: "--muted-foreground", className: "bg-muted-foreground" },
  { name: "--accent", className: "bg-accent" },
  { name: "--destructive", className: "bg-destructive" },
  { name: "--border", className: "bg-border" },
  { name: "--input", className: "bg-input" },
  { name: "--ring", className: "bg-ring" },
  { name: "--brand (acento)", className: "bg-brand" },
  { name: "--brand-surface", className: "bg-brand-surface" },
  { name: "--success-surface", className: "bg-success-surface" },
  { name: "--success-strong", className: "bg-success-strong" },
  { name: "--warning-surface", className: "bg-warning-surface" },
  { name: "--danger-surface", className: "bg-danger-surface" },
  { name: "--info-surface", className: "bg-info-surface" },
];

export default async function DesignSystemPage({ params }: DesignSystemPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("DesignSystem");
  const tCase = await getTranslations("DesignSystem.caseLabels");
  const tDemo = await getTranslations("DesignSystem.demo");

  const ratingLabel = tDemo("ratingLabel", { average: "4,5", count: "128" });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <header className="flex flex-col gap-2">
        <Badge variant="secondary">{t("internalNote")}</Badge>
        <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
        <p className="max-w-2xl text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="mt-10 flex flex-col gap-10">
        <Section id="colors" title={t("sections.colors")}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {COLOR_TOKENS.map((token) => (
              <li
                key={token.name}
                className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3"
              >
                <span aria-hidden className={`h-10 w-full rounded-md border ${token.className}`} />
                <code className="text-xs text-muted-foreground">{token.name}</code>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="typography" title={t("sections.typography")}>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
            <p className="font-heading text-3xl font-bold">Aa — font-heading (Plus Jakarta Sans)</p>
            <p className="text-lg">Aa — font-sans (Inter) 18 px</p>
            <p className="text-base">Aa — 16 px, texto normal</p>
            <p className="text-sm text-muted-foreground">Aa — 14 px, texto secundario</p>
            <p className="text-xs text-muted-foreground">Aa — 12 px, texto auxiliar</p>
          </div>
        </Section>

        <Section id="accent" title={t("sections.accent")}>
          <p className="max-w-3xl text-sm text-muted-foreground">{t("accent.howToChange")}</p>
          <p className="max-w-3xl text-sm text-muted-foreground">{t("accent.contrastChecked")}</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key: "turquoise", label: t("accent.turquoise"), current: true, value: undefined },
              { key: "coral", label: t("accent.coral"), current: false, value: "coral" },
              { key: "violet", label: t("accent.violet"), current: false, value: "violeta" },
            ].map((preset) => (
              <div
                key={preset.key}
                data-accent={preset.value}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-heading text-sm font-semibold">{preset.label}</p>
                  <Badge variant={preset.current ? "default" : "outline"}>
                    {preset.current ? t("accent.current") : t("accent.alternative")}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-brand-surface px-2 py-0.5 text-xs font-semibold text-brand-text">
                    {t("accent.sampleDiscount")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Star aria-hidden className="size-4 fill-brand text-brand" />
                    <span className="text-xs text-foreground">{t("accent.sampleRating")}</span>
                  </span>
                  <span aria-hidden className="size-6 rounded-md bg-brand" />
                  <span className="text-xs text-brand-text">{t("accent.sampleBadge")}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="buttons" title={t("sections.buttons")}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Case label={tCase("normal")}>
              <Button>{tDemo("addToCart")}</Button>
              <Button variant="secondary">{tDemo("favorite")}</Button>
              <Button variant="outline">{tDemo("favorite")}</Button>
              <Button variant="ghost">{tDemo("favorite")}</Button>
              <Button variant="destructive">{tDemo("outOfStock")}</Button>
              <Button variant="link">{tDemo("addToCart")}</Button>
            </Case>

            <Case label={tCase("disabled")}>
              <Button disabled>{tDemo("addToCart")}</Button>
              <Button variant="outline" disabled>
                {tDemo("favorite")}
              </Button>
            </Case>

            <Case label={tCase("loading")}>
              <Button disabled>
                <LoaderCircle
                  aria-hidden
                  className="size-4 animate-spin motion-reduce:animate-none"
                />
                {tDemo("loading")}
              </Button>
            </Case>

            <Case label={`${tCase("hover")} / ${tCase("focus")}`}>
              {/* Los estados se ven al pasar el ratón o al navegar con Tab; el contenedor marca el foco. */}
              <div className="flex flex-wrap gap-3 rounded-lg p-2 focus-within:ring-2 focus-within:ring-ring">
                <Button variant="outline">{tDemo("favorite")}</Button>
                <Button variant="ghost">{tDemo("addToCart")}</Button>
              </div>
            </Case>
          </div>
        </Section>

        <Section id="fields" title={t("sections.fields")}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Case label={tCase("normal")}>
              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="ds-field-normal" className="text-sm font-medium">
                  {tDemo("quantity")}
                </label>
                <Input id="ds-field-normal" placeholder={tDemo("productTitle")} />
              </div>
            </Case>

            <Case label={tCase("focus")}>
              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="ds-field-focus" className="text-sm font-medium">
                  {tDemo("quantity")}
                </label>
                <Input id="ds-field-focus" />
              </div>
            </Case>

            <Case label={tCase("disabled")}>
              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="ds-field-disabled" className="text-sm font-medium">
                  {tDemo("quantity")}
                </label>
                <Input id="ds-field-disabled" disabled defaultValue="1" />
              </div>
            </Case>

            <Case label={tCase("error")}>
              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="ds-field-error" className="text-sm font-medium">
                  {tDemo("quantity")}
                </label>
                <Input
                  id="ds-field-error"
                  aria-invalid
                  defaultValue="9"
                  aria-describedby="ds-field-error-message"
                />
                <p id="ds-field-error-message" role="alert" className="text-xs text-danger-text">
                  {tDemo("maxReached", { max: "5" })}
                </p>
              </div>
            </Case>
          </div>
        </Section>

        <Section id="badges" title={t("sections.badges")}>
          <Case label={tCase("normal")}>
            <DealBadge kind="free-shipping" label={tDemo("freeShipping")} />
            <DealBadge kind="deal" label={tDemo("deal")} />
            <DealBadge kind="best-seller" label={tDemo("bestSeller")} />
            <DealBadge kind="official" label={tDemo("official")} />
            <DealBadge kind="out-of-stock" label={tDemo("outOfStock")} />
            <Badge>{tDemo("deal")}</Badge>
            <Badge variant="secondary">{tDemo("deal")}</Badge>
            <Badge variant="outline">{tDemo("deal")}</Badge>
            <Badge variant="destructive">{tDemo("outOfStock")}</Badge>
          </Case>
        </Section>

        <Section id="feedback" title={t("sections.feedback")}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Case label={`Price · ${tCase("loading")}`}>
              <PriceSkeleton />
              <PriceSkeleton size="lg" />
            </Case>
            <Case label={`RatingStars · ${tCase("loading")}`}>
              <RatingStarsSkeleton />
            </Case>
            <Case label={`VariantSelector · ${tCase("loading")}`}>
              <VariantSelectorSkeleton />
            </Case>
            <Case label={`CheckoutSteps · ${tCase("loading")}`}>
              <CheckoutStepsSkeleton />
            </Case>
            <Case label={`ImageGallery · ${tCase("loading")}`}>
              <div className="w-full">
                <ImageGallerySkeleton />
              </div>
            </Case>
            <Case label={`ProductCard · ${tCase("loading")}`}>
              <div className="w-full max-w-[200px]">
                <ProductCardSkeleton />
              </div>
            </Case>
            <Case label={`OrderTimeline · ${tCase("loading")}`}>
              <div className="w-full max-w-xs">
                <OrderTimelineSkeleton rows={3} />
              </div>
            </Case>
            <Case label={tCase("empty")}>
              <div className="flex flex-col items-start gap-2">
                <RatingStars
                  average={0}
                  count={0}
                  label=""
                  emptyLabel={tDemo("noReviews")}
                  locale={locale}
                />
                <p className="text-sm text-muted-foreground">{tDemo("galleryNoImage")}</p>
              </div>
            </Case>
            <Case label={tCase("error")}>
              <p role="alert" className="text-sm text-danger-text">
                {tDemo("timelineError")}
              </p>
            </Case>
          </div>
        </Section>

        <Section id="domain" title={t("sections.domain")}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ProductCard
              href="/design-system"
              title={tDemo("productTitle")}
              image={{ src: "/demo/product-1.png", alt: `${tDemo("productTitle")} — 1` }}
              noImageLabel={tDemo("noImage")}
              badges={
                <>
                  <DealBadge kind="free-shipping" label={tDemo("freeShipping")} />
                  <DealBadge kind="deal" label={tDemo("deal")} />
                </>
              }
              rating={
                <RatingStars
                  average={4.5}
                  count={128}
                  label={ratingLabel}
                  emptyLabel={tDemo("noReviews")}
                  locale={locale}
                />
              }
              price={
                <Price
                  amount={125000}
                  currency="COP"
                  locale={locale}
                  compareAt={162000}
                  converted={{ amount: 31.5, currency: "USD" }}
                  unavailableLabel={tDemo("priceUnavailable")}
                />
              }
            />

            <ProductCard
              href="/design-system"
              title={tDemo("productTitleAlt")}
              image={{ src: "/demo/product-2.png", alt: `${tDemo("productTitleAlt")} — 2` }}
              noImageLabel={tDemo("noImage")}
              badges={<DealBadge kind="best-seller" label={tDemo("bestSeller")} />}
              rating={
                <RatingStars
                  average={4.8}
                  count={1024}
                  label={ratingLabel}
                  emptyLabel={tDemo("noReviews")}
                  locale={locale}
                />
              }
              price={
                <Price
                  amount={840000}
                  currency="COP"
                  locale={locale}
                  unavailableLabel={tDemo("priceUnavailable")}
                />
              }
            />

            <ProductCard
              href="/design-system"
              title={tDemo("productTitle")}
              image={{ src: "/demo/product-3.png", alt: `${tDemo("productTitle")} — 3` }}
              noImageLabel={tDemo("noImage")}
              badges={<DealBadge kind="out-of-stock" label={tDemo("outOfStock")} />}
              outOfStock
              outOfStockLabel={tDemo("outOfStock")}
              price={
                <Price
                  amount={89000}
                  currency="COP"
                  locale={locale}
                  unavailableLabel={tDemo("priceUnavailable")}
                />
              }
            />

            {/* Estado "sin imagen": el producto todavía no tiene fotos */}
            <ProductCard
              href="/design-system"
              title={tDemo("productTitleAlt")}
              image={null}
              noImageLabel={tDemo("noImage")}
              price={
                <Price
                  amount={45000}
                  currency="COP"
                  locale={locale}
                  unavailableLabel={tDemo("priceUnavailable")}
                />
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Case label={`Price · ${tCase("normal")}`}>
              <Price
                amount={125000}
                currency="COP"
                locale={locale}
                unavailableLabel={tDemo("priceUnavailable")}
              />
            </Case>
            <Case label={`Price · ${tCase("selected")} (${tDemo("convertedLabel")})`}>
              <Price
                amount={125000}
                currency="COP"
                locale={locale}
                compareAt={162000}
                converted={{ amount: 31.5, currency: "USD" }}
                unavailableLabel={tDemo("priceUnavailable")}
              />
            </Case>
            <Case label={`Price · ${tCase("empty")}`}>
              <Price
                amount="—"
                currency="COP"
                locale={locale}
                unavailableLabel={tDemo("priceUnavailable")}
              />
            </Case>
            <Case label={`RatingStars · ${tCase("normal")}`}>
              <RatingStars
                average={4.5}
                count={128}
                label={ratingLabel}
                emptyLabel={tDemo("noReviews")}
                locale={locale}
                size="md"
              />
            </Case>
            <Case label={`RatingStars · ${tCase("empty")}`}>
              <RatingStars
                average={0}
                count={0}
                label=""
                emptyLabel={tDemo("noReviews")}
                locale={locale}
              />
            </Case>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
              <h3 className="font-heading text-sm font-semibold">
                <code>VariantSelector</code>
              </h3>
              <VariantDemo
                labels={{
                  colorGroup: tDemo("colorGroup"),
                  sizeGroup: tDemo("sizeGroup"),
                  unavailable: tDemo("variantUnavailable"),
                  colorBlack: tDemo("colorBlack"),
                  colorIvory: tDemo("colorIvory"),
                  sizeSmall: tDemo("sizeSmall"),
                  sizeMedium: tDemo("sizeMedium"),
                  sizeLarge: tDemo("sizeLarge"),
                  errorMessage: tDemo("variantsError"),
                }}
              />
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
              <h3 className="font-heading text-sm font-semibold">
                <code>QuantityStepper</code>
              </h3>
              <QuantityDemo
                labels={{
                  quantity: tDemo("quantity"),
                  decrement: tDemo("decrease"),
                  increment: tDemo("increase"),
                  maxMessage: tDemo("maxReached", { max: 5 }),
                  minMessage: tDemo("minReached", { min: 1 }),
                }}
              />
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 lg:col-span-2">
              <h3 className="font-heading text-sm font-semibold">
                <code>ImageGallery</code>
              </h3>
              <GalleryDemo
                labels={{
                  previous: tDemo("galleryPrevious"),
                  next: tDemo("galleryNext"),
                  thumbnail: tDemo("galleryThumbnail"),
                  noImage: tDemo("galleryNoImage"),
                  loadError: tDemo("galleryLoadError"),
                  alt: tDemo("productTitle"),
                }}
              />
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
              <h3 className="font-heading text-sm font-semibold">
                <code>CheckoutSteps</code>
              </h3>
              <CheckoutSteps
                steps={[
                  { id: "cart", label: tDemo("stepsCart") },
                  { id: "data", label: tDemo("stepsData") },
                  { id: "payment", label: tDemo("stepsPayment") },
                  { id: "done", label: tDemo("stepsDone") },
                ]}
                currentIndex={1}
                completedLabel={tDemo("stepsCompleted")}
                currentLabel={tDemo("stepsCurrent")}
              />
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
              <h3 className="font-heading text-sm font-semibold">
                <code>OrderTimeline</code>
              </h3>
              <OrderTimeline
                items={[
                  { id: "created", label: tDemo("timelineCreated"), date: "2026-03-10T15:04:00Z" },
                  { id: "paid", label: tDemo("timelinePaid"), date: "2026-03-10T15:12:00Z" },
                  { id: "shipped", label: tDemo("timelineShipped"), date: "2026-03-11T09:30:00Z" },
                  { id: "delivered", label: tDemo("timelineDelivered"), date: null },
                ]}
                states={["done", "done", "current", "upcoming"]}
                locale={locale}
                pendingDateLabel={tDemo("timelinePendingDate")}
              />
              <OrderTimeline
                items={[
                  {
                    id: "cancelled",
                    label: tDemo("timelineCancelled"),
                    date: "2026-03-12T10:00:00Z",
                  },
                ]}
                states={["failed"]}
                locale={locale}
                pendingDateLabel={tDemo("timelinePendingDate")}
              />
              {/* Estado de error de la línea de tiempo */}
              <OrderTimeline
                items={[
                  { id: "created", label: tDemo("timelineCreated"), date: "2026-03-10T15:04:00Z" },
                ]}
                states={["done"]}
                locale={locale}
                pendingDateLabel={tDemo("timelinePendingDate")}
                errorMessage={tDemo("timelineError")}
              />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
