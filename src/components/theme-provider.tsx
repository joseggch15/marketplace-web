"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Proveedor del tema claro/oscuro.
 *
 * Usa `next-themes`, que aplica la clase `dark` en `<html>` antes de pintar (evita el "destello"
 * blanco) y respeta la preferencia del sistema cuando el usuario elige «Igual que el sistema».
 *
 * La preferencia de tema se guarda en `localStorage`. Es lo único que se guarda ahí: **nunca** tokens
 * ni datos de sesión (ver `.clinerules`).
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
