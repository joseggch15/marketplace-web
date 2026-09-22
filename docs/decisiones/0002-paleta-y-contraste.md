# 0002 · Paleta «Mercado Vivo» y validación de contraste

**Fecha:** Fase 0 · **Estado:** aceptada (con una decisión pendiente para la F1)

## Decisión

Se usa la dirección visual **«Mercado Vivo»**: azul de confianza como color principal (un marketplace
nuevo necesita transmitir seguridad, porque se compra a vendedores desconocidos) y **turquesa** como
acento, **en lugar del amarillo** que se había propuesto al principio: azul + amarillo recuerda
demasiado a Mercado Libre y la marca debe tener identidad propia.

Los colores viven en `src/styles/tokens.css`, en dos capas:

1. **Primitivas** (`--mv-blue-600`, `--mv-teal-500`, …): la paleta en bruto.
2. **Semánticas**, con los nombres que esperan los componentes de shadcn (`--primary`, `--background`,
   `--muted-foreground`, …) más las propias de la marca (`--brand-accent`, `--brand-success-text`, …).

Ningún componente escribe un color directamente: todos usan tokens (las utilidades de Tailwind se generan
desde `@theme inline` en `globals.css`).

## Validación de contraste (automática)

`src/lib/color/tokens-contrast.test.ts` lee `tokens.css` y comprueba **18 pares de colores en modo claro y
en modo oscuro** (36 comprobaciones):

- Texto: 4,5:1 (WCAG 2.2 AA, criterio 1.4.3).
- Límites de controles y elementos gráficos: 3:1 (criterio 1.4.11).

Detalles que salieron de la validación:

- El azul de marca como **fondo de botón** es `#0F55D6` (no `#1B6BFF`, que se queda en 4,61:1 y no deja
  margen). El azul claro `#1B6BFF` se usa para el anillo de foco y enlaces, donde sí pasa.
- El turquesa `#00A99D` **no sirve con texto blanco** (2,93:1). Por eso el texto sobre turquesa usa
  `--brand-accent-text` (`#006B65`) y las insignias usan fondo turquesa claro con texto oscuro.
- El borde de los campos (`--input`) es más oscuro que el borde decorativo (`--border`): el primero
  identifica un control y debe cumplir 3:1; el segundo solo separa secciones.
- En modo oscuro se aclaran primario, borde y textos secundarios para mantener los ratios.

## Pendiente para la F1

Proponer **2 alternativas al acento turquesa** (por ejemplo: coral y violeta), con su propia validación de
contraste, y que el dueño del producto elija. La prueba automática ya cubre el cambio: basta con ajustar
`--brand-accent*` en `tokens.css`.
