# 0005 · Proxy de medios `/api/media/[...key]` (seguro por diseño)

**Fecha:** Fase 0 · **Estado:** aceptada

## Problema

El backend devuelve solo `object_key` (por ejemplo `products/9c1f...e4.jpg`) y el bucket de MinIO es
privado, así que el navegador no puede cargar las imágenes. Ver `docs/PENDIENTES-BACKEND.md`.

## Decisión

Un proxy interno en el servidor de Next.js: `GET /api/media/<clave>`.

1. **La clave se valida antes de firmar nada** (`isPublicMediaKey`, en `src/lib/media/keys.ts`):
   - Solo prefijos públicos: `products/` (lo que genera hoy el backend) y `stores/` (reservado para logos).
   - Sin subcarpetas anidadas ni `..`: impide recorridos de ruta.
   - Solo caracteres seguros en el nombre del archivo.
   - Extensión dentro de una lista blanca de imágenes (`jpg, jpeg, png, webp, avif`).
   - Si algo no encaja, responde **404** sin revelar si el archivo existe.
     **Nunca** se sirven documentos de verificación de vendedores ni ningún archivo privado.
2. **La petición al almacenamiento se firma con AWS Signature V4** (`src/lib/media/s3.ts`), implementada
   con `node:crypto`.
   - ¿Por qué a mano y no con el SDK de AWS? Porque el uso es un único `GET` dentro del servidor y el SDK
     añadiría megabytes de dependencias; la decisión del proyecto es no sumar librerías pesadas sin
     justificarlo. La firma es código acotado (~40 líneas) y tiene pruebas.
   - Si esto crece (subidas desde el navegador, multipart, borrados), se cambia al SDK oficial.
3. **El navegador solo habla con nuestro dominio.** El archivo se transmite con cabeceras de caché
   (`public, max-age=3600, stale-while-revalidate=86400`) y `X-Content-Type-Options: nosniff`.

## Consecuencias

- Las imágenes funcionan aunque el bucket siga siendo privado y sin exponer MinIO.
- Coste: la imagen pasa por el servidor de Next.js. Para un marketplace real conviene que el backend
  devuelva una URL propia o de CDN (por eso está anotado como pendiente).
- Pruebas: `src/lib/media/keys.test.ts` cubre los ataques típicos (recorridos de ruta, otros prefijos,
  extensiones ejecutables, claves absurdas). El test de la firma contra el MinIO real se hará cuando el
  backend esté corriendo y existan imágenes subidas.
