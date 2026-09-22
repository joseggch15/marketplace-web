import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import { describe, expect, it } from "vitest";

import { ThemeToggle } from "@/components/layout/theme-toggle";

/**
 * Pruebas del selector de tema: se comprueba lo que importa para accesibilidad (nombre accesible, uso con
 * teclado y que las tres opciones estén disponibles).
 *
 * Nota: el selector de idioma no se prueba aquí porque depende del router de Next.js (`next-intl`). Se
 * cubre en las pruebas end-to-end (`e2e/smoke.spec.ts`), que lo ejecutan en un navegador real, que es
 * donde de verdad importa.
 */

const labels = {
  label: "Cambiar tema",
  light: "Claro",
  dark: "Oscuro",
  system: "Igual que el sistema",
};

describe("ThemeToggle", () => {
  it("tiene nombre accesible y abre las tres opciones con el teclado", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider attribute="class">
        <ThemeToggle labels={labels} />
      </ThemeProvider>,
    );

    const trigger = screen.getByRole("button", { name: labels.label });
    expect(trigger).toBeVisible();

    trigger.focus();
    await user.keyboard("{Enter}");

    const options = await screen.findAllByRole("menuitemradio");
    expect(options).toHaveLength(3);
    expect(options.map((option) => option.textContent)).toEqual([
      labels.light,
      labels.dark,
      labels.system,
    ]);
  });
});
