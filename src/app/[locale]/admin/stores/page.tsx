import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StateCard } from "@/components/domain/state-card";
import { Badge } from "@/components/ui/badge";
import { listStores } from "@/features/admin/api";
import { StoreCardWithActions } from "@/features/admin/components/store-card-with-actions";
import { loadAdminSession } from "@/features/admin/server";
import { firstValue } from "@/features/admin/params";
import { STORE_STATUSES, type StoreStatus } from "@/features/admin/types";
import { storeStatusKey } from "@/features/seller/status";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { formatDateTime } from "@/lib/format/date";

/**
 * Todas las tiendas (`/es/admin/stores`), con filtro por estado.
 *
 * El filtro vive en la **URL** (`?status=pending`), como el resto de listados del proyecto: la vista es
 * compartible, el botón «atrás» funciona y la pantalla se puede pintar entera en el servidor.
 */
export default async function AdminStoresPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const session = await loadAdminSession();

  if (session === null) {
    notFound();
  }

  const t = await getTranslations("Admin");
  const activeLocale = await getLocale();
  const query = await searchParams;
  const requested = firstValue(query.status);
  const status: StoreStatus | null =
    requested !== null && (STORE_STATUSES as readonly string[]).includes(requested)
      ? (requested as StoreStatus)
      : null;

  const stores = await listStores(session.accessToken, status);

  if (!stores.ok) {
    return (
      <StateCard
        tone="danger"
        title={t("unavailable.title")}
        description={t("unavailable.description")}
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-xl font-semibold">{t("stores.allTitle")}</h2>
        <Badge variant="outline">{stores.data.length}</Badge>
      </div>

      <nav aria-label={t("stores.filterLabel")} className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/stores" className="text-primary underline-offset-4 hover:underline">
          {t("stores.filterAll")}
        </Link>
        {STORE_STATUSES.map((option) => (
          <Link
            key={option}
            href={`/admin/stores?status=${option}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            {t(`storeStatus.${storeStatusKey(option)}`)}
          </Link>
        ))}
      </nav>

      {stores.data.length === 0 ? (
        <StateCard title={t("stores.emptyTitle")} description={t("stores.emptyDescription")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {stores.data.map((store) => (
            <li key={store.id}>
              <StoreCardWithActions
                store={store}
                statusLabel={t(`storeStatus.${storeStatusKey(store.status)}`)}
                sinceLabel={t("stores.since", {
                  date: formatDateTime(store.created_at, activeLocale) ?? "",
                })}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
