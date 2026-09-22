/**
 * Validación de claves de objetos (MinIO/S3) que el proxy `/api/media/[...key]` puede servir.
 *
 * Motivo de seguridad: el proxy **no** es un servidor de archivos genérico. Solo se sirven objetos con
 * prefijos públicos (imágenes de productos y, más adelante, logos de tiendas). Cualquier otra cosa
 * —documentos de verificación de vendedores, facturas, respaldos— queda fuera por diseño.
 *
 * Ver `docs/PENDIENTES-BACKEND.md`: lo ideal sería que el backend devolviera la URL ya resuelta.
 */

/** Prefijos que hoy se consideran públicos. El backend genera `products/<32 hex><ext>`. */
export const PUBLIC_MEDIA_PREFIXES = ["products/", "stores/"] as const;

/** Extensiones de imagen permitidas (whitelist, no blacklist). */
export const ALLOWED_MEDIA_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"] as const;

/** Máximo de caracteres que aceptamos en una clave, para cortar entradas absurdas. */
const MAX_KEY_LENGTH = 200;

/** Nombre de objeto: empieza alfanumérico y solo admite letras, números, punto, guion y guion bajo. */
const OBJECT_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

/** Devuelve el prefijo público al que pertenece la clave, o `null` si no es pública. */
export function publicPrefixOf(key: string): string | null {
  return PUBLIC_MEDIA_PREFIXES.find((prefix) => key.startsWith(prefix)) ?? null;
}

/** Extrae la extensión (en minúsculas) de una clave, o `null` si no tiene. */
export function extensionOf(key: string): string | null {
  const lastDot = key.lastIndexOf(".");
  if (lastDot === -1 || lastDot === key.length - 1) {
    return null;
  }
  return key.slice(lastDot + 1).toLowerCase();
}

/**
 * Extensión de imagen que **declara** la clave, o `null`.
 *
 * Acepta las dos formas que existen hoy:
 * - con punto: `products/<32 hex>.png` (lo documentado, y lo que debería generar el backend);
 * - pegada: `products/<32 hex>png` (lo que genera hoy `new_object_key()`; ver el apartado 8 de
 *   `docs/PENDIENTES-BACKEND.md`).
 *
 * Es solo una **pista por el nombre**: la comprobación que de verdad garantiza que el archivo es una imagen es
 * el `Content-Type` que devuelve el almacenamiento (`isImageContentType`), y esa es la que manda.
 */
export function declaredImageExtension(key: string): string | null {
  const withDot = extensionOf(key);

  if (withDot !== null && (ALLOWED_MEDIA_EXTENSIONS as readonly string[]).includes(withDot)) {
    return withDot;
  }

  const glued = /(jpg|jpeg|png|webp|avif)$/i.exec(key);

  return glued === null ? null : glued[1].toLowerCase();
}

/**
 * ¿El tipo real del archivo es una imagen?
 *
 * Regla del proxy: **nunca** se sirve un archivo cuyo `Content-Type` no empiece por `image/`. Es la barrera
 * que sustituye a exigir extensión en el nombre (que el backend no siempre pone) y es más fiable, porque mira
 * el tipo que el almacenamiento tiene registrado. Cualquier otra cosa responde 404.
 */
export function isImageContentType(contentType: string | null | undefined): boolean {
  return typeof contentType === "string" && contentType.trim().toLowerCase().startsWith("image/");
}

/**
 * Indica si la clave puede intentar servirse por el proxy.
 *
 * Reglas (todas obligatorias):
 * 1. Prefijo público conocido (`products/`, `stores/`).
 * 2. Sin subcarpetas anidadas (evita recorridos de ruta como `products/../../etc`).
 * 3. Nombre de objeto con caracteres seguros (nada de espacios, `%`, `?`, `#` ni `:`).
 * 4. Extensión de imagen declarada, con punto (`x.png`) o pegada (`xhexpng`).
 *
 * Pasar estas comprobaciones **no** basta para servir el archivo: la ruta comprueba además que el
 * `Content-Type` real empiece por `image/` (`isImageContentType`).
 */
export function isPublicMediaKey(key: string): boolean {
  if (key.length === 0 || key.length > MAX_KEY_LENGTH) {
    return false;
  }

  const prefix = publicPrefixOf(key);
  if (prefix === null) {
    return false;
  }

  const objectName = key.slice(prefix.length);
  if (objectName.length === 0 || objectName.includes("/")) {
    return false;
  }

  if (!OBJECT_NAME_PATTERN.test(objectName)) {
    return false;
  }

  return declaredImageExtension(objectName) !== null;
}
