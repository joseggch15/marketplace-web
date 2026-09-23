import { compareAmounts, toMinorUnits } from "@/lib/format/money";

import type { NewVariant, ProductVariant, SellerProduct } from "./types";

/**
 * Variantes de un producto: cómo se construyen y cómo se leen.
 *
 * Un producto se vende por **variantes** (una talla, un color, o la combinación de los dos), y la API no tiene
 * ningún endpoint que las genere: el vendedor escribe los valores y el formulario tiene que convertir eso en la
 * lista que espera `ProductCreate`. Esa conversión vive aquí, en funciones **puras y con pruebas**, porque un
 * error en este punto crea productos incompletos o duplicados y porque el resultado se manda tal cual al backend.
 */

export type AttributeValues = {
  /** Identificador del atributo de la categoría (`CategoryAttributeOut.attribute_id`). */
  attributeId: string;
  /** Nombre del atributo, solo para la interfaz («Color»). */
  name: string;
  /** Valores ya limpios («Rojo», «Azul»). */
  values: string[];
};

/**
 * Convierte el texto de un campo en valores limpios.
 *
 * El vendedor escribe «rojo, azul , Rojo» y aquí queda `["rojo", "azul"]`: sin espacios sobrantes, sin vacíos y
 * sin repetidos (comparando sin distinguir mayúsculas, para no crear dos variantes que solo difieren en eso).
 */
export function parseValues(text: string): string[] {
  const seen = new Set<string>();
  const values: string[] = [];

  for (const part of text.split(",")) {
    const value = part.trim();

    if (value.length === 0) {
      continue;
    }

    const key = value.toLocaleLowerCase("es");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    values.push(value);
  }

  return values;
}

/** Atributos que ya tienen al menos un valor: solo con esos se pueden generar variantes. */
export function usableAttributes(attributes: AttributeValues[]): AttributeValues[] {
  return attributes.filter((attribute) => attribute.values.length > 0);
}

/**
 * Cuántas variantes saldrían: el **producto cartesiano** de los valores.
 *
 * Si algún atributo está sin rellenar se cuenta como si no existiera la combinación (`0`), para que la interfaz
 * pueda avisar antes de enviar nada.
 */
export function countCombinations(attributes: AttributeValues[]): number {
  const usable = usableAttributes(attributes);

  if (usable.length === 0) {
    return 0;
  }

  return usable.reduce((total, attribute) => total * attribute.values.length, 1);
}

/** Código de la variante: legible, sin acentos ni espacios y recortado (el SKU es único en el catálogo). */
export function skuFor(prefix: string, values: string[], index: number): string {
  const parts = [prefix, ...values, String(index + 1)].map((part) => normalizeSkuPart(part));

  return parts
    .filter((part) => part.length > 0)
    .join("-")
    .slice(0, 60);
}

function normalizeSkuPart(part: string): string {
  return part
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 12);
}

/**
 * Genera las variantes con el precio y el stock que el vendedor escribió una sola vez.
 *
 * El precio y el stock son **los mismos para todas**: en el prototipo no hay precios por presentación (la API sí
 * los admite, pero pedirlos uno a uno alargaría el formulario sin aportar nada al caso de uso). El stock se
 * reparte entero a cada variante, que es lo que espera la API (`stock` es el total de esa variante).
 */
export function buildVariants(input: {
  attributes: AttributeValues[];
  price: string;
  stock: number;
  skuPrefix: string;
}): NewVariant[] {
  const usable = usableAttributes(input.attributes);

  if (usable.length === 0) {
    return [];
  }

  const combinations = cartesian(usable.map((attribute) => attribute.values));

  return combinations.map((values, index) => ({
    sku: skuFor(input.skuPrefix, values, index),
    price: input.price,
    stock: input.stock,
    attribute_values: values.map((value, position) => ({
      attribute_id: usable[position].attributeId,
      value,
    })),
  }));
}

/** Todas las combinaciones posibles de una lista de listas, en orden estable. */
function cartesian(lists: string[][]): string[][] {
  return lists.reduce<string[][]>(
    (accumulated, list) =>
      accumulated.flatMap((combination) => list.map((value) => [...combination, value])),
    [[]],
  );
}

/**
 * Etiqueta legible de una variante.
 *
 * La API devuelve el nombre del atributo y su valor (`Color: negro`), así que se leen en el orden que llega; si la
 * variante no tiene atributos (por ejemplo, un producto de una sola presentación) se usa el SKU, que es el único
 * dato que la identifica.
 */
export function variantLabel(variant: ProductVariant): string {
  const values = (variant.attribute_values ?? []).map((attributeValue) =>
    attributeValue.name.length > 0
      ? `${attributeValue.name}: ${attributeValue.value}`
      : attributeValue.value,
  );

  return values.length > 0 ? values.join(" / ") : variant.sku;
}

/** Unidades disponibles de un producto: lo que se puede vender sin contar lo reservado por pedidos en curso. */
export function totalAvailable(product: SellerProduct): number {
  return (product.variants ?? []).reduce((total, variant) => total + variant.available, 0);
}

/**
 * Precio de la variante **más barata**, tal como llega del backend.
 *
 * La lista de productos necesita un precio por producto y la API solo da precios por variante; se compara con
 * céntimos exactos (`compareAmounts`, que usa `BigInt`) y no con `number`, porque dos precios casi iguales
 * pueden ordenarse mal en coma flotante. Un precio que no se puede interpretar **no entra en la comparación**
 * (no se adivina): si ninguna variante tiene un precio legible se devuelve el primero que llegó, y la interfaz
 * enseña «sin precio» en lugar de un número inventado.
 */
export function cheapestPrice(product: SellerProduct): string | null {
  let best: string | null = null;
  let fallback: string | null = null;

  for (const variant of product.variants ?? []) {
    if (fallback === null) {
      fallback = variant.price;
    }

    if (best === null) {
      if (toMinorUnits(variant.price) !== null) {
        best = variant.price;
      }

      continue;
    }

    const order = compareAmounts(variant.price, best);

    if (order !== null && order < 0) {
      best = variant.price;
    }
  }

  return best ?? fallback;
}

/** ¿El producto se puede publicar? La API solo deja publicar los que están en borrador. */
export function canPublish(product: SellerProduct): boolean {
  return product.status === "draft";
}

/** ¿El producto se puede pausar? Solo los que están activos. */
export function canPause(product: SellerProduct): boolean {
  return product.status === "active";
}

/** ¿El producto se puede cerrar? Todo lo que no esté ya cerrado. */
export function canClose(product: SellerProduct): boolean {
  return product.status !== "closed";
}
