import { ArrowRight, Package } from "lucide-react";

import { Link } from "@/i18n/navigation";

import type { CategoryTile } from "../selectors";

/**
 * Encabezado de una sección de la portada (presentación).
 *
 * Siempre lleva un `h2` real con `id` para que la sección se pueda etiquetar con `aria-labelledby`, y el
 * enlace «ver todo» es opcional: si la sección no tiene más páginas, no se pinta un enlace que no lleva a
 * ninguna parte.
 */
export function SectionHeader({
  id,
  title,
  subtitle,
  href,
  linkLabel,
}: {
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="font-heading text-xl font-semibold sm:text-2xl">
          {title}
        </h2>
        {subtitle === undefined ? null : (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {href !== undefined && linkLabel !== undefined ? (
        <Link
          href={href}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-brand-text underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {linkLabel}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

/**
 * Categorías con el **conteo real** de productos publicados.
 *
 * El número viene de las facets de la búsqueda (`/catalog/search`), así que si una categoría no tiene
 * productos publicados no aparece: nunca se muestra un «(0)» que engañe.
 */
export function CategoryTiles({
  tiles,
  countLabel,
  className,
}: {
  tiles: CategoryTile[];
  countLabel: (count: number) => string;
  className?: string;
}) {
  return (
    <ul className={className ?? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"}>
      {tiles.map((tile) => (
        <li key={tile.id}>
          <Link
            href={`/c/${tile.slug}`}
            className="group flex h-full flex-col justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-brand hover:bg-brand-surface/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground group-hover:bg-background"
              >
                <Package className="size-4" />
              </span>
              <span className="font-heading text-sm font-semibold">{tile.name}</span>
            </span>
            <span className="text-xs text-muted-foreground">{countLabel(tile.count)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
