import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AddressBook } from "@/features/auth/components/address-book";
import { routing } from "@/i18n/routing";

type AddressesPageProps = { params: Promise<{ locale: string }> };

/**
 * Página "Mis direcciones".
 *
 * La libreta se carga en el navegador (TanStack Query → `GET /api/account/addresses`) para poder añadir,
 * editar y borrar sin recargar la página. La sesión ya está comprobada en el `layout.tsx` del área.
 */
export default async function AddressesPage({ params }: AddressesPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Auth");

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-lg font-semibold">{t("account.addressesTitle")}</h2>
      <p className="text-sm text-muted-foreground">{t("account.addressesSubtitle")}</p>
      <AddressBook />
    </section>
  );
}
