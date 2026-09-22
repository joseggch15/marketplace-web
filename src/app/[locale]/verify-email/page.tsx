import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AuthCard } from "@/features/auth/components/auth-card";
import { VerifyEmailPanel } from "@/features/auth/components/verify-email-panel";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = { robots: { index: false, follow: true } };

type VerifyEmailPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

/**
 * Página de verificación del correo (`/es/verify-email?token=...`).
 *
 * El enlace del correo apunta aquí. La comprobación se hace al abrir la página y el resultado se muestra en
 * el momento (con opción de pedir otro enlace si el token ya no vale).
 */
export default async function VerifyEmailPage({ params, searchParams }: VerifyEmailPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Auth");
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;

  return (
    <AuthCard title={t("verifyTitle")} subtitle={t("verifySubtitle")}>
      <VerifyEmailPanel token={value ?? ""} />
    </AuthCard>
  );
}
