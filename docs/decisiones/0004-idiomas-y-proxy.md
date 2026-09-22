# 0004 · Estructura de idiomas en Next.js 16 (`proxy.ts`)

**Fecha:** Fase 0 · **Estado:** aceptada

## Decisión

- El idioma vive en la URL (`/es/...`, `/en/...`), con `localePrefix: "always"`: es lo más claro para
  `canonical`, `hreflang` y para compartir enlaces.
- La detección inicial usa el navegador (`Accept-Language`) y la cookie `NEXT_LOCALE` recuerda la
  elección. Un usuario con sesión podrá guardarla además en su perfil (F2).
- **Next.js 16 renombró `middleware.ts` a `proxy.ts`**: la lógica de idiomas está en `src/proxy.ts`, sin
  usar el nombre antiguo (que sigue funcionando por compatibilidad, pero no es el actual).
- Todo el sitio cuelga del segmento `[locale]`, y no hay `app/layout.tsx` raíz: el layout raíz es
  `src/app/[locale]/layout.tsx` (es el único sitio donde se definen `<html>` y `<body>`).
- Páginas especiales: `not-found.tsx` y `error.tsx` dentro de `[locale]` (con el idioma aplicado),
  `[...rest]/page.tsx` para que cualquier URL desconocida muestre el 404 traducido, y
  `global-error.tsx` / `global-not-found.tsx` para los casos en que el idioma no se puede saber.

## Consecuencias

- El encabezado y las páginas son **dinámicos** (usan `getLocale()`, cookies y datos en vivo del backend).
  Es lo normal en un marketplace con sesión; en la F10 se revisará qué se puede volver estático.
- Textos: **ningún texto visible escrito en los componentes**; todos salen de `messages/es.json` y
  `messages/en.json`. Al navegador solo se envían los mensajes del espacio `Error` (los que necesita un
  componente cliente); el resto de textos se resuelven en el servidor y llegan como props. Menos
  JavaScript, menos peso.
- Al idioma se le pasan los tipos: `src/types/next-intl.d.ts` refuerza `next-intl` para que una clave mal
  escrita falle en el `typecheck` en lugar de aparecer como texto raro en pantalla.
- Limitación conocida de la F0: al cambiar de idioma se conserva la ruta, pero **no** los parámetros de
  búsqueda. Se resolverá en la F3, cuando la búsqueda sea real.
