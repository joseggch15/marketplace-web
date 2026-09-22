import type { SellerOrderPage } from "./types";

/**
 * Las **tres cifras** del panel del vendedor: ventas, pedidos y productos.
 *
 * La API no tiene endpoint de totales (`/admin/metrics` es de administración), así que el panel pagina el listado
 * de ventas por cursor con un tope y suma lo que ha leído **diciendo siempre sobre cuántos pedidos está
 * calculando**. Nada de gráficos: son tres números y su contexto.
 *
 * El dinero se suma en **céntimos con `BigInt`** y no con `number`: `0.1 + 0.2` en coma flotante no es `0.3`, y
 * aunque en el prototipo los importes vengan de la API (que usa `Decimal`), el frontend no puede degradar el dato
 * al pintarlo. La regla del proyecto es la misma en las dos partes: el dinero no se toca con `float`.
 */

/** Tope de páginas que se piden al listado por cursor (3 × 100 = 300 ventas como máximo por visita). */
export const SALES_PAGE_LIMIT = 3;

/** Tope de ventas por página: el que admite la API. */
export const SALES_PAGE_SIZE = 100;

export type SellerMetrics = {
  /** Suma de `subtotal`: lo que se facturó antes de comisiones. */
  sales: string;
  /** Suma de `payout_amount`: lo que el marketplace le pagará al vendedor. */
  payout: string;
  /** Ventas leídas (no es «todos los pedidos» si se alcanzó el tope). */
  orders: number;
  /** Productos del vendedor (el catálogo propio se pide completo, sin paginar). */
  products: number;
  /** ¿Se pudo leer todo (`false` = hay más ventas de las que se sumaron)? */
  complete: boolean;
  /** Páginas realmente leídas: la interfaz lo dice para que nadie dé el número por absoluto. */
  pagesRead: number;
  /** Tope de páginas usado en esta lectura. */
  pageLimit: number;
};

const MONEY = /^-?\d+(\.\d{1,2})?$/;

/**
 * Céntimos como enteros de precisión arbitraria.
 *
 * Se construyen con `BigInt(...)` y no con literales (`0n`) porque el proyecto compila con `target: ES2017` y la
 * sintaxis de literales de `BigInt` necesita ES2020; la función `BigInt` sí está disponible con el `lib` actual.
 */
const ZERO = BigInt(0);
const CENTS = BigInt(100);

/** Pasa un importe decimal (`"1234.50"`) a céntimos. Un valor raro cuenta como 0: sumar mal es peor que sumar 0. */
function toCents(amount: string): bigint {
  const value = amount.trim();

  if (!MONEY.test(value)) {
    return ZERO;
  }

  const [whole, decimals = ""] = value.split(".");
  const cents = `${decimals}00`.slice(0, 2);

  return BigInt(whole) * CENTS + BigInt(cents);
}

/** Vuelve de céntimos a un decimal con dos cifras, que es lo que espera `formatMoney`. */
function fromCents(cents: bigint): string {
  const negative = cents < ZERO;
  const absolute = negative ? -cents : cents;

  return `${negative ? "-" : ""}${absolute / CENTS}.${String(absolute % CENTS).padStart(2, "0")}`;
}

/** Suma importes decimales sin perder exactitud. */
export function sumAmounts(amounts: string[]): string {
  return fromCents(amounts.reduce((total, amount) => total + toCents(amount), ZERO));
}

/**
 * Resume las páginas leídas del listado de ventas.
 *
 * `pages` son las respuestas tal cual llegan de la API, en orden. Solo se puede afirmar que el número es «todo el
 * histórico» si la **última** página leída venía sin cursor para seguir; si una página falló o quedaban más
 * ventas, `complete` es `false` y la interfaz lo dice en lugar de presentar un total falsamente definitivo.
 */
export function summarizeSales(pages: (SellerOrderPage | null)[], products: number): SellerMetrics {
  const read = pages.filter((page): page is SellerOrderPage => page !== null);
  const lastPage = read.length > 0 ? read[read.length - 1] : null;
  const orders = read.flatMap((page) => page.items);

  return {
    sales: sumAmounts(orders.map((order) => order.subtotal)),
    payout: sumAmounts(orders.map((order) => order.payout_amount)),
    orders: orders.length,
    products,
    complete: read.length > 0 && read.length === pages.length && lastPage?.next_cursor === null,
    pagesRead: read.length,
    pageLimit: SALES_PAGE_LIMIT,
  };
}
