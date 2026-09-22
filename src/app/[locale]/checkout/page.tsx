import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/session";
import { CheckoutView } from "@/features/orders/components/checkout/checkout-view";
import { routing } from "@/i18n/routing";

/**
 * Checkout (`/es/checkout`).
 *
 * **Requiere sesión**: el backend solo crea pedidos para un usuario autenticado, así que a quien no ha entrado se
 * le lleva al login con `?next=` y vuelve aquí después (el carrito se conserva porque vive en el servidor).
 *
 * `noindex`: es una página privada y su contenido no debe acabar en un buscador.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

type CheckoutPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (user === null) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/checkout`)}`);
  }

  // El título de la página lo pinta la vista, que es cliente y conoce el idioma activo.
  return <CheckoutView />;
}
