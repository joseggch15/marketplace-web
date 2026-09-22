import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { Breadcrumbs } from "@/components/domain/breadcrumbs";

/**
 * Pruebas de las migas de pan (F4).
 *
 * Importa la accesibilidad: es una navegación con nombre, una lista ordenada, y el último nivel **no** puede
 * ser un enlace (ya estás en esa página) pero debe anunciarse como la página actual.
 *
 * El envoltorio de next-intl hace falta porque los enlaces internos usan su `Link` (el que añade el idioma);
 * los textos llegan como props, así que no se cargan mensajes.
 */

function renderBreadcrumbs(ui: ReactElement) {
  return render(<NextIntlClientProvider locale="es">{ui}</NextIntlClientProvider>);
}

describe("Breadcrumbs", () => {
  it("marca el último nivel como la página actual y no lo convierte en enlace", () => {
    renderBreadcrumbs(
      <Breadcrumbs
        label="Ruta de navegación"
        items={[
          { label: "Inicio", href: "/" },
          { label: "Tecnología", href: "/c/tecnologia" },
          { label: "Audífonos inalámbricos" },
        ]}
      />,
    );

    const nav = screen.getByRole("navigation", { name: "Ruta de navegación" });

    expect(nav).toBeVisible();
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByText("Audífonos inalámbricos")).toHaveAttribute("aria-current", "page");
    // next-intl añade el idioma a los enlaces internos: la ruta sale como `/es/c/tecnologia`.
    expect(screen.getByRole("link", { name: "Tecnología" })).toHaveAttribute(
      "href",
      "/es/c/tecnologia",
    );
  });

  it("no convierte en enlace un nivel intermedio sin página propia", () => {
    renderBreadcrumbs(
      <Breadcrumbs
        label="Ruta de navegación"
        items={[{ label: "Inicio", href: "/" }, { label: "Producto sin categoría" }]}
      />,
    );

    expect(screen.queryByRole("link", { name: "Producto sin categoría" })).toBeNull();
    expect(screen.getByText("Producto sin categoría")).toHaveAttribute("aria-current", "page");
  });
});
