import type { ReactNode } from "react";

/**
 * Marco de las páginas de la cuenta (entrar, registrarse, recuperar, mi cuenta).
 *
 * Es un componente de servidor (sin `"use client"`): solo pinta, así que no añade JavaScript al navegador.
 * El ancho está limitado a `max-w-md` porque un formulario ancho es más difícil de leer, y en móvil ocupa el
 * ancho completo con márgenes de 16 px.
 */
export function AuthCard({
  title,
  subtitle,
  children,
  width = "narrow",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  width?: "narrow" | "wide";
}) {
  return (
    <div
      className={`mx-auto w-full ${width === "narrow" ? "max-w-md" : "max-w-3xl"} px-4 py-12 sm:py-16`}
    >
      <h1 className="font-heading text-2xl font-bold sm:text-3xl">{title}</h1>
      {subtitle !== undefined ? <p className="mt-2 text-muted-foreground">{subtitle}</p> : null}
      <div className="mt-8">{children}</div>
    </div>
  );
}
