import { describe, expect, it } from "vitest";

import {
  QUESTION_MAX_LENGTH,
  QUESTION_MIN_LENGTH,
  asQuestionValidationKey,
  askQuestionSchema,
  questionBody,
} from "./schemas";
import { questionErrorMessageKey } from "./error-codes";

/**
 * Pruebas de la validación de la pregunta y de la traducción de sus errores.
 *
 * Los límites (3 y 2000 caracteres) son los del backend (`app/modules/reviews/schemas.py`). Si alguien cambia
 * uno aquí, esta prueba falla y obliga a mirar también el backend: es la red que evita que el usuario vea un
 * error en el navegador y otro distinto del servidor.
 */

describe("askQuestionSchema", () => {
  it("acepta una pregunta normal y quita los espacios de los extremos", () => {
    const parsed = askQuestionSchema.parse({ body: "  ¿Tiene garantía?  " });

    expect(parsed.body).toBe("¿Tiene garantía?");
  });

  it("exige al menos 3 caracteres, igual que el backend", () => {
    expect(QUESTION_MIN_LENGTH).toBe(3);
    const result = askQuestionSchema.safeParse({ body: "ok" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("questionShort");
  });

  it("no acepta una pregunta que solo son espacios", () => {
    expect(askQuestionSchema.safeParse({ body: "   " }).success).toBe(false);
  });

  it("rechaza más de 2000 caracteres", () => {
    expect(QUESTION_MAX_LENGTH).toBe(2000);
    const result = askQuestionSchema.safeParse({ body: "a".repeat(2001) });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("questionLong");
  });
});

describe("questionBody (cuerpo que acepta la ruta BFF)", () => {
  it("acepta la misma forma que el backend: `{ body }`", () => {
    expect(questionBody.parse({ body: "¿Llega mañana?" })).toEqual({ body: "¿Llega mañana?" });
  });

  it("rechaza cuerpos inválidos o con campos de más", () => {
    expect(questionBody.safeParse({ body: "no" }).success).toBe(false);
    expect(questionBody.safeParse({ body: "¿Llega mañana? ".repeat(200) }).success).toBe(false);
    expect(questionBody.safeParse({}).success).toBe(false);
  });
});

describe("asQuestionValidationKey", () => {
  it("acepta solo claves de traducción conocidas", () => {
    expect(asQuestionValidationKey("questionShort")).toBe("questionShort");
    expect(asQuestionValidationKey("algo-raro")).toBeUndefined();
    expect(asQuestionValidationKey(undefined)).toBeUndefined();
  });
});

describe("questionErrorMessageKey", () => {
  it("reconoce los códigos que puede devolver el backend", () => {
    expect(questionErrorMessageKey("unauthorized")).toBe("unauthorized");
    expect(questionErrorMessageKey("too_many_requests")).toBe("too_many_requests");
    expect(questionErrorMessageKey("validation_error")).toBe("validation_error");
    expect(questionErrorMessageKey("not_found")).toBe("not_found");
  });

  it("cae en `unknown` con códigos desconocidos o valores que no son texto", () => {
    expect(questionErrorMessageKey("codigo_inventado")).toBe("unknown");
    expect(questionErrorMessageKey(null)).toBe("unknown");
    expect(questionErrorMessageKey(42)).toBe("unknown");
    expect(questionErrorMessageKey(undefined)).toBe("unknown");
  });
});
