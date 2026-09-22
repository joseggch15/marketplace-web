import { z } from "zod";

/**
 * Validación del formulario de preguntas.
 *
 * Los límites están **copiados del backend** (`app/modules/reviews/schemas.py`, `QuestionCreate`): de 3 a 2000
 * caracteres. Así el usuario ve el error antes de enviar; aun así, la ruta BFF vuelve a validar siempre,
 * porque una petición puede venir de cualquier cliente.
 *
 * Los mensajes son **claves de traducción** (no frases): el formulario las traduce con next-intl y el mismo
 * esquema sirve para todos los idiomas.
 */

export const QUESTION_MIN_LENGTH = 3;
export const QUESTION_MAX_LENGTH = 2000;

/** Claves de traducción de los mensajes de validación (viven en `Product.validation`). */
export const QUESTION_VALIDATION_KEYS = ["questionShort", "questionLong"] as const;

export type QuestionValidationKey = (typeof QUESTION_VALIDATION_KEYS)[number];

/**
 * Convierte el mensaje que devuelve Zod en una clave de traducción **verificada**; si no es una clave
 * conocida, devuelve `undefined` y el campo muestra su mensaje genérico en lugar de un texto raro.
 */
export function asQuestionValidationKey(message?: string): QuestionValidationKey | undefined {
  return message !== undefined && (QUESTION_VALIDATION_KEYS as readonly string[]).includes(message)
    ? (message as QuestionValidationKey)
    : undefined;
}

/** Cuerpo que acepta la ruta BFF: la misma forma (`{ body }`) que espera el backend. */
export const questionBody = z.object({
  body: z.string().trim().min(QUESTION_MIN_LENGTH).max(QUESTION_MAX_LENGTH),
});

/** Formulario del navegador: el campo se valida con las mismas reglas, pero con mensajes traducibles. */
export const askQuestionSchema = z.object({
  body: z
    .string()
    .trim()
    .min(QUESTION_MIN_LENGTH, { message: "questionShort" })
    .max(QUESTION_MAX_LENGTH, { message: "questionLong" }),
});

export type AskQuestionValues = z.infer<typeof askQuestionSchema>;
