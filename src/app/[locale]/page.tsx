import { Suspense } from "react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { PlatformStatusCard } from "@/features/health/components/platform-status-card";
import { PlatformStatusSkeleton } from "@/features/health/components/platform-status-skeleton";
import { routing } from "@/i18n/routing";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Portada de la Fase 0.
 *
 * Qué muestra y por qué:
 * - El **estado real** del backend (endpoint `/api/v1/health`), con su esqueleto de carga. Así se ve que
 *   la F0 está conectada de verdad, sin datos inventados.
 * - El plan de las siguientes fases, para que quede claro qué falta.
 *
 * El catálogo real llega en la F3.
 */
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  // El idioma se valida antes de usarlo: si la URL trae algo raro (`/xx`), la página no existe.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Home");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:py-14">
      <section aria-labelledby="hero-title" className="max-w-3xl">
        <Badge variant="secondary">{t("badge")}</Badge>
        <h1 id="hero-title" className="mt-4 font-heading text-3xl font-bold sm:text-4xl">
          {t("heroTitle")}
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">{t("heroSubtitle")}</p>
      </section>

      <section aria-labelledby="status-title" className="mt-10 max-w-2xl">
        <h2 id="status-title" className="font-heading text-xl font-semibold">
          {t("systemTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("systemSubtitle")}</p>
        <div className="mt-4">
          <Suspense fallback={<PlatformStatusSkeleton />}>
            <PlatformStatusCard />
          </Suspense>
        </div>
      </section>

      <section aria-labelledby="roadmap-title" className="mt-10 max-w-2xl">
        <h2 id="roadmap-title" className="font-heading text-xl font-semibold">
          {t("roadmapTitle")}
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>{t("roadmapItem1")}</li>
          <li>{t("roadmapItem2")}</li>
          <li>{t("roadmapItem3")}</li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">{t("roadmapNote")}</p>
      </section>
    </div>
  );
}
