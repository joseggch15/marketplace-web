import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/features/auth/session";
import { loadMyStore } from "@/features/seller/server";
import { storeStatusKey } from "@/features/seller/status";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type SellerLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Marco del panel del vendedor (`/es/seller`, `/es/seller/products`, …).
 *
 * Aquí vive el **guardia de sesión** (en el servidor, antes de pintar nada) y el contexto que necesitan todas
 * las pantallas: el nombre y el estado de la tienda. El estado se enseña siempre porque cambia lo que se puede
 * hacer: con la tienda pendiente o suspendida se puede mirar el panel, pero no publicar.
 *
 * La navegación es la misma en todas las pantallas y se marca la sección activa por la ruta, sin JavaScript de
 * más (los enlaces son enlaces).
 */
export default async function SellerLayout({ children, params }: SellerLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (user === null) {
    redirect({ href: "/login?next=/seller", locale });
  }

  const t = await getTranslations("Seller");
  const lookup = await loadMyStore();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">{t("title")}</h1>
          {lookup.status === "ok" ? (
            <Badge variant={lookup.store.status === "approved" ? "secondary" : "outline"}>
              {t(`store.status.${storeStatusKey(lookup.store.status)}`)}
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {lookup.status === "ok" ? lookup.store.name : t("subtitle")}
        </p>
      </header>

      <nav aria-label={t("navLabel")} className="flex flex-wrap gap-3 text-sm">
        <Link href="/seller" className="text-primary underline-offset-4 hover:underline">
          {t("nav.dashboard")}
        </Link>
        <Link href="/seller/products" className="text-primary underline-offset-4 hover:underline">
          {t("nav.products")}
        </Link>
        <Link href="/seller/orders" className="text-primary underline-offset-4 hover:underline">
          {t("nav.orders")}
        </Link>
      </nav>

      {children}
    </div>
  );
}
