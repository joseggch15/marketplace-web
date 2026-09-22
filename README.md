# ecommerce-web

Frontend del marketplace multi-vendedor. Consume la API REST del backend (FastAPI) que vive en
`E:\ecommerce`. Proyecto independiente: **no modifica nada del backend**.

## Estado

**Fase 0 (fundamentos) completada.** Ver `docs/PROGRESO.md`.

## Requisitos

- Node.js LTS (probado con v24.19.0) y **pnpm** (`npm install -g pnpm`)
- El backend corriendo en `http://127.0.0.1:8000` (para datos e imágenes)

## Puesta en marcha

```powershell
pnpm install
Copy-Item .env.example .env.local   # ajusta los valores si hace falta
pnpm dev
```

Abre http://localhost:3000 (te redirige a `/es` o `/en` según tu navegador).

## Comandos

| Comando                     | Para qué                                                      |
| --------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                  | Servidor de desarrollo                                        |
| `pnpm build` / `pnpm start` | Compilación y servidor de producción                          |
| `pnpm lint`                 | ESLint                                                        |
| `pnpm typecheck`            | TypeScript en modo estricto                                   |
| `pnpm test`                 | Pruebas de componentes y utilidades (Vitest)                  |
| `pnpm test:e2e`             | Pruebas end-to-end con accesibilidad (Playwright + axe)       |
| `pnpm format`               | Prettier                                                      |
| `pnpm api:types`            | **Regenera los tipos de la API** desde el OpenAPI del backend |
| `pnpm api:types:offline`    | Igual, pero sin levantar el backend (lee su código)           |

Antes de la primera ejecución de `pnpm test:e2e` hay que instalar el navegador de Playwright:

```powershell
pnpm exec playwright install chromium
```

## Documentación

- `docs/PROYECTO.md` — el encargo completo y las decisiones de producto.
- `docs/PROGRESO.md` — qué está hecho y qué falta, fase por fase.
- `docs/PENDIENTES-BACKEND.md` — cambios que conviene hacer en el backend, con el motivo.
- `docs/decisiones/` — decisiones técnicas explicadas (ADR ligero).
- `.clinerules` — reglas que se aplican al programar en este proyecto.

## Seguridad y accesibilidad como requisitos

- El navegador **nunca** guarda tokens: la sesión vive en cookies httpOnly gestionadas por el servidor de
  Next.js (patrón BFF).
- El proxy de imágenes `/api/media/[...key]` solo sirve claves con prefijos públicos y extensión de imagen
  validada; nunca expone archivos privados.
- Sin errores de axe en las páginas nuevas, contraste WCAG AA (con prueba automática de los tokens), foco
  visible y navegación completa con teclado.
