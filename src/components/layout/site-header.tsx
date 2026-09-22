import { getTranslations } from "next-intl/server";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { SearchBar } from "@/components/layout/search-bar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { brand } from "@/config/brand";
import { Link } from "@/i18n/navigation";

/**
 * Encabezado del sitio.
 *
 * Criterios aplicados:
 * - La búsqueda es protagonista y está siempre visible (también en móvil).
 * - Solo se muestra lo que ya funciona: carrito, favoritos y cuenta llegan en fases posteriores, así que
 *   todavía no hay iconos que lleven a ninguna parte.
 * - El logotipo es un enlace en el que se puede hacer clic con un nombre accesible claro.
 */
export async function SiteHeader() {
  const t = await getTranslations("Common");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:gap-4">
        <Link
          href="/"
          aria-label={t("brandHome")}
          className="flex shrink-0 items-center gap-2 rounded-lg px-1 py-1 font-heading text-sm font-semibold"
        >
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"
          >
            {brand.shortName.slice(0, 2).toUpperCase()}
          </span>
          <span className="hidden sm:inline">{brand.name}</span>
        </Link>

        <div className="min-w-0 flex-1">
          <SearchBar />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle
            labels={{
              label: t("themeLabel"),
              light: t("themeLight"),
              dark: t("themeDark"),
              system: t("themeSystem"),
            }}
          />
          <LanguageSwitcher
            labels={{
              label: t("languageLabel"),
              options: { es: t("languageEs"), en: t("languageEn") },
            }}
          />
        </div>
      </div>
    </header>
  );
}
