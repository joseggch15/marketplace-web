import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Pruebas de componentes y utilidades con Vitest.
 *
 * - `jsdom` simula un navegador para poder probar componentes de React.
 * - El alias `@/` es el mismo que usa TypeScript, para importar igual en pruebas y en la app.
 * - Las pruebas end-to-end viven en `e2e/` y las ejecuta Playwright (`pnpm test:e2e`), por eso se excluyen.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // Dobles de prueba: el router y las imágenes de Next.js no existen en jsdom.
      {
        find: /^next\/navigation$/,
        replacement: fileURLToPath(
          new URL("./src/tests/mocks/next-navigation.tsx", import.meta.url),
        ),
      },
      {
        find: /^next\/link$/,
        replacement: fileURLToPath(
          new URL("./src/tests/mocks/next-navigation.tsx", import.meta.url),
        ),
      },
      {
        find: /^next\/image$/,
        replacement: fileURLToPath(new URL("./src/tests/mocks/next-image.tsx", import.meta.url)),
      },
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
    ],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
    restoreMocks: true,
    // `next-intl` debe procesarse con Vite (en vez de externalizarse) para que el alias de
    // `next/navigation` se aplique: sin esto, el router de Next.js no existe en jsdom y las pruebas de los
    // componentes que usan enlaces (tarjeta de producto) no cargan.
    server: {
      deps: {
        inline: ["next-intl"],
      },
    },
  },
});
