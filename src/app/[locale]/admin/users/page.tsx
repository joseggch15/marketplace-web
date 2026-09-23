import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StateCard } from "@/components/domain/state-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listUsers } from "@/features/admin/api";
import { parseCursor, parseQuery } from "@/features/admin/params";
import { loadAdminSession } from "@/features/admin/server";
import { USER_ROLES, type UserRole } from "@/features/admin/types";
import { storeStatusKey } from "@/features/seller/status";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { formatDate } from "@/lib/format/date";

/**
 * Directorio de usuarios (`/es/admin/users`).
 *
 * Busca por correo (`q`) y filtra por rol, paginando por cursor. El formulario es un **GET** normal, así que el
 * filtro queda en la URL y la búsqueda se puede compartir sin una línea de JavaScript en el navegador.
 *
 * Lo que se enseña es exactamente lo que devuelve la API: correo, rol, si el correo está verificado y, si la
 * cuenta vende, el nombre y el estado de su tienda. **Nunca** hay contraseñas, tokens ni datos de pago: la API no
 * los consulta siquiera para este listado.
 */
export default async function AdminUsersPage({
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
  const query = await searchParams;
  const q = parseQuery(query.q);
  const roleParam = Array.isArray(query.role) ? query.role[0] : query.role;
  const role: UserRole | null =
    roleParam !== undefined && (USER_ROLES as readonly string[]).includes(roleParam)
      ? (roleParam as UserRole)
      : null;
  const cursor = parseCursor(query.cursor);

  const users = await listUsers(session.accessToken, { q, role, cursor, limit: 20 });

  if (!users.ok) {
    return (
      <StateCard
        tone="danger"
        title={t("unavailable.title")}
        description={t("unavailable.description")}
      />
    );
  }

  const roleLabel = (value: string) =>
    value === "admin"
      ? t("role.admin")
      : value === "customer"
        ? t("role.customer")
        : t("role.unknown");

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-xl font-semibold">{t("users.title")}</h2>
        <Badge variant="outline">{users.data.items.length}</Badge>
      </div>

      <form
        action={`/${locale}/admin/users`}
        method="get"
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="users-q">{t("users.searchLabel")}</Label>
          <Input
            id="users-q"
            name="q"
            defaultValue={q ?? ""}
            maxLength={120}
            placeholder={t("users.searchPlaceholder")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="users-role">{t("users.roleLabel")}</Label>
          <select
            id="users-role"
            name="role"
            defaultValue={role ?? ""}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:bg-input/30"
          >
            <option value="">{t("users.roleAll")}</option>
            {USER_ROLES.map((option) => (
              <option key={option} value={option}>
                {roleLabel(option)}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" size="lg">
          {t("users.search")}
        </Button>
      </form>

      {users.data.items.length === 0 ? (
        <StateCard title={t("users.emptyTitle")} description={t("users.emptyDescription")} />
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {users.data.items.map((user) => {
              const storeName = user.store_name ?? null;
              const storeStatus = user.store_status ?? null;

              return (
                <li
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.full_name ?? t("users.noName")}
                      {" · "}
                      {t("users.since", { date: formatDate(user.created_at, locale) ?? "-" })}
                    </p>
                    {storeName === null ? (
                      <p className="text-xs text-muted-foreground">{t("users.noStore")}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {t("users.store", {
                          name: storeName,
                          status:
                            storeStatus === null
                              ? ""
                              : t(`storeStatus.${storeStatusKey(storeStatus)}`),
                        })}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant={user.role === "admin" ? "default" : "outline"}>
                      {roleLabel(user.role)}
                    </Badge>
                    <Badge variant={user.email_verified ? "secondary" : "outline"}>
                      {user.email_verified ? t("users.verified") : t("users.notVerified")}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>

          {users.data.next_cursor === null ? null : (
            <div className="flex justify-center">
              <Button asChild variant="outline" size="lg">
                <Link
                  href={`/admin/users?q=${encodeURIComponent(q ?? "")}&role=${role ?? ""}&cursor=${encodeURIComponent(users.data.next_cursor)}`}
                >
                  {t("more")}
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
