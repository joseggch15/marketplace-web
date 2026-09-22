import { CircleAlert, CircleCheck, CircleSlash } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { env } from "@/lib/env";

import { fetchPlatformHealth } from "../api";

/** Nombres de dependencia que devuelve el backend → clave de traducción. */
const CHECK_LABELS: Record<string, "checkDatabase" | "checkRedis"> = {
  database: "checkDatabase",
  redis: "checkRedis",
};

/**
 * Tarjeta con el estado real de la plataforma.
 *
 * Es un Server Component asíncrono: consulta el backend al renderizar y `page.tsx` lo envuelve en
 * `<Suspense>` con un esqueleto, así el usuario ve el contenido enseguida y el estado llega después.
 *
 * No se inventa ningún dato: si el backend no responde, se dice tal cual y se explica cómo levantarlo.
 */
export async function PlatformStatusCard() {
  const t = await getTranslations("Health");
  const health = await fetchPlatformHealth();

  if (health.kind === "unreachable") {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-2">
          <CircleSlash aria-hidden className="size-5 text-danger-text" />
          <p className="font-heading text-base font-semibold">{t("statusUnreachable")}</p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("statusUnreachableDetail", { url: env.BACKEND_URL })}
        </p>
        <p className="mt-2 rounded-lg bg-info-surface px-3 py-2 text-sm text-info-text">
          {t("statusUnreachableHint")}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{health.detail}</p>
        <Button asChild variant="outline" size="lg" className="mt-4">
          <Link href="/">{t("statusRetry")}</Link>
        </Button>
      </div>
    );
  }

  const isHealthy = health.kind === "ok";
  const checks = Object.entries(health.payload.checks);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-3">
        {isHealthy ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-success-surface px-3 py-1 text-sm font-medium text-success-text">
            <CircleCheck aria-hidden className="size-4" />
            {t("statusOk")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-warning-surface px-3 py-1 text-sm font-medium text-warning-text">
            <CircleAlert aria-hidden className="size-4" />
            {t("statusUnhealthy")}
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {health.payload.status} · {env.BACKEND_URL}
        </span>
      </div>

      <h3 className="mt-4 text-sm font-semibold">{t("checksLabel")}</h3>
      <ul className="mt-2 space-y-2 text-sm">
        {checks.map(([name, status]) => {
          const labelKey = CHECK_LABELS[name];
          const ok = status === "ok";

          return (
            <li key={name} className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{labelKey ? t(labelKey) : name}</span>
              <span className={ok ? "text-success-text" : "text-danger-text"}>
                {ok ? t("checkOk") : t("checkError")}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
