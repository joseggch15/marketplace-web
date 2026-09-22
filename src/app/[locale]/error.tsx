"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/**
 * Página de error de la aplicación (estado "error": mensaje claro y cómo resolverlo).
 *
 * Debe ser un componente cliente (lo exige Next.js) y usa las traducciones del espacio `Error`, que el
 * layout entrega al navegador con `NextIntlClientProvider`.
 *
 * Se muestra el `digest` (identificador del error en los registros del servidor) en lugar del mensaje
 * técnico: al usuario le sirve para reportar el problema, y no expone detalles internos.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");

  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-start px-4 py-16">
      <CircleAlert aria-hidden className="size-10 text-danger-text" />
      <h1 className="mt-4 font-heading text-2xl font-bold sm:text-3xl">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("description")}</p>
      {error.digest ? (
        <p className="mt-2 rounded-lg bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">
          {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" size="lg" onClick={reset}>
          {t("retry")}
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">{t("backHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
