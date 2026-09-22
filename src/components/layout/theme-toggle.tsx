"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Etiquetas traducidas: llegan como props desde el componente servidor del encabezado. */
export interface ThemeToggleLabels {
  label: string;
  light: string;
  dark: string;
  system: string;
}

const OPTIONS = [
  { value: "light", icon: Sun, key: "light" },
  { value: "dark", icon: Moon, key: "dark" },
  { value: "system", icon: Monitor, key: "system" },
] as const;

/**
 * Selector de tema (claro, oscuro o el del sistema).
 *
 * Detalle de accesibilidad: el icono del botón se decide con CSS (uno se oculta según la clase `dark`),
 * no con JavaScript. Así el servidor y el navegador pintan lo mismo, sin avisos de hidratación y sin
 * necesidad de un efecto posterior al montaje. El nombre accesible del botón no depende del icono.
 */
export function ThemeToggle({ labels }: { labels: ThemeToggleLabels }) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={labels.label}>
          <Sun aria-hidden className="size-4 dark:hidden" />
          <Moon aria-hidden className="hidden size-4 dark:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
          {OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              <option.icon aria-hidden className="size-4" />
              <span>{labels[option.key]}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
