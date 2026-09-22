import { getTranslations } from "next-intl/server";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Esqueleto del estado de la plataforma (estado "cargando" del diseño).
 *
 * Se usan bloques con la forma del contenido final, no un spinner genérico, para que la página no
 * "salte" cuando lleguen los datos (menos CLS). El texto para lectores de pantalla avisa de que se está
 * cargando, con `role="status"`.
 */
export async function PlatformStatusSkeleton() {
  const t = await getTranslations("Common");

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <p role="status" className="sr-only">
        {t("loading")}
      </p>
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-40 rounded-full" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="mt-5 h-4 w-32" />
      <div className="mt-3 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
