"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isLocale } from "@/i18n/locale";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export interface LanguageSwitcherLabels {
  label: string;
  options: Record<Locale, string>;
}

/**
 * Selector de idioma.
 *
 * Se usan elementos de tipo "radio" del menú: el patrón accesible correcto (se anuncia cuál está activo y
 * se cambia con las flechas del teclado). Al elegir un idioma se navega a la misma página con el prefijo
 * correspondiente (`/es/...` ↔ `/en/...`).
 *
 * Nota de implementación: **no** se usa `asChild` con `DropdownMenuRadioItem`. En la versión instalada
 * (Radix + shadcn 4) ese elemento renderiza un indicador además del contenido, y `asChild` exige un único
 * hijo, así que lanzaba el error «Primitive.div failed to slot onto its children» y el menú quedaba vacío.
 * Se navega con `router.replace(href, { locale })`, que sigue siendo accesible porque el elemento de radio
 * se comporta como un botón de opción real.
 *
 * TODO(F3): conservar también los parámetros de búsqueda de la URL al cambiar de idioma.
 */
export function LanguageSwitcher({ labels }: { labels: LanguageSwitcherLabels }) {
  const activeLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={labels.label}>
          <Languages aria-hidden className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuRadioGroup
          value={activeLocale}
          onValueChange={(value) => {
            if (!isLocale(value) || value === activeLocale) {
              return;
            }
            router.replace(pathname, { locale: value });
          }}
        >
          {routing.locales.map((locale) => (
            <DropdownMenuRadioItem key={locale} value={locale}>
              {labels.options[locale]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
