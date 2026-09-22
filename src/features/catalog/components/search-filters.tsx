"use client";

import { Search as SearchIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";

import type { Category } from "../api";
import {
  DEFAULT_SORT,
  EMPTY_CATALOG_QUERY,
  SORT_OPTIONS,
  catalogHref,
  normalizePrice,
  priceRangeIsInvalid,
  type CatalogQuery,
  type SortOption,
} from "../params";

/**
 * Filtros del catálogo.
 *
 * Al enviar, **no** se filtran los resultados en el navegador: se navega a una URL con los filtros
 * (`/es/search?q=…&category_id=…`). Así la búsqueda es compartible, el botón "atrás" funciona y los
 * resultados los renderiza el servidor (mejor para SEO y para el primer pintado).
 *
 * El cursor se descarta al cambiar cualquier filtro: un cursor de la búsqueda anterior no significa nada con
 * otros criterios.
 */
export function SearchFilters({
  query,
  categories,
}: {
  query: CatalogQuery;
  categories: Category[];
}) {
  const t = useTranslations("Catalog");
  const router = useRouter();

  const [text, setText] = useState(query.q);
  const [categoryId, setCategoryId] = useState(query.categoryId ?? "");
  const [brand, setBrand] = useState(query.brand ?? "");
  const [minPrice, setMinPrice] = useState(query.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(query.maxPrice ?? "");
  const [sort, setSort] = useState<SortOption>(query.sort);
  const [rangeError, setRangeError] = useState(false);

  function apply(next: Partial<CatalogQuery>) {
    const draft: CatalogQuery = {
      q: text,
      categoryId: categoryId.length > 0 ? categoryId : null,
      brand: brand.trim().length > 0 ? brand.trim() : null,
      minPrice: normalizePrice(minPrice),
      maxPrice: normalizePrice(maxPrice),
      sort,
      cursor: null,
      ...next,
    };

    if (priceRangeIsInvalid(draft)) {
      setRangeError(true);
      return;
    }

    setRangeError(false);
    router.push(catalogHref("/search", EMPTY_CATALOG_QUERY, draft));
  }

  function reset() {
    setText("");
    setCategoryId("");
    setBrand("");
    setMinPrice("");
    setMaxPrice("");
    setSort(DEFAULT_SORT);
    setRangeError(false);
    router.push("/search");
  }

  return (
    <form
      aria-label={t("filters.title")}
      className="flex flex-col gap-4 rounded-xl border border-border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        apply({});
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="catalog-q">{t("filters.query")}</Label>
          <Input
            id="catalog-q"
            name="q"
            type="search"
            value={text}
            placeholder={t("filters.queryPlaceholder")}
            onChange={(event) => setText(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="catalog-category">{t("filters.category")}</Label>
          <select
            id="catalog-category"
            name="category_id"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">{t("filters.anyCategory")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="catalog-brand">{t("filters.brand")}</Label>
          <Input
            id="catalog-brand"
            name="brand"
            value={brand}
            placeholder={t("filters.brandPlaceholder")}
            onChange={(event) => setBrand(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="catalog-min-price">{t("filters.minPrice")}</Label>
          <Input
            id="catalog-min-price"
            name="min_price"
            inputMode="decimal"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="catalog-max-price">{t("filters.maxPrice")}</Label>
          <Input
            id="catalog-max-price"
            name="max_price"
            inputMode="decimal"
            value={maxPrice}
            aria-invalid={rangeError}
            aria-describedby={rangeError ? "catalog-range-error" : undefined}
            onChange={(event) => setMaxPrice(event.target.value)}
          />
          {rangeError ? (
            <p
              id="catalog-range-error"
              role="alert"
              className="text-xs font-medium text-danger-text"
            >
              {t("filters.rangeError")}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="catalog-sort">{t("filters.sort")}</Label>
          <select
            id="catalog-sort"
            name="sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`sort.${option}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" className="sm:w-fit">
          <SearchIcon aria-hidden />
          {t("filters.submit")}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={reset}>
          <X aria-hidden />
          {t("filters.clear")}
        </Button>
      </div>
    </form>
  );
}
