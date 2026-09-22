import { getTranslations } from "next-intl/server";
import { User } from "lucide-react";

import { CartCounter } from "@/features/cart/components/cart-counter";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { SearchBar } from "@/components/layout/search-bar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { brand } from "@/config/brand";
import { getCurrentUser } from "@/features/auth/session";
import { readCartToken } from "@/features/cart/session";
import { Link } from "@/i18n/navigation";

/**
 * Encabezado del sitio.
 *
 * Criterios aplicados:
 * - La búsqueda es protagonista y está siempre visible (también en móvil).
 * - Solo se muestra lo que ya funciona: el carrito (F5) y la cuenta. Los favoritos llegan más adelante, así
 *   que todavía no hay un icono que no lleve a ninguna parte.
 * - El contador del carrito **no pide nada** cuando el servidor ya sabe que este visitante no tiene carrito:
 *   sin sesión y sin cookie de invitado, el carrito está vacío por definición (`enabled={hasCart}`).
 * - El logotipo es un enlace en el que se puede hacer clic con un nombre accesible claro.
 */
export async function SiteHeader() {
  const [t, tAuth, user, cartToken] = await Promise.all([
    getTranslations("Common"),
    getTranslations("Auth"),
    getCurrentUser(),
    readCartToken(),
  ]);

  const hasCart = user !== null || cartToken !== undefined;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:gap-4">
        <Link
          href="/"
          aria-label={t("brandHome")}
          className="flex shrink-0 items-center gap-2 rounded-lg px-1 py-1 font-heading text-sm font-semibold"
        >
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"
          >
            {brand.shortName.slice(0, 2).toUpperCase()}
          </span>
          <span className="hidden sm:inline">{brand.name}</span>
        </Link>

        <div className="min-w-0 flex-1">
          <SearchBar />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <CartCounter enabled={hasCart} />
          <Link
            href={user === null ? "/login" : "/account"}
            aria-label={user === null ? tAuth("actions.goToLogin") : tAuth("links.account")}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium hover:bg-muted"
          >
            <User aria-hidden className="size-4" />
            <span className="hidden sm:inline">
              {user === null ? tAuth("actions.goToLogin") : tAuth("links.account")}
            </span>
          </Link>
          <ThemeToggle
            labels={{
              label: t("themeLabel"),
              light: t("themeLight"),
              dark: t("themeDark"),
              system: t("themeSystem"),
            }}
          />
          <LanguageSwitcher
            labels={{
              label: t("languageLabel"),
              options: { es: t("languageEs"), en: t("languageEn") },
            }}
          />
        </div>
      </div>
    </header>
  );
}
