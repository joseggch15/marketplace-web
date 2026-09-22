/**
 * Utilidades de color y contraste WCAG (sin dependencias).
 *
 * Se usan en las pruebas para garantizar que los tokens de `src/styles/tokens.css` cumplen
 * WCAG 2.2 AA: 4,5:1 para texto normal y 3:1 para límites de controles y elementos gráficos.
 */

export type ContrastRequirement = "text" | "ui";

/** Convierte un color hexadecimal (`#rrggbb`) a sus componentes RGB (0–255). */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.trim().replace(/^#/, "");

  if (normalized.length !== 6) {
    throw new Error(`Color hexadecimal no soportado: ${hex}`);
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

/** Luminancia relativa según WCAG 2.x. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [red, green, blue] = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** Razón de contraste entre dos colores (entre 1 y 21). */
export function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

/** Redondea la razón a dos decimales, para mensajes de error legibles. */
export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

/** Mínimo exigido por WCAG AA: 4,5:1 para texto y 3:1 para límites y gráficos. */
export function minimumRatio(requirement: ContrastRequirement): number {
  return requirement === "text" ? 4.5 : 3;
}

/** Indica si un par de colores cumple el nivel exigido. */
export function meetsContrast(
  foreground: string,
  background: string,
  requirement: ContrastRequirement = "text",
): boolean {
  return contrastRatio(foreground, background) >= minimumRatio(requirement);
}
