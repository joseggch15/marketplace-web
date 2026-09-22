import { NextResponse } from "next/server";

import { isPublicMediaKey } from "@/lib/media/keys";
import { fetchStoredObject } from "@/lib/media/s3";

/**
 * Proxy BFF de imágenes: `/api/media/<clave del objeto>`.
 *
 * Por qué existe: el backend devuelve solo `object_key` y el bucket de MinIO es privado. Así el navegador
 * pide las imágenes a nuestro propio dominio (con caché y sin exponer el almacenamiento).
 * Ver `docs/PENDIENTES-BACKEND.md` (el backend debería devolver la URL ya resuelta).
 *
 * Seguridad (requisito explícito del dueño del producto):
 * - Solo se sirven claves con prefijo público (`products/`, `stores/`).
 * - La clave se valida con `isPublicMediaKey()` antes de firmar nada: sin subcarpetas, sin `%`, `?`, `#`
 *   ni `:` y con extensión de imagen conocida.
 * - Nunca se exponen archivos privados (documentos de verificación de vendedores, facturas, respaldos).
 * - Si la clave no es válida o el objeto no existe, responde 404 sin revelar si el archivo existe.
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

  return new NextResponse(stored.body, {
    status: 200,
    headers: {
      "content-type": stored.headers.get("content-type") ?? "application/octet-stream",
      "cache-control": CACHE_CONTROL,
      "x-content-type-options": "nosniff",
    },
  });
}
