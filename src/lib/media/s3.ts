import { createHash, createHmac } from "node:crypto";

import { env } from "@/lib/env";

/**
 * Firma de peticiones a MinIO/S3 (AWS Signature Version 4) usando solo el módulo `node:crypto`.
 *
 * ¿Por qué a mano y no con el SDK de AWS?
 * El único uso es un `GET` (y un `HEAD`) dentro del servidor de Next.js. El SDK oficial añadiría varios
 * megabytes de dependencias para algo que son ~40 líneas, y la instrucción del proyecto es no agregar
 * librerías pesadas sin justificarlo. La firma se verifica contra el MinIO real (ver
 * `docs/decisiones/0005-proxy-de-medios.md`).
 *
 * El bucket es privado a propósito: ningún archivo se sirve sin firma, y el proxy solo firma claves que
 * pasaron por `isPublicMediaKey()`.
 */

const SERVICE = "s3";
const SIGNED_HEADERS = "host;x-amz-content-sha256;x-amz-date";

/** SHA-256 del cuerpo vacío (los GET no llevan cuerpo). */
const EMPTY_PAYLOAD_SHA256 = createHash("sha256").update("").digest("hex");

/** Fecha en el formato de AWS: `20260922T004500Z`. */
export function toAmzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

/** SHA-256 en hexadecimal. */
function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/** HMAC-SHA256 (devuelve bytes, porque se encadena). */
function hmacSha256(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

/** Codifica una clave de objeto segmento a segmento, dejando las barras intactas. */
function encodeObjectKey(objectKey: string): string {
  return objectKey.split("/").map(encodeURIComponent).join("/");
}

/** Derivación de la clave de firma: fecha → región → servicio → `aws4_request`. */
function signingKey(dateStamp: string): Buffer {
  return hmacSha256(
    hmacSha256(
      hmacSha256(hmacSha256(`AWS4${env.S3_SECRET_KEY}`, dateStamp), env.S3_REGION),
      SERVICE,
    ),
    "aws4_request",
  );
}

export interface SignedRequest {
  /** URL completa del objeto (estilo *path-style*: `http://host/bucket/key`). */
  url: string;
  /** Cabeceras que hay que enviar. El `Host` no se envía: `fetch` lo deriva de la URL. */
  headers: Record<string, string>;
}

/**
 * Construye una petición GET firmada para un objeto del bucket.
 *
 * @param objectKey clave ya validada (ver `isPublicMediaKey`)
 * @param method método HTTP a firmar (`GET` o `HEAD`)
 * @param now fecha de la firma (se inyecta en las pruebas)
 */
export function signObjectRequest(
  objectKey: string,
  method: "GET" | "HEAD" = "GET",
  now: Date = new Date(),
): SignedRequest {
  const endpoint = new URL(env.S3_ENDPOINT_URL);
  const canonicalUri = `/${env.S3_BUCKET}/${encodeObjectKey(objectKey)}`;
  const timestamp = toAmzDate(now);
  const dateStamp = timestamp.slice(0, 8);
  const scope = `${dateStamp}/${env.S3_REGION}/${SERVICE}/aws4_request`;

  const canonicalHeaders =
    `host:${endpoint.host}\n` +
    `x-amz-content-sha256:${EMPTY_PAYLOAD_SHA256}\n` +
    `x-amz-date:${timestamp}\n`;

  const canonicalRequest = [
    method,
    canonicalUri,
    "", // sin query string
    canonicalHeaders,
    SIGNED_HEADERS,
    EMPTY_PAYLOAD_SHA256,
  ].join("\n");

  const stringToSign = ["AWS4-HMAC-SHA256", timestamp, scope, sha256Hex(canonicalRequest)].join(
    "\n",
  );

  const signature = hmacSha256(signingKey(dateStamp), stringToSign).toString("hex");

  return {
    url: `${endpoint.origin}${canonicalUri}`,
    headers: {
      "x-amz-content-sha256": EMPTY_PAYLOAD_SHA256,
      "x-amz-date": timestamp,
      authorization:
        `AWS4-HMAC-SHA256 Credential=${env.S3_ACCESS_KEY}/${scope}, ` +
        `SignedHeaders=${SIGNED_HEADERS}, Signature=${signature}`,
    },
  };
}

/** Pide el objeto al almacenamiento. Devuelve `null` si no existe (404) o no se puede leer. */
export async function fetchStoredObject(objectKey: string): Promise<Response | null> {
  const signed = signObjectRequest(objectKey, "GET");

  try {
    const response = await fetch(signed.url, {
      headers: signed.headers,
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response;
  } catch {
    // El almacenamiento no responde: el proxy devolverá 404 y la interfaz mostrará su imagen alternativa.
    return null;
  }
}
