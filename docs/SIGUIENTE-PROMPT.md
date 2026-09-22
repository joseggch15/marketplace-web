# Prompt de continuación — marketplace-api (frontend)

Copia y pega esto al abrir una tarea nueva. Sirve para que la nueva sesión arranque con el contexto y las
reglas correctas, sin releer todo el proyecto.

---

## Contexto

- Repositorio del frontend: **`E:\ecommerce-web`** (Next.js App Router + TypeScript `strict` + Tailwind +
  shadcn/ui + TanStack Query + next-intl + Vitest + Playwright).
- Backend: **`E:\ecommerce`** (FastAPI, `http://127.0.0.1:8000`), **de solo lectura** desde aquí. Si hace falta
  un cambio allá, se anota en `docs/PENDIENTES-BACKEND.md` y se sigue. El backend lo arranca y lo detiene el
  dueño, nunca yo.
- Lee `docs/PROGRESO.md` (estado real por fase), `docs/PROYECTO.md` (arquitectura decidida) y
  `docs/decisiones/` (una nota por decisión) antes de escribir código.
- **Todo comando debe usar rutas absolutas y empezar con `Set-Location 'E:\ecommerce-web'`**, porque el
  directorio de trabajo del editor es `E:\ecommerce`.

## Reglas de terminal (obligatorias)

- **Ningún comando largo de una sola línea.** Si hacen falta más de dos comandos, se escribe un script `.ps1`
  en `%TEMP%` y se ejecuta con
  `powershell -NoProfile -ExecutionPolicy Bypass -File <ruta del script>`.
- **Redirige siempre la salida a un archivo** de `%TEMP%` y lee solo las últimas 30 líneas o las líneas de
  error. Nunca leas un archivo completo si puede ser enorme (HTML renderizado, barras de progreso).
- **Todo script largo debe escribir como última línea de su archivo de salida:** `FIN exit=<código>`.
- **Esperar procesos largos:** existe `%TEMP%\esperar.ps1` con `-Archivo` e `-Intento`. Revisa el archivo cada
  10 segundos, imprime `esperando <segundos>s (intento <n>)` en cada revisión para que la terminal no quede en
  silencio, termina al encontrar `FIN` o a los 8 minutos, e imprime solo las últimas 15 líneas. Se invoca con
  `-Intento 1`, luego `2`, `3`… (nunca dos llamadas idénticas). **Máximo 6 intentos por proceso.**
- **Nunca leas el mismo archivo dos veces seguidas.** Si un intento termina sin `FIN`, el siguiente intento se
  hace con `esperar.ps1`, no leyendo el archivo.
- **Lanza los procesos largos en segundo plano** con `Start-Process -WindowStyle Hidden` y salida redirigida a
  `%TEMP%`: así la terminal queda libre para esperar y el proceso no se interrumpe.
- Si tras 6 intentos no hay `FIN`, comprueba si el proceso sigue vivo; si está colgado, deténlo, anótalo en
  `docs/PROGRESO.md` y continúa.
- Después de cada tanda, comprueba `$LASTEXITCODE` y anótalo en el archivo de resultados.
- **PowerShell 5.1:** `Set-Content -Encoding utf8` añade BOM y rompe `JSON.parse`. Para reescribir un archivo
  usa `[System.IO.File]::WriteAllText($ruta, $texto, (New-Object System.Text.UTF8Encoding($false)))`.

---

## Estado actual: **F1 cerrada**

F0 (base del proyecto) y F1 (sistema de diseño) están terminadas, verificadas y confirmadas. Resumen:

| Comprobación | Resultado |
|---|---|
| `pnpm lint` | 0 |
| `pnpm typecheck` | 0 |
| `pnpm test` | todo en verde (9 archivos) |
| `pnpm test:e2e` | **46 pruebas en verde** (con la caché de compilación borrada) |
| `pnpm build` | 0 |

La página `/[locale]/design-system` (con `noindex`, fuera del sitemap y bloqueada en `robots.txt`) muestra los
tokens, la tipografía, los tres acentos, los componentes de shadcn/ui y los 9 componentes de dominio, en claro
y oscuro, a 375 px y 1280 px.

**Decisión pendiente del dueño:** el acento definitivo (turquesa, coral o violeta). Se cambia en una sola
línea (`data-accent` en `src/app/[locale]/layout.tsx`) y el contraste de los tres ya está validado.

---

## Siguiente tarea

**F2 · Autenticación y cuenta.** El plan detallado está en `docs/PROGRESO.md` (sección «Fase 2 · Autenticación
y cuenta»). En resumen:

1. Rutas BFF en `src/app/api/auth/` (`register`, `login`, `logout`, `refresh`, `session`) con **cookies
   httpOnly, Secure y SameSite=Lax**. El navegador nunca ve tokens.
2. Páginas `/[locale]/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/account`
   y `/account/addresses`.
3. `features/auth` con esquemas Zod, React Hook Form y hooks de TanStack Query.
4. Errores traducidos por el campo `code` estable de la API (RFC 9457), no por el texto en inglés.
5. Guardia de sesión para `/account/**` y enlaces reales de cuenta en el encabezado y el pie.

**Antes de escribir código:** muéstrame el plan corto (páginas, componentes y endpoints del backend) y espera mi
aprobación. Una fase a la vez. No empieces la F2 sin que yo lo pida.

## Definición de «terminado» de cada fase

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` y `pnpm build` en verde; sin infracciones de axe en
las páginas nuevas; accesibilidad con teclado y contraste AA; `docs/PROGRESO.md` y `docs/decisiones/`
actualizados; un commit por fase con mensaje en inglés (por ejemplo
`feat(f2): authentication, account and addresses with BFF session cookies`).
