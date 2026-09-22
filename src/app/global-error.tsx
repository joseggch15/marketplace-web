"use client";

import { useSyncExternalStore } from "react";

import { defaultLocale, localeFromCookieString } from "@/i18n/locale";

import "./globals.css";

import en from "../../messages/en.json";
import es from "../../messages/es.json";
import { Button } from "@/components/ui/button";

/**
 * Página de error global: se muestra cuando falla el layout raíz (por ejemplo, si no se puede leer la
 * configuración). Reemplaza por completo a `<html>`, por eso define sus propias etiquetas y vuelve a
 * importar los estilos.
 *
 * Detalles:
 * - Los textos siguen saliendo de los archivos de traducción (`messages/*.json`); no hay texto suelto.
 * - Como aquí no hay proveedor de idioma, se lee la cookie `NEXT_LOCALE`. El primer render usa el idioma
 *   por defecto (servidor y navegador coinciden, sin avisos de hidratación) y luego se corrige.
 */
const MESSAGES = { es: es.Error, en: en.Error } as const;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Lectura de la cookie en el navegador sin provocar desajustes de hidratación: React usa el valor del
  // servidor (idioma por defecto) durante el renderizado inicial y el del navegador después.
  const locale = useSyncExternalStore(
    () => () => {},
    () => localeFromCookieString(document.cookie),
    () => defaultLocale(),
  );

  const t = MESSAGES[locale];

  return (
    <html lang={locale}>
      <body className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-foreground">
        <h1 className="font-heading text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground">{t.description}</p>
        {error.digest ? (
          <p className="rounded-lg bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">
            {error.digest}
          </p>
        ) : null}
        <Button type="button" size="lg" onClick={reset}>
          {t.retry}
        </Button>
      </body>
    </html>
  );
}
