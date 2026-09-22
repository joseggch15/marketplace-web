import { ArrowRight, Search, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

import type { CategoryTile } from "../selectors";

/**
 * Portada: buscador protagonista + accesos rápidos a las categorías con más productos.
 *
 * Decisiones de diseño (y por qué):
 * - **El buscador es lo primero y lo más grande.** Es la forma más rápida de llegar a un producto y funciona
 *   sin JavaScript (formulario GET → `?q=…` en la URL).
 * - Los accesos rápidos se construyen con las **facets reales** de la búsqueda (`conteo` incluido): no hay una
 *   lista de categorías inventada ni un botón que no lleve a resultados.
 * - Nada de «estado del sistema» ni de «plan de fases»: al comprador no le dicen nada. El estado técnico vive
 *   en la página interna del sistema de diseño.
 */

export interface HomeHeroLabels {
  title: string;
  subtitle: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchSubmit: string;
  quickLinksLabel: string;
  browseAll: string;
}

export function HomeHero({
  labels,
  tiles,
  searchAction,
}: {
  labels: HomeHeroLabels;
  tiles: CategoryTile[];
  /** Ruta del buscador, ya con el idioma (`/es/search`). */
  searchAction: string;
}) {
  return (
    <section
      aria-labelledby="home-title"
      className="relative overflow-hidden rounded-2xl border border-border bg-card"
    >
      {/* Fondo suave con los tokens del tema: se adapta solo al modo claro y al oscuro. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-surface via-card to-card"
      />

      <div className="relative flex flex-col gap-6 px-5 py-8 sm:px-8 sm:py-12 lg:px-12">
        <div className="flex flex-col gap-3">
          <Badge variant="secondary" className="w-fit">
            <Sparkles aria-hidden className="size-3.5" />
            {labels.subtitle}
          </Badge>
          <h1
            id="home-title"
            className="max-w-3xl font-heading text-3xl font-bold text-balance sm:text-4xl"
          >
            {labels.title}
          </h1>
        </div>

        <form
          action={searchAction}
          method="get"
          role="search"
          className="flex w-full max-w-3xl flex-col gap-2 sm:flex-row"
        >
          <div className="relative w-full">
            <label htmlFor="home-search" className="sr-only">
              {labels.searchLabel}
            </label>
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="home-search"
              name="q"
              type="search"
              autoComplete="off"
              placeholder={labels.searchPlaceholder}
              className="h-12 pl-10 text-base"
            />
          </div>
          <Button type="submit" size="lg" className="h-12 shrink-0 px-6 text-base">
            {labels.searchSubmit}
          </Button>
        </form>

        {tiles.length > 0 ? (
          <nav aria-label={labels.quickLinksLabel} className="flex flex-wrap items-center gap-2">
            {tiles.map((tile) => (
              <Link
                key={tile.id}
                href={`/c/${tile.slug}`}
                className="rounded-full border border-border bg-background/80 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {tile.name}
              </Link>
            ))}
            <Link
              href="/search"
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-brand-text underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {labels.browseAll}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </nav>
        ) : null}
      </div>
    </section>
  );
}
