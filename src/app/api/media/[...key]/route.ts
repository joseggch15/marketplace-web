import { NextResponse } from "next/server";

import { isImageContentType, isPublicMediaKey } from "@/lib/media/keys";
import { fetchStoredObject } from "@/lib/media/s3";

/**
 * Proxy BFF de imágenes: `/api/media/<clave del objeto>`.
 *
 * Por qué existe: el backend devuelve solo `object_key` y el bucket de MinIO es privado. Así el navegador
 * pide las imágenes a nuestro propio dominio (con caché y sin exponer el almacenamiento).
 * Ver `docs/PENDIENTES-BACKEND.md` (el backend debería devolver la URL ya resuelta).
 *
 * Seguridad (requisito explícito del dueño del producto), en este orden:
 * 1. Solo se sirven claves con prefijo público (`products/`, `stores/`), sin subcarpetas y con caracteres
 *    seguros. Cualquier otra cosa responde 404.
 * 2. **El tipo real del archivo manda:** si el `Content-Type` que devuelve el almacenamiento no empieza por
 *    `image/`, se responde 404 igualmente. Es la barrera que impide usar este proxy para descargar cualquier
 *    otro archivo guardado en MinIO (facturas, documentos de verificación, respaldos), y es más fiable que
 *    fiarse de la extensión del nombre, que el backend no siempre escribe
 *    (ver el apartado 8 de `docs/PENDIENTES-BACKEND.md`).
 * 3. Si el objeto no existe, responde 404 sin revelar si el archivo existe.
 */
export const runtime = "nodejs";

/** Caché de las imágenes optimizadas: 1 hora en el borde y 1 día sirviendo copia mientras revalida. */
const CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
): Promise<Response> {
  const { key } = await params;
  const objectKey = key.join("/");

  if (!isPublicMediaKey(objectKey)) {
    return new NextResponse(null, { status: 404 });
  }

  const stored = await fetchStoredObject(objectKey);
  if (stored === null || stored.body === null) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType = stored.headers.get("content-type");

  if (!isImageContentType(contentType)) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(stored.body, {
    status: 200,
    headers: {
      "content-type": contentType ?? "application/octet-stream",
      "cache-control": CACHE_CONTROL,
      // Segunda barrera, por si algo raro pasara el filtro de tipos:
      // - `nosniff` le prohíbe al navegador adivinar el tipo mirando el contenido;
      // - `default-src 'none'` le prohíbe cargar o ejecutar **cualquier** recurso de este archivo (scripts,
      //   estilos, marcos…). Con las dos juntas, servir un archivo peligroso desde el proxy no ejecutaría nada.
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'",
    },
  });
}
