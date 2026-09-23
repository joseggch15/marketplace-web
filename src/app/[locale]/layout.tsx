import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { brand } from "@/config/brand";
import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";

import "../globals.css";

/**
 * Tipografías (máximo dos familias, como pide el sistema de diseño):
 * - Inter para el texto corrido (muy legible en pantalla).
 * - Plus Jakarta Sans para títulos: más personalidad sin dejar de ser seria.
 * `next/font` las descarga en tiempo de compilación y las sirve desde nuestro dominio (sin pedirlas a
 * Google en cada visita) y sin "salto" de texto al cargar.
 */
const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/** Genera las versiones estáticas de cada idioma (`/es` y `/en`). */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Título, descripción, canonical y `hreflang` por idioma (requisito de SEO). */
export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: { default: t("title"), template: `%s · ${brand.name}` },
    description: t("description"),
    applicationName: brand.name,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((option) => [option, `/${option}`])),
    },
    openGraph: {
      type: "website",
      siteName: brand.name,
      title: t("title"),
      description: t("description"),
      locale,
    },
    robots: { index: true, follow: true },
  };
}

/**
 * Layout raíz de la aplicación (todo vive bajo `[locale]`, patrón de next-intl).
 *
 * Aquí se define el idioma del documento, las tipografías, el proveedor de tema y el marco de la página
 * (salto al contenido, encabezado y pie). El idioma se valida antes de usarlo: si la URL trae algo raro
 * como `/xx`, se responde 404 en lugar de renderizar algo a medias.
 */
export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Habilita el renderizado estático para el idioma recibido.
  setRequestLocale(locale);

  const [messages, t] = await Promise.all([getMessages(), getTranslations("Common")]);

  // Al navegador solo se le envían los mensajes que necesita un componente cliente: los de error, los de la
  // cuenta (F2), los del catálogo y la ficha de producto (F3 y F4), los del carrito (F5) y los del checkout y
  // «mis compras» (F6 y F7). El resto de los textos se resuelven en el servidor y viajan como props (menos
  // JavaScript). **Si aquí falta un espacio que use un componente cliente, la página falla con
  // `MISSING_MESSAGE`**: el checkout se pintaba mal por eso hasta que lo detectaron las pruebas e2e.
  const clientMessages = {
    Error: messages.Error ?? {},
    Auth: messages.Auth ?? {},
    Catalog: messages.Catalog ?? {},
    Product: messages.Product ?? {},
    Cart: messages.Cart ?? {},
    Checkout: messages.Checkout ?? {},
    Orders: messages.Orders ?? {},
    Seller: messages.Seller ?? {},
    Admin: messages.Admin ?? {},
  };

  return (
    <html
      lang={locale}
      className={`${bodyFont.variable} ${displayFont.variable}`}
      suppressHydrationWarning
      // Next.js 16 pide este atributo para saber que el desplazamiento suave es intencional:
      // así lo desactiva durante los cambios de ruta (evita que el scroll se comporte de forma rara).
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-dvh flex-col antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={clientMessages}>
            <QueryProvider>
              <a
                href="#main-content"
                className="sr-only rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
              >
                {t("skipToContent")}
              </a>
              <SiteHeader />
              <main id="main-content" tabIndex={-1} className="flex-1 focus-visible:outline-none">
                {children}
              </main>
              <SiteFooter />
            </QueryProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
