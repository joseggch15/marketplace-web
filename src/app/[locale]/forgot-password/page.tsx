import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AuthCard } from "@/features/auth/components/auth-card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = { robots: { index: false, follow: true } };

type ForgotPasswordPageProps = { params: Promise<{ locale: string }> };

/** Página para pedir el enlace de recuperación (`/es/forgot-password`). */
export default async function ForgotPasswordPage({ params }: ForgotPasswordPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Auth");

  return (
    <AuthCard title={t("forgotTitle")} subtitle={t("forgotSubtitle")}>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
