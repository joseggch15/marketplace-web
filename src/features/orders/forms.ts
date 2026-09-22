import { z } from "zod";

/**
 * Esquema del **formulario** de dirección del checkout.
 *
 * Se mantiene sin transformaciones a propósito: React Hook Form y `zodResolver` trabajan mejor con tipos simples
 * (`string`), y así los campos vacíos se pueden validar campo a campo. La normalización (cadena vacía → `null`)
 * la hace el esquema de la ruta BFF antes de llamar al backend.
 */
export const addressFormSchema = z.object({
  recipient: z.string().trim().min(1, "required").max(120, "tooLong"),
  phone: z.string().trim().max(30, "tooLong"),
  line1: z.string().trim().min(1, "required").max(200, "tooLong"),
  line2: z.string().trim().max(200, "tooLong"),
  city: z.string().trim().min(1, "required").max(120, "tooLong"),
  state: z.string().trim().max(120, "tooLong"),
  postalCode: z.string().trim().max(20, "tooLong"),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "countryCode"),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;

/**
 * Claves de error que puede devolver el formulario de dirección.
 *
 * Son las mismas que usa el sistema de campos del proyecto (`Auth.validation`), así que el mensaje se traduce en
 * un solo sitio y el checkout no inventa textos nuevos.
 */
export type AddressFieldError = "required" | "tooLong" | "countryCode";

/** Convierte el mensaje del esquema en una clave de traducción, o `undefined` si el campo está bien. */
export function asFieldError(message: unknown): AddressFieldError | undefined {
  return message === "required" || message === "tooLong" || message === "countryCode"
    ? message
    : undefined;
}

/** Valores iniciales del formulario (país por defecto: Colombia, el país base del proyecto). */
export const EMPTY_ADDRESS_FORM: AddressFormValues = {
  recipient: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "CO",
};

/** ¿El comprador escribió algo en el formulario? (para no perder datos al cambiar de dirección elegida) */
export function addressFormIsEmpty(values: AddressFormValues): boolean {
  return (
    values.recipient.trim().length === 0 &&
    values.line1.trim().length === 0 &&
    values.city.trim().length === 0
  );
}
