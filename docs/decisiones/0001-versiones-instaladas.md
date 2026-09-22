# 0001 · Versiones instaladas y por qué se registran

**Fecha:** Fase 0 · **Estado:** aceptada

## Contexto

La regla del proyecto dice: «antes de usar cualquier API de Next.js o de una librería, verifica cómo
funciona en la versión instalada». Para poder hacerlo, las versiones reales tienen que quedar escritas.

## Versiones (comprobadas al crear el proyecto)

| Herramienta | Versión |
|---|---|
| Node.js | v24.19.0 (LTS) |
| pnpm | 12.5.1 |
| Next.js | 16.3.5 |
| React / React DOM | 19.2.8 |
| TypeScript | 5.9.3 |
| Tailwind CSS | 4.3.3 (con `@tailwindcss/postcss`) |
| next-intl | 4.14.x |
| next-themes | 0.4.6 |
| TanStack Query | 5.103.2 |
| openapi-fetch / openapi-typescript | 0.17.0 / 7.13.0 |
| Vitest | 5.0.1 (con jsdom 30 y Testing Library 16) |
| Playwright + axe | 1.63.x / 4.13.x |
| ESLint / Prettier | 9 (flat config) / 3.9.8 |
| shadcn/ui (CLI) | 4.21.x, estilo `radix-nova`, base `radix` |

## Consecuencias

- **Next.js 16 renombró `middleware.ts` a `proxy.ts`** y dejó de usar `next/font` con `variable` de otra
  forma, entre otros cambios menores. Todo el código se escribió verificando la documentación de la
  versión instalada (en F0 se comprobó en la documentación oficial y en el paquete ya instalado).
- `create-next-app` generó además `AGENTS.md` y `CLAUDE.md`: son guías de la propia versión de Next.js
  para agentes de código y no interfieren con `.clinerules`. Se dejan porque ayudan a no escribir código
  de versiones antiguas.
- Cuando se actualice una dependencia mayor, se repite esta comprobación y se anota aquí.
