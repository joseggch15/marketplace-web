import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AuthCard } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";
import { SessionGate } from "@/features/auth/components/session-gate";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = { robots: { index: false, follow: true } };

type RegisterPageProps = { params: Promise<{ locale: string }> };

/** Página de registro (`/es/register`). */
export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Auth");

  return (
    <AuthCard title={t("registerTitle")} subtitle={t("registerSubtitle")}>
      <SessionGate>
        <RegisterForm />
      </SessionGate>
    </AuthCard>
  );
}
