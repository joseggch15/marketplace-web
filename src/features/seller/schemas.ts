import { z } from "zod";

import type { NewShipment, NewVariant } from "./types";
import { buildVariants, countCombinations, parseValues, type AttributeValues } from "./variants";

/**
 * Validación del panel del vendedor (Zod).
 *
 * Se usa **dos veces**, como en el resto del proyecto: en el formulario (React Hook Form) para avisar campo a
 * campo y en la **ruta BFF**, que vuelve a validar antes de hablar con el backend. El servidor no se fía nunca de
 * lo que llega del navegador, aunque el formulario ya lo haya comprobado.
 *
 * Los importes viajan como **texto decimal** (`"89900.00"`), igual que en la API: el frontend no convierte dinero a
 * `number` en ningún punto (regla del proyecto).
 */

/** Claves de validación: existen en `Seller.validation.*` en los dos idiomas. */
export type SellerValidationKey =
  | "required"
  | "tooShort"
  | "tooLong"
  | "invalid"
  | "min"
  | "max"
  | "money"
  | "url"
  | "noVariants"
  | "tooManyVariants";

const VALIDATION_KEYS: readonly SellerValidationKey[] = [
  "required",
  "tooShort",
  "tooLong",
  "invalid",
  "min",
  "max",
  "money",
  "url",
  "noVariants",
  "tooManyVariants",
];

/**
 * Convierte el mensaje que devuelve Zod en una clave de traducción **verificada**.
 *
 * Zod devuelve el texto tal cual se escribió en el esquema (una clave), así que aquí se comprueba que sea
 * conocida; si no lo es, el campo muestra su mensaje genérico en lugar de un texto raro.
 */
export function asSellerValidationKey(message?: string): SellerValidationKey | undefined {
  return message !== undefined && VALIDATION_KEYS.includes(message as SellerValidationKey)
    ? (message as SellerValidationKey)
    : undefined;
}

/** Tope de variantes por producto: de sobra para el prototipo. */
const MAX_VARIANTS = 100;

const trimmed = (max: number) => z.string().trim().max(max, "tooLong");

/**
 * Texto opcional que el navegador manda como `null` cuando está vacío: se normaliza a `null`.
 *
 * Se usa `nullish()` y no `optional()` a propósito: el cliente envía `null`, y `optional()` acepta `undefined`
 * pero **rechaza `null`** (el mismo detalle que costó un 422 en el checkout).
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "tooLong")
    .nullish()
    .transform((value) =>
      value === undefined || value === null || value.length === 0 ? null : value,
    );

/** Importe decimal positivo, sin separador de miles y con dos cifras como máximo. */
export const moneySchema = z
  .string()
  .trim()
  .regex(/^\d{1,9}(\.\d{1,2})?$/, "money")
  .refine((value) => !/^0+(\.0+)?$/.test(value), "min");

/** Importe que puede ser cero (el costo de un envío propio). */
const nonNegativeMoneySchema = z
  .string()
  .trim()
  .regex(/^\d{1,9}(\.\d{1,2})?$/, "money");

/** Unidades en stock: entero entre 0 y 100 000 (el mismo rango holgado que admite el backend). */
export const stockSchema = z.coerce.number().int("invalid").min(0, "min").max(100_000, "max");

/** Crear la tienda (`POST /sellers/me`). */
export const storeFormSchema = z.object({
  name: trimmed(120).min(3, "tooShort"),
  description: optionalText(500),
});

export type StoreFormValues = z.input<typeof storeFormSchema>;
export type StoreBody = z.output<typeof storeFormSchema>;

/** Un atributo de la categoría con los valores que escribe el vendedor («rojo, azul»). */
const attributeValuesSchema = z.object({
  attributeId: z.uuid("invalid"),
  valuesText: trimmed(300),
});

/**
 * Campos «planos» de un producto: los que valida el formulario campo a campo.
 *
 * Existe separado del esquema completo porque las **variantes** no las escribe el vendedor: nacen del producto
 * cartesiano de los valores de los atributos (que sí se validan aparte, con las funciones ya probadas de
 * `variants.ts`). Así el formulario puede avisar de un precio mal escrito sin exigir antes los atributos.
 */
export const productFieldsSchema = z.object({
  title: trimmed(200).min(3, "tooShort"),
  description: optionalText(2000),
  brand: optionalText(120),
  categoryId: z.uuid("invalid"),
  skuPrefix: trimmed(24),
  price: moneySchema,
  stock: stockSchema,
});

export type ProductFieldsInput = z.input<typeof productFieldsSchema>;
export type ProductFieldsData = z.output<typeof productFieldsSchema>;

/**
 * Crear un producto con sus variantes (`POST /catalog/products`).
 *
 * El número de variantes no se escribe: sale del **producto cartesiano** de los valores, así que se comprueba aquí
 * que haya al menos una (sin variantes el producto no se puede comprar) y que no sean demasiadas.
 */
export const productFormSchema = productFieldsSchema
  .extend({
    attributes: z.array(attributeValuesSchema).max(10, "max"),
  })
  .superRefine((values, ctx) => {
    const combinations = countCombinations(toAttributeValues(values.attributes));

    if (combinations === 0) {
      ctx.addIssue({ code: "custom", message: "noVariants", path: ["attributes"] });
      return;
    }

    if (combinations > MAX_VARIANTS) {
      ctx.addIssue({ code: "custom", message: "tooManyVariants", path: ["attributes"] });
    }
  });

export type ProductFormValues = z.input<typeof productFormSchema>;
export type ProductFormData = z.output<typeof productFormSchema>;

/** Cambiar título, descripción o marca de un producto propio (`PATCH /catalog/products/{id}`). */
export const productUpdateSchema = z.object({
  title: trimmed(200).min(3, "tooShort"),
  description: optionalText(2000),
  brand: optionalText(120),
});

export type ProductUpdateValues = z.input<typeof productUpdateSchema>;

/** Stock nuevo de una variante (`PATCH …/variants/{variant_id}/stock`): valor absoluto, no un incremento. */
export const stockUpdateSchema = z.object({ stock: stockSchema });

/**
 * Acciones de publicación: son los tres endpoints que tiene la API.
 *
 * La API solo permite `publish` desde borrador, `pause` desde activo y `close` desde cualquier estado que no esté
 * cerrado; la interfaz ofrece solo lo que se puede hacer (`canPublish`/`canPause`/`canClose`).
 */
export const PUBLICATION_ACTIONS = ["publish", "pause", "close"] as const;
export const publicationSchema = z.object({ action: z.enum(PUBLICATION_ACTIONS) });
export type PublicationAction = (typeof PUBLICATION_ACTIONS)[number];

/** Preparar el envío de una venta (`POST /seller/orders/{id}/shipment`). */
export const shipmentFormSchema = z.object({
  carrier: trimmed(120).min(1, "required"),
  trackingNumber: optionalText(80),
  trackingUrl: optionalText(300).refine(
    (value) => value === null || /^https?:\/\//.test(value),
    "url",
  ),
  cost: nonNegativeMoneySchema,
  notes: optionalText(500),
});

export type ShipmentFormValues = z.input<typeof shipmentFormSchema>;
export type ShipmentFormData = z.output<typeof shipmentFormSchema>;

/** Convierte los atributos del formulario en los valores que usa `buildVariants`. */
export function toAttributeValues(
  attributes: { attributeId: string; valuesText: string }[],
): AttributeValues[] {
  return attributes.map((attribute) => ({
    attributeId: attribute.attributeId,
    name: "",
    values: parseValues(attribute.valuesText),
  }));
}

/**
 * Variantes que se mandan a la API al crear el producto.
 *
 * El código base (SKU) es opcional en el formulario: si el vendedor no lo escribe se usa el título. Siempre se
 * añade un número al final (`CAMI-ROJO-M-1`), que hace falta para que dos variantes no compartan SKU (la API lo
 * rechaza con `sku_already_exists`).
 */
export function toVariants(data: ProductFormData): NewVariant[] {
  return buildVariants({
    attributes: toAttributeValues(data.attributes),
    price: data.price,
    stock: data.stock,
    skuPrefix: data.skuPrefix.length > 0 ? data.skuPrefix : data.title,
  });
}

/** Cuerpo del envío tal y como lo espera la API (`ShipmentCreate`). */
export function toShipmentBody(data: ShipmentFormData): NewShipment {
  return {
    carrier: data.carrier,
    tracking_number: data.trackingNumber,
    tracking_url: data.trackingUrl,
    cost: data.cost,
    notes: data.notes,
  };
}
