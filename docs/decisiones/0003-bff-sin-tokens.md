# 0003 · BFF: el navegador nunca ve ni guarda tokens

**Fecha:** Fase 0 · **Estado:** aceptada

## Decisión

Todo el tráfico hacia el backend sale del **servidor de Next.js** (patrón *backend for frontend*):

- El navegador habla solo con `http://localhost:3000`.
- El inicio de sesión (F2) se hará en una ruta BFF (`src/app/api/auth/...`), que guardará el
  `access_token` y el `refresh_token` en **cookies httpOnly, Secure y SameSite=Lax**, y renovará el access
  token cuando caduque (el backend expone `POST /api/v1/auth/refresh`, que además rota el refresh).
- **Prohibido** guardar tokens en `localStorage` o `sessionStorage`. La única excepción son preferencias
  no sensibles: el tema y el idioma (`NEXT_LOCALE`), que no sirven para suplantar a nadie.
- Las variables del backend (`BACKEND_URL`, credenciales de S3) **no** llevan el prefijo `NEXT_PUBLIC_`,
  así que nunca llegan al navegador, y `src/lib/env.ts` las valida con Zod al arrancar.

## Consecuencias

- Si alguien consigue inyectar código en la página, **no encuentra ningún token que robar**.
- Beneficios añadidos: no hace falta CORS entre el navegador y el backend, y las llamadas se pueden
  cachear y componer desde el servidor.
- Coste: el servidor de Next.js hace de intermediario (un salto más en cada petición). Es asumible y es
  el precio de la seguridad.
- Detalle del carrito de invitado: el backend identifica al invitado con el header `X-Cart-Token`. Ese
  token vivirá también en una cookie httpOnly gestionada por el servidor (F5), y al iniciar sesión se
  fusionará con el carrito del usuario (`POST /api/v1/cart/merge`).

## Guardia técnica

`src/lib/api/client.ts` lanza un error si el módulo se carga alguna vez en el navegador. (El paquete
`server-only` hace lo mismo en tiempo de compilación; no se instaló para no sumar dependencias, pero se
puede añadir si se prefiere un aviso al compilar.)
