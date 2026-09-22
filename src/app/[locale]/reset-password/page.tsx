import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = { robots: { index: false, follow: true } };

type ResetPasswordPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

/**
 * Página para guardar la contraseña nueva (`/es/reset-password?token=...`).
 *
 * Si no llega el token, el formulario lo dice claramente y ofrece pedir otro enlace, en vez de dejar al
 * usuario rellenando un formulario que no va a funcionar.
 */
export default async function ResetPasswordPage({ params, searchParams }: ResetPasswordPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Auth");
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;

  return (
    <AuthCard title={t("resetTitle")} subtitle={t("resetSubtitle")}>
      <ResetPasswordForm token={value ?? ""} />
    </AuthCard>
  );
}
