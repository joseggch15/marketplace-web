# 0014 · Formato con Prettier en cada fase

- **Fecha:** 22 de septiembre de 2026
- **Estado:** aceptada

## Contexto

`pnpm format:check` fallaba en **201 archivos**. Al mirarlo de cerca, el problema no era que el código estuviera
mal: el repositorio se clona en Windows con `core.autocrlf=true` (los archivos llegan al disco con CRLF) y
Prettier, con su ajuste por defecto `endOfLine: "lf"`, marcaba **todos** los archivos como mal formateados. Ejecutar
`prettier --write` en ese estado habría reescrito los finales de línea de todo el proyecto sin arreglar nada real:
al volver a clonar, el aviso habría vuelto (git devuelve CRLF y Prettier seguiría esperando LF).

## Decisión

1. **`endOfLine: "auto"` en `.prettierrc`**: Prettier respeta el final de línea que ya tiene cada archivo en lugar
   de imponer uno. Es la opción que hace que `format:check` signifique lo mismo en Windows y en Linux (Vercel, CI),
   que es lo que se quiere: avisar de problemas **de formato**, no del sistema operativo de quien lo clona.
   - Con el ajuste anterior quedaban **71 archivos** con formato pendiente de verdad; se formatearon.
2. **Dos commits separados**, para que el historial se pueda leer:
   - `chore(format)`: el ajuste de `.prettierrc` (un archivo).
   - `style`: `prettier --write` en todo el repositorio (**solo formato**: 70 archivos, 647 inserciones y 605
     borrados). Ninguno cambia comportamiento: el orden de las clases de Tailwind en el marcado no altera el CSS
     generado, porque la especificidad la fija el orden de la hoja, no el del atributo.
3. **`pnpm format:check` entra en la verificación de cada fase**, junto a `lint`, `typecheck`, las pruebas
   unitarias y el `build`. Antes se ejecutaba `pnpm format` (que reescribe) pero no se comprobaba, así que el
   desvío se acumulaba.

## Alternativas descartadas

- **Dejar `endOfLine: "lf"` y formatear todo**: el aviso habría reaparecido en cada clonación en Windows.
- **Quitar los finales de línea del control (`text=auto` en `.gitattributes`)**: es la solución "de manual", pero
  cambia cómo se guardan todos los archivos del repositorio y habría provocado un commit de miles de líneas.

## Consecuencias

- Cualquier cambio que se suba tiene que pasar `pnpm format:check`; el formateador ya no puede "derivar".
- `.prettierignore` sigue dejando fuera lo que se genera solo (`src/lib/api/schema.d.ts`, `openapi.json`,
  `pnpm-lock.yaml`) y lo que no es código (`node_modules`, `.next`, informes de pruebas).
