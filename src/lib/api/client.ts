import createClient from "openapi-fetch";

import { env } from "@/lib/env";

import type { paths } from "./schema";

/**
 * Cliente tipado del backend (FastAPI).
 *
 * ⚠️ Solo se usa en el **servidor** (patrón BFF): el navegador nunca habla con el backend ni ve tokens.
 * El guardia de abajo avisa si alguien lo importa por error desde un componente cliente.
 *
 * Las rutas del `schema.d.ts` ya incluyen el prefijo `/api/v1`, por eso `baseUrl` es solo el host.
 * Los tipos se regeneran con `pnpm api:types` (nunca a mano).
 */
if (typeof window !== "undefined") {
  throw new Error(
    "El cliente del backend solo puede usarse en el servidor. Para datos en el navegador, " +
      "crea una ruta BFF en src/app/api o consulta el backend desde un Server Component.",
  );
}

export const backend = createClient<paths>({
  baseUrl: env.BACKEND_URL,
  headers: { accept: "application/json" },
});

/** Tipos reexportados del esquema generado, para no escribirlos a mano en las features. */
export type { components, paths } from "./schema";
