# 0006 · Tipos de la API siempre generados (nunca a mano)

**Fecha:** Fase 0 · **Estado:** aceptada

## Decisión

Los tipos de la API se generan desde el OpenAPI del backend con `openapi-typescript` y se consumen con
`openapi-fetch`:

- `pnpm api:types` → lee `http://127.0.0.1:8000/openapi.json` y escribe `src/lib/api/schema.d.ts`.
- `pnpm api:types:offline` → **plan B** para cuando el backend no está corriendo: `scripts/dump-openapi.py`
  importa la aplicación FastAPI y llama a `app.openapi()`, sin levantar el servidor y sin tocar el backend
  (el JSON se escribe dentro del frontend).
- `src/lib/api/schema.d.ts` está **excluido** de ESLint y de Prettier: es un archivo generado y no se
  edita a mano.
- `openapi.json` está en `.gitignore`: es un artefacto que se regenera.

## Por qué

Si los tipos se escriben a mano, se desincronizan del backend y el compilador deja de avisar cuando algo
cambia (un campo renombrado, un enum nuevo). Generándolos, un cambio en la API se convierte en un error de
`typecheck` en lugar de un fallo en producción.

## Cómo se usa

```ts
import { backend } from "@/lib/api/client";

const result = await backend.GET("/api/v1/health", { cache: "no-store" });
// result.data y result.error quedan tipados según el OpenAPI del backend.
```

Las rutas del esquema ya incluyen el prefijo `/api/v1`, por lo que `baseUrl` es solo el host
(`BACKEND_URL`). El módulo lanza un error si se carga en el navegador (regla del BFF).

## Estado en la F0

Los tipos se generaron con `pnpm api:types:offline` porque **el backend no estaba corriendo** (78 rutas
leídas del propio código del backend). Cuando el backend esté levantado hay que ejecutar
`pnpm api:types` y comprobar que el archivo generado no cambia; si cambia, hay que revisar el motivo.
