import { z } from "zod";

/**
 * Validación de los formularios de la F2.
 *
 * Los límites están **copiados del backend** (`app/modules/identity/schemas.py`) para que el usuario vea el
 * error antes de enviar: contraseña de 8 a 128 caracteres, nombre de 1 a 120, país de 2 letras, moneda de 3.
 * Aun así, el servidor vuelve a validar siempre: esta validación es comodidad, no seguridad.
 *
 * Los mensajes son **claves de traducción** (no frases): el formulario las traduce con next-intl, así el
 * mismo esquema sirve para todos los idiomas.
 */

/** Claves de traducción de los mensajes de validación (viven en `messages/*.json`, `Auth.validation`). */
export const VALIDATION_KEYS = [
  "required",
  "emailInvalid",
  "passwordShort",
  "passwordTooLong",
  "passwordMismatch",
  "fullNameRequired",
  "tooLong",
  "countryCode",
  "currencyCode",
] as const;

export type ValidationKey = (typeof VALIDATION_KEYS)[number];

/**
 * Convierte el mensaje que devuelve Zod en una clave de traducción **verificada**.
 *
 * Zod devuelve el texto tal cual se escribió en el esquema, así que aquí se comprueba que sea una clave
 * conocida; si no lo es, devuelve `undefined` y el campo muestra su mensaje genérico en vez de un texto raro.
 */
export function asValidationKey(message?: string): ValidationKey | undefined {
  return message !== undefined && (VALIDATION_KEYS as readonly string[]).includes(message)
    ? (message as ValidationKey)
    : undefined;
}

const emailField = z
  .string()
  .trim()
  // Igual que el backend (`_normalize_email`): el correo se guarda en minúsculas, para que "Ana@Correo.COM"
  // y "ana@correo.com" sean la misma cuenta.
  .toLowerCase()
  .min(1, { message: "required" })
  .refine((value) => z.email().safeParse(value).success, { message: "emailInvalid" });

const passwordField = z
  .string()
  .min(8, { message: "passwordShort" })
  .max(128, { message: "passwordTooLong" });

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { message: "required" }).max(128, { message: "passwordTooLong" }),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, { message: "fullNameRequired" })
      .max(120, { message: "tooLong" }),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, { message: "required" }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({
    newPassword: passwordField,
    confirmPassword: z.string().min(1, { message: "required" }),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { message: "fullNameRequired" })
    .max(120, { message: "tooLong" }),
  preferredCurrency: z
    .string()
    .trim()
    .length(3, { message: "currencyCode" })
    .transform((value) => value.toUpperCase()),
  preferredLanguage: z
    .string()
    .trim()
    .min(2, { message: "required" })
    .max(10, { message: "tooLong" }),
  timezone: z.string().trim().min(1, { message: "required" }).max(64, { message: "tooLong" }),
});

export const addressSchema = z.object({
  label: z.string().trim().min(1, { message: "required" }).max(50, { message: "tooLong" }),
  recipientName: z.string().trim().min(1, { message: "required" }).max(120, { message: "tooLong" }),
  line1: z.string().trim().min(1, { message: "required" }).max(255, { message: "tooLong" }),
  line2: z.string().trim().max(255, { message: "tooLong" }).optional().or(z.literal("")),
  city: z.string().trim().min(1, { message: "required" }).max(100, { message: "tooLong" }),
  state: z.string().trim().max(100, { message: "tooLong" }).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20, { message: "tooLong" }).optional().or(z.literal("")),
  country: z
    .string()
    .trim()
    .length(2, { message: "countryCode" })
    .transform((value) => value.toUpperCase()),
  phone: z.string().trim().max(30, { message: "tooLong" }).optional().or(z.literal("")),
  isDefault: z.boolean(),
});

/** Contraseña nueva, usada por el formulario de restablecer. */
export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type AddressValues = z.infer<typeof addressSchema>;
