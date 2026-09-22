import { Search } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type SearchPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
};

/**
 * Página de búsqueda **provisional** de la Fase 0.
 *
 * Existe por dos motivos: que la barra de búsqueda del encabezado no lleve a un 404, y dejar ya montado
 * el patrón que exige el proyecto: la consulta vive en la **URL** (`?q=`), no en el estado del componente.
 * La búsqueda real, con filtros por faceta, paginación por cursor y autocompletado, llega en la F3
 * (`GET /api/v1/catalog/search`).
 */
export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Search");
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <Search aria-hidden className="size-10 text-muted-foreground" />
      <h1 className="mt-4 font-heading text-2xl font-bold sm:text-3xl">{t("comingSoonTitle")}</h1>
      {query.length > 0 ? (
        <p className="mt-2 text-muted-foreground">{t("comingSoonDescription", { query })}</p>
      ) : (
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      )}
      <Button asChild variant="outline" size="lg" className="mt-6">
        <Link href="/">{t("backHome")}</Link>
      </Button>
    </div>
  );
}
