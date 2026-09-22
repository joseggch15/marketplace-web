import { cookies } from "next/headers";

import { defaultLocale, isLocale, LOCALE_COOKIE_NAME, type Locale } from "@/i18n/locale";

import "./globals.css";

import en from "../../messages/en.json";
import es from "../../messages/es.json";

const MESSAGES = { es: es.NotFound, en: en.NotFound } as const;

/**
 * 404 para peticiones que **no** pasan por el `proxy` de idiomas (por ejemplo `/algo.txt`).
 * Reemplaza a `<html>`, así que define sus propias etiquetas; el idioma se toma de la cookie
 * `NEXT_LOCALE` para responder en el idioma que la persona está usando.
 */
export default async function GlobalNotFound() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale();
  const t = MESSAGES[locale];

  return (
    <html lang={locale}>
      <body className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-foreground">
        <p className="font-heading text-5xl font-bold text-muted-foreground">404</p>
        <h1 className="font-heading text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground">{t.description}</p>
        <a
          href={`/${locale}`}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {t.backHome}
        </a>
      </body>
    </html>
  );
}
