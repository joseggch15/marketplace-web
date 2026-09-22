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
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
    restoreMocks: true,
  },
});
