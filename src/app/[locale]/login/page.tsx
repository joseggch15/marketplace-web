import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";
import { SessionGate } from "@/features/auth/components/session-gate";
import { routing } from "@/i18n/routing";

/** Las páginas de sesión no aportan nada en un buscador: se indexa el catálogo, no el formulario. */
export const metadata: Metadata = { robots: { index: false, follow: true } };

type LoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string | string[] }>;
};

/**
 * Página de inicio de sesión (`/es/login`).
 *
 * Acepta `?next=/account` para volver a donde el usuario quería ir: cuando alguien intenta abrir una página
 * privada sin sesión, se le manda aquí con esa ruta y, al entrar, sigue su camino sin buscarla otra vez.
 */
export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("Auth");
  const { next } = await searchParams;
  const target = Array.isArray(next) ? next[0] : next;

  return (
    <AuthCard title={t("loginTitle")} subtitle={t("loginSubtitle")}>
      <SessionGate next={target}>
        <LoginForm next={target} />
      </SessionGate>
    </AuthCard>
  );
}
