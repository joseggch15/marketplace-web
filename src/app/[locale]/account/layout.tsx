import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AuthCard } from "@/features/auth/components/auth-card";
import { getCurrentUser } from "@/features/auth/session";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = { robots: { index: false, follow: true } };

type AccountLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Marco de las páginas de la cuenta (`/es/account` y `/es/account/addresses`).
 *
 * Aquí está el **guardia de sesión**: si no hay sesión válida, se redirige a /login llevando `?next` para
 * volver después. Se hace en el servidor y antes de pintar nada, así que un usuario sin sesión no ve ni un
 * instante de su cuenta.
 *
 * Comprobación honesta de límites: si el access token caducó pero el refresh token sigue siendo válido, esta
 * página manda a /login y la propia pantalla de entrar redirige de vuelta a /account en cuanto renueva la
 * sesión (lo hace `SessionGate` llamando a `/api/auth/session`). El usuario ve un salto, no vuelve a escribir
 * su contraseña.
 */
export default async function AccountLayout({ children, params }: AccountLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (user === null) {
    redirect({ href: "/login?next=/account", locale });
    return null;
  }

  const t = await getTranslations("Auth");

  return (
    <AuthCard width="wide" title={t("account.title")} subtitle={t("account.subtitle")}>
      <div className="flex flex-col gap-8">
        <nav aria-label={t("account.navLabel")} className="flex flex-wrap gap-3 text-sm">
          <Link href="/account" className="text-primary underline-offset-4 hover:underline">
            {t("links.account")}
          </Link>
          <Link
            href="/account/addresses"
            className="text-primary underline-offset-4 hover:underline"
          >
            {t("links.addresses")}
          </Link>
          <Link href="/orders" className="text-primary underline-offset-4 hover:underline">
            {t("links.orders")}
          </Link>
          <Link href="/seller" className="text-primary underline-offset-4 hover:underline">
            {t("links.seller")}
          </Link>
          {user.role === "admin" ? (
            <Link href="/admin" className="text-primary underline-offset-4 hover:underline">
              {t("links.admin")}
            </Link>
          ) : null}
        </nav>
        {children}
      </div>
    </AuthCard>
  );
}
