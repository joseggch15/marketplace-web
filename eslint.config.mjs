import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Regla del proyecto: nada de `any` (ni explícito ni disfrazado).
      "@typescript-eslint/no-explicit-any": "error",
      // `console.log` no debe llegar a producción; sí se permiten errores y avisos.
      "no-console": ["error", { allow: ["error", "warn"] }],
      // Los componentes y hooks deben usar nombres claros (evita archivos "index.tsx" anónimos).
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
    },
  },
  // Prettier al final: desactiva las reglas de formato que no aportan y evitan conflictos.
  eslintConfigPrettier,
  globalIgnores([
    // Valores por defecto de eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Archivos generados o de terceros:
    "src/lib/api/schema.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
