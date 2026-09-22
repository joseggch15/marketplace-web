/**
 * Validación de identificadores de la feature de pedidos.
 *
 * Se valida **antes** de llamar al backend: una dirección con basura no gasta una petición y responde 404 con el
 * mismo `code` que usaría la API, para que el navegador lo traduzca igual sin importar dónde se detectó.
 */

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** ¿El valor tiene forma de identificador de pedido? */
export function isOrderId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** ¿El valor tiene forma de identificador de pago? */
export function isPaymentId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** ¿El valor tiene forma de identificador de reseña? */
export function isReviewId(value: string): boolean {
  return UUID_PATTERN.test(value);
}
