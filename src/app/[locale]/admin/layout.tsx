import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/features/auth/session";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type AdminLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Marco del panel de administración (`/es/admin`, `/es/admin/stores`, …).
 *
 * Guardia de sesión **y de rol** en el servidor, antes de pintar nada: sin sesión se va a /login y con una
 * cuenta que no sea administradora se responde **404** (no 403). El motivo: no se le cuenta a un comprador que
 * existe un panel de administración ni dónde está; desde su punto de vista esa dirección simplemente no existe.
 * La comprobación de verdad la hace igualmente cada endpoint del backend.
 */
export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (user === null) {
    redirect({ href: "/login?next=/admin", locale });
    return null;
  }

  // Con una cuenta que no es administradora, la dirección **no existe**: 404, no 403.
  if (user.role !== "admin") {
    notFound();
  }

  const t = await getTranslations("Admin");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <nav aria-label={t("navLabel")} className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin" className="text-primary underline-offset-4 hover:underline">
          {t("nav.pending")}
        </Link>
        <Link href="/admin/stores" className="text-primary underline-offset-4 hover:underline">
          {t("nav.allStores")}
        </Link>
        <Link href="/admin/reviews" className="text-primary underline-offset-4 hover:underline">
          {t("nav.reviews")}
        </Link>
        <Link href="/admin/questions" className="text-primary underline-offset-4 hover:underline">
          {t("nav.questions")}
        </Link>
        <Link href="/admin/users" className="text-primary underline-offset-4 hover:underline">
          {t("nav.users")}
        </Link>
      </nav>

      {children}
    </div>
  );
}
