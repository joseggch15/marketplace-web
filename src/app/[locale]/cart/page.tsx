import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CartView } from "@/features/cart/components/cart-view";
import { routing } from "@/i18n/routing";

/**
 * Carrito (`/es/cart`).
 *
 * La página es el marco (título, descripción y el aviso del pago) y `CartView` hace el resto: es un componente
 * cliente porque todo aquí es interactivo y comparte la caché del carrito con la cabecera.
 *
 * `noindex` a propósito: el contenido de un carrito es de una sola persona, no tiene ningún interés para los
 * buscadores y no queremos que aparezca en resultados de búsqueda.
 */

type CartPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: CartPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "Cart" });

  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/cart`,
      languages: Object.fromEntries(routing.locales.map((option) => [option, `/${option}/cart`])),
    },
    robots: { index: false, follow: true },
  };
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Cart");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <CartView />
    </div>
  );
}
