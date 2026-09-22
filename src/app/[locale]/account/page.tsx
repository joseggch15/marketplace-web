import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { ProfileForm } from "@/features/auth/components/profile-form";
import { getCurrentUser } from "@/features/auth/session";
import { routing } from "@/i18n/routing";
import { formatDate } from "@/lib/format/date";

type AccountPageProps = { params: Promise<{ locale: string }> };

/**
 * Página "Mi cuenta": estado de la sesión, datos personales y preferencias.
 *
 * El guardia de sesión vive en `layout.tsx`; aquí se vuelve a leer el usuario para pintarlo (una lectura más
 * de la caché del servidor, sin coste real).
 */
export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (user === null) {
    return null;
  }

  const t = await getTranslations("Auth");
  const memberSince = formatDate(user.created_at, locale, user.profile?.timezone);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2 rounded-xl border border-border p-4">
        <h2 className="font-heading text-lg font-semibold">{t("account.sessionTitle")}</h2>
        <p className="font-medium">{user.email}</p>
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant={user.email_verified ? "secondary" : "outline"}>
            {user.email_verified ? t("account.emailVerified") : t("account.emailNotVerified")}
          </Badge>
          {memberSince !== null ? (
            <span>{t("account.memberSince", { date: memberSince })}</span>
          ) : null}
        </p>
        {user.email_verified ? null : (
          <p className="text-sm text-muted-foreground">{t("account.verifyHint")}</p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold">{t("account.profileTitle")}</h2>
        <ProfileForm user={user} locale={locale} />
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-6">
        <h2 className="font-heading text-lg font-semibold">{t("account.sessionActionsTitle")}</h2>
        <LogoutButton className="sm:w-fit" />
      </section>
    </div>
  );
}
