import { Search } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Barra de búsqueda del encabezado (siempre visible, como pide el principio de UI/UX).
 *
 * Es un `<form>` normal con `method="get"`: al enviarlo, la búsqueda viaja en la URL (`?q=...`), así el
 * resultado se puede compartir y el botón "atrás" funciona. Sin JavaScript, sigue funcionando.
 * El idioma se añade al destino para no perder el prefijo de la ruta.
 */
export async function SearchBar() {
  const [t, locale] = await Promise.all([getTranslations("Common"), getLocale()]);

  return (
    <form
      action={`/${locale}/search`}
      method="get"
      role="search"
      className="flex w-full items-center gap-2"
    >
      <div className="relative w-full">
        <label htmlFor="site-search" className="sr-only">
          {t("searchLabel")}
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="site-search"
          name="q"
          type="search"
          autoComplete="off"
          placeholder={t("searchPlaceholder")}
          className="h-9 pl-8 md:h-10"
        />
      </div>
      <Button type="submit" size="lg" className="h-9 shrink-0 md:h-10">
        <span className="hidden sm:inline">{t("searchSubmit")}</span>
        <Search aria-hidden className="size-4 sm:hidden" />
        <span className="sr-only sm:hidden">{t("searchSubmit")}</span>
      </Button>
    </form>
  );
}
