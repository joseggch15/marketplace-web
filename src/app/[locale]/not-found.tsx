import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/**
 * Página 404 (estado "vacío" del diseño, con una acción sugerida).
 *
 * Aquí se llega por dos caminos: una ruta desconocida bajo `[locale]` (gracias a `[...rest]`) o un
 * producto/categoría que ya no existe (cuando lo haga `notFound()` en fases posteriores).
 */
export default async function NotFoundPage() {
  const t = await getTranslations("NotFound");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-start px-4 py-16">
      <SearchX aria-hidden className="size-10 text-muted-foreground" />
      <h1 className="mt-4 font-heading text-2xl font-bold sm:text-3xl">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("description")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("searchHint")}</p>
      <Button asChild size="lg" className="mt-6">
        <Link href="/">{t("backHome")}</Link>
      </Button>
    </div>
  );
}
