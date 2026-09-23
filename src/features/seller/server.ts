import { cache } from "react";

import { readSessionTokens } from "@/features/auth/session";

import { getMyStore } from "./api";
import type { SellerStore } from "./types";

/**
 * Estado de la tienda del usuario con sesión, tal y como lo ven las pantallas del panel.
 *
 * Existe porque «no tengo tienda» y «no pude preguntarlo» son cosas distintas y se cuentan distinto: con la
 * primera se ofrece abrir la tienda; con la segunda se dice que el servicio no responde. Un booleano no
 * alcanzaría para distinguirlas y la pantalla mentiría en uno de los dos casos.
 */
export type StoreLookup =
  { status: "ok"; store: SellerStore } | { status: "none" } | { status: "unavailable" };

/**
 * Pregunta a la API por la tienda del vendedor con sesión. Solo servidor.
 *
 * Va envuelta en `cache()` de React: el marco del panel y la pantalla que hay dentro la necesitan los dos y
 * dentro de la misma petición se pregunta **una sola vez** (React la memoiza mientras se renderiza ese
 * request). Es la misma idea que usan los datos compartidos entre layout y página en el App Router.
 */
export const loadMyStore = cache(async (): Promise<StoreLookup> => {
  const { access } = await readSessionTokens();

  if (access === undefined) {
    return { status: "unavailable" };
  }

  const result = await getMyStore(access);

  if (result.ok) {
    return { status: "ok", store: result.data };
  }

  // `seller_required` / `store_not_found` significan exactamente eso: todavía no tiene tienda.
  if (result.status === 403 || result.status === 404) {
    return { status: "none" };
  }

  return { status: "unavailable" };
});

/**
 * ¿Se puede publicar y vender?
 *
 * Solo con la tienda **aprobada**: el backend rechaza crear productos con la tienda pendiente o suspendida
 * (`store_not_approved`), así que las pantallas de productos y ventas se lo dicen al vendedor antes de que
 * escriba nada.
 */
export function canSell(store: SellerStore): boolean {
  return store.status === "approved";
}
