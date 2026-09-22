import type { components } from "@/lib/api/schema";

/**
 * Tipos de la F4, tomados **siempre** del esquema generado desde el OpenAPI del backend (`pnpm api:types`).
 * No se escriben a mano: si la API cambia, cambian solos.
 *
 * Este es el único archivo de la feature que pueden importar los **componentes cliente**: solo contiene tipos
 * (se borran al compilar), así que no arrastra `@/lib/api/client`, que lanza un error si llega al navegador.
 */

export type Product = components["schemas"]["ProductOut"];
export type ProductVariant = components["schemas"]["VariantOut"];
export type ProductImage = components["schemas"]["ProductImageOut"];
export type ProductReview = components["schemas"]["ReviewOut"];
export type ProductQuestion = components["schemas"]["QuestionOut"];
export type ProductAnswer = components["schemas"]["AnswerOut"];
export type ReviewList = components["schemas"]["ReviewListOut"];
export type QuestionList = components["schemas"]["QuestionListOut"];
export type InventoryItem = components["schemas"]["InventoryItemOut"];

/** Respuesta de la ruta BFF que publica una pregunta. */
export type AskQuestionPayload = { question: ProductQuestion };

/**
 * Unidades disponibles por variante: `{ [variant_id]: unidades }`.
 *
 * Se arma en el servidor a partir del inventario real del backend (`GET /inventory/items/{variant_id}`) y se
 * pasa a los componentes cliente como prop, ya resuelta.
 */
export type Availability = Record<string, number>;
