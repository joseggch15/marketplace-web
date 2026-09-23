import { NextResponse } from "next/server";

import { problemResponse, unauthorizedResponse } from "@/features/auth/bff";
import { withAccessToken } from "@/features/auth/session";
import { attachImage, requestUploadUrl, uploadImageBytes } from "@/features/seller/api";
import { isProductId } from "@/features/seller/params";
import { MAX_IMAGE_BYTES, UPLOADABLE_IMAGE_TYPES } from "@/features/seller/types";

/**
 * `POST /api/seller/products/{productId}/images` — sube una imagen y la adjunta al producto.
 *
 * La imagen va como `FormData` y el recorrido es de tres pasos, **todos desde el servidor**:
 * 1. se valida el tipo contra la lista blanca (`UPLOADABLE_IMAGE_TYPES`, sin SVG) y el tamaño;
 * 2. se pide una URL firmada al backend y se suben los bytes al almacenamiento;
 * 3. se adjunta la clave al producto (con su texto alternativo y su posición).
 *
 * Por qué desde el servidor: el navegador no tiene que hablar con MinIO (CORS) ni ver la URL firmada, y el
 * archivo pasa por un único punto donde se comprueba el tipo. Un SVG se rechaza aquí aunque el navegador lo
 * declare como imagen: servido desde nuestro dominio ejecutaría su JavaScript con la sesión del usuario.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" } as const;

/** Extensiones que se aceptan, emparejadas con su tipo. El nombre del archivo no se usa para nada más. */
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
): Promise<NextResponse> {
  const { productId } = await params;

  if (!isProductId(productId)) {
    return problemResponse(404, "product_not_found", "The product id is not valid.");
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return problemResponse(400, "validation_error", "The request body is not a valid form.");
  }

  const file = form.get("file");

  if (!(file instanceof File)) {
    return problemResponse(422, "validation_error", "An image file is required.");
  }

  const contentType = file.type.trim().toLowerCase();

  if (!(UPLOADABLE_IMAGE_TYPES as readonly string[]).includes(contentType)) {
    return problemResponse(422, "unsupported_image_type", "That image format is not supported.");
  }

  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    return problemResponse(422, "image_too_large", "The image is empty or too large.");
  }

  const altField = form.get("alt");
  const alt = typeof altField === "string" && altField.trim().length > 0 ? altField.trim() : null;
  const positionField = form.get("position");
  const parsedPosition = typeof positionField === "string" ? Number(positionField) : 0;
  const position =
    Number.isInteger(parsedPosition) && parsedPosition >= 0 && parsedPosition <= 100
      ? parsedPosition
      : 0;

  const signed = await withAccessToken((token) =>
    requestUploadUrl(token, contentType, EXTENSIONS[contentType]),
  );

  if (!signed.ok) {
    return signed.status === 401
      ? unauthorizedResponse()
      : problemResponse(
          502,
          signed.code ?? "internal_error",
          "The upload URL could not be created.",
        );
  }

  const uploaded = await uploadImageBytes(
    signed.data.upload_url,
    contentType,
    await file.arrayBuffer(),
  );

  if (!uploaded) {
    return problemResponse(502, "upload_failed", "The image could not be stored.");
  }

  const attached = await withAccessToken((token) =>
    attachImage(token, productId, { object_key: signed.data.object_key, alt, position }),
  );

  if (!attached.ok) {
    return attached.status === 401
      ? unauthorizedResponse()
      : problemResponse(
          attached.status,
          attached.code ?? "internal_error",
          "The image could not be attached.",
        );
  }

  return NextResponse.json({ image: attached.data }, { status: 201, headers: noStore });
}
