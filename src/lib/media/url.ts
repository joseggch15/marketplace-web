import { isPublicMediaKey } from "./keys";

/**
 * URL pública de una imagen almacenada (MinIO/S3) servida por nuestro propio proxy.
 *
 * El backend devuelve claves (`products/<32 hex>.jpg`), no URLs. Se construye `/api/media/<clave>`, que:
 * - solo sirve claves con prefijo público y formato válido (`isPublicMediaKey`), así que cualquier otra cosa
 *   devuelve `null` y la interfaz muestra "sin imagen" en vez de un enlace roto;
 * - se sirve desde nuestro dominio, con caché, sin exponer el almacenamiento.
 *
 * Ver `docs/decisiones/0005-proxy-de-medios.md` y el apartado 1 de `docs/PENDIENTES-BACKEND.md`: cuando el
 * backend devuelva la URL resuelta, esta función desaparece.
 */
export function mediaUrl(objectKey: string | null | undefined): string | null {
  if (objectKey === null || objectKey === undefined || !isPublicMediaKey(objectKey)) {
    return null;
  }

  return `/api/media/${objectKey}`;
}
