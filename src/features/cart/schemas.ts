import { z } from "zod";

import { MAX_CART_QUANTITY, MIN_CART_QUANTITY } from "./selectors";

/**
 * Validación de lo que llega a las rutas BFF del carrito.
 *
 * Los límites están copiados del backend (`app/modules/cart/schemas.py`: `CartItemAdd.quantity` y
 * `CartItemUpdate.quantity` aceptan de 1 a 100). El servidor **vuelve a validar siempre**: esto es para dar un
 * error claro y temprano, no para confiar en el cliente.
 */

export const cartItemAddSchema = z.object({
  variant_id: z.uuid(),
  quantity: z.number().int().min(MIN_CART_QUANTITY).max(MAX_CART_QUANTITY),
});

export const cartItemUpdateSchema = z.object({
  quantity: z.number().int().min(MIN_CART_QUANTITY).max(MAX_CART_QUANTITY),
});

export type CartItemAddValues = z.infer<typeof cartItemAddSchema>;
export type CartItemUpdateValues = z.infer<typeof cartItemUpdateSchema>;
