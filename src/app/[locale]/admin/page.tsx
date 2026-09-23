import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StateCard } from "@/components/domain/state-card";
import { Badge } from "@/components/ui/badge";
import { listStores } from "@/features/admin/api";
import { StoreCardWithActions } from "@/features/admin/components/store-card-with-actions";
import { loadAdminSession } from "@/features/admin/server";
import { storeStatusKey } from "@/features/seller/status";
import { routing } from "@/i18n/routing";
import { formatDateTime } from "@/lib/format/date";

/**
 * Tiendas por aprobar (`/es/admin`) — la cola de trabajo del administrador.
 *
 * Se ordena por lo que hay que hacer: las tiendas que esperan aprobación. En cuanto se aprueba una, desaparece de
 * esta lista (la pestaña «Todas las tiendas» las sigue mostrando), que es exactamente lo que espera quien está
 * moderando.
 *
 * El momento de la solicitud se muestra en el idioma y la zona del usuario, con la fecha que devuelve la API:
 * `created_at`, en UTC, convertida a su hora.
 */
export default async function AdminStoresQueuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
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
  const stores = await listStores(session.accessToken, "pending");

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
        <h2 className="font-heading text-xl font-semibold">{t("stores.pendingTitle")}</h2>
        <Badge variant="outline">{stores.data.length}</Badge>
      </div>

      {stores.data.length === 0 ? (
        <StateCard
          title={t("stores.pendingEmptyTitle")}
          description={t("stores.pendingEmptyDescription")}
        />
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
