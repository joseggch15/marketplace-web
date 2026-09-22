import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  contrastRatio,
  formatContrastRatio,
  minimumRatio,
  type ContrastRequirement,
} from "@/lib/color/contrast";

/**
 * Prueba automática de contraste WCAG AA de los tokens de diseño.
 *
 * Lee `src/styles/tokens.css` (la única fuente de verdad de los colores) y comprueba los pares de texto
 * y de límites de controles que usa la interfaz, en modo claro y en modo oscuro.
 *
 * Si alguien cambia un color y rompe el contraste, esta prueba falla y dice exactamente qué par y con qué
 * valor. Así la accesibilidad no depende de que alguien la revise a ojo.
 */
const TOKENS_CSS = readFileSync(path.resolve(process.cwd(), "src/styles/tokens.css"), "utf8");

/** Extrae las declaraciones de un bloque (`:root { ... }` o `.dark { ... }`). */
function parseDeclarations(selector: string): Record<string, string> {
  const blockPattern = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`);
  const block = TOKENS_CSS.match(blockPattern)?.[1];

  if (block === undefined) {
    throw new Error(`No se encontró el bloque ${selector} en tokens.css`);
  }

  const declarations: Record<string, string> = {};
  const declarationPattern = /(--[\w-]+):\s*([^;]+);/g;

  for (const match of block.matchAll(declarationPattern)) {
    const [, name, value] = match;
    if (name !== undefined && value !== undefined) {
      declarations[name] = value.trim();
    }
  }

  return declarations;
}

const ROOT_TOKENS = parseDeclarations(":root");
const DARK_TOKENS = parseDeclarations("\\.dark");

/** Resuelve `var(--otro)` de forma recursiva (los tokens oscuros heredan de los claros). */
function resolveToken(
  name: string,
  theme: Record<string, string>,
  visited: string[] = [],
): string {
  if (visited.includes(name)) {
    throw new Error(`Referencia circular de tokens: ${[...visited, name].join(" → ")}`);
  }

  const raw = theme[name] ?? ROOT_TOKENS[name];
  if (raw === undefined) {
    throw new Error(`Token no definido: ${name}`);
  }

  const reference = raw.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (reference?.[1] !== undefined) {
    return resolveToken(reference[1], theme, [...visited, name]);
  }

  return raw;
}

interface ContrastCase {
  /** Token del color del texto (o del elemento gráfico). */
  foreground: string;
  /** Token del color de fondo. */
  background: string;
  /** Nivel exigido: texto (4,5:1) o límites de controles y gráficos (3:1). */
  requirement: ContrastRequirement;
}

const CASES: ContrastCase[] = [
  // Texto
  { foreground: "--foreground", background: "--background", requirement: "text" },
  { foreground: "--card-foreground", background: "--card", requirement: "text" },
  { foreground: "--primary-foreground", background: "--primary", requirement: "text" },
  { foreground: "--secondary-foreground", background: "--secondary", requirement: "text" },
  { foreground: "--muted-foreground", background: "--muted", requirement: "text" },
  { foreground: "--muted-foreground", background: "--background", requirement: "text" },
  { foreground: "--accent-foreground", background: "--accent", requirement: "text" },
  { foreground: "--destructive-foreground", background: "--destructive", requirement: "text" },
  { foreground: "--field-placeholder", background: "--field-background", requirement: "text" },
  // Insignias y estados propios de la marca
  { foreground: "--brand-accent-text", background: "--brand-accent-surface", requirement: "text" },
  { foreground: "--brand-success-text", background: "--brand-success-surface", requirement: "text" },
  { foreground: "--brand-warning-text", background: "--brand-warning-surface", requirement: "text" },
  { foreground: "--brand-danger-text", background: "--brand-danger-surface", requirement: "text" },
  { foreground: "--brand-info-text", background: "--brand-info-surface", requirement: "text" },
  // Límites de controles y elementos gráficos (WCAG 1.4.11)
  { foreground: "--input", background: "--field-background", requirement: "ui" },
  { foreground: "--ring", background: "--background", requirement: "ui" },
  { foreground: "--ring", background: "--card", requirement: "ui" },
  { foreground: "--primary", background: "--background", requirement: "ui" },
];

describe.each([
  { theme: "claro", tokens: ROOT_TOKENS },
  { theme: "oscuro", tokens: DARK_TOKENS },
])("contraste de tokens en modo $theme", ({ tokens }) => {
  it.each(CASES)(
    "$foreground sobre $background cumple $requirement",
    ({ foreground, background, requirement }) => {
      const foregroundColor = resolveToken(foreground, tokens);
      const backgroundColor = resolveToken(background, tokens);
      const ratio = contrastRatio(foregroundColor, backgroundColor);

      expect(
        ratio,
        `${foreground} (${foregroundColor}) sobre ${background} (${backgroundColor}) = ${formatContrastRatio(ratio)}, mínimo ${minimumRatio(requirement)}:1`,
      ).toBeGreaterThanOrEqual(minimumRatio(requirement));
    },
  );
});
