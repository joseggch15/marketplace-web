import type { components } from "@/lib/api/schema";

/**
 * Tipos del panel del vendedor (F8), tomados del **esquema generado** de la API.
 *
 * Nunca se escriben a mano (regla del proyecto): salen de `pnpm api:types`, que los regenera desde el
 * `/openapi.json` del backend. Aquí solo se les pone un nombre corto para no repetir
 * `components["schemas"][…]` en cada archivo y para que el día que la API cambie, el compilador avise en un solo
 * sitio.
 */

export type SellerStore = components["schemas"]["StoreOut"];
export type StoreStatus = components["schemas"]["StoreStatus"];
export type NewStore = components["schemas"]["StoreCreate"];
export type StoreChanges = components["schemas"]["StoreUpdate"];

export type SellerProduct = components["schemas"]["ProductOut"];
export type ProductVariant = components["schemas"]["VariantOut"];
export type ProductImage = components["schemas"]["ProductImageOut"];
export type ProductStatus = components["schemas"]["ProductStatus"];
export type NewVariant = components["schemas"]["VariantIn"];
export type NewProduct = components["schemas"]["ProductCreate"];
export type ProductChanges = components["schemas"]["ProductUpdate"];

export type Category = components["schemas"]["CategoryOut"];
export type CategoryAttribute = components["schemas"]["CategoryAttributeOut"];

export type UploadUrl = components["schemas"]["UploadUrlOut"];

export type SellerOrder = components["schemas"]["SellerOrderSummaryOut"];
export type SellerOrderPage = components["schemas"]["SellerOrderListOut"];
/** Sub-orden completa (la devuelve cambiar el estado de la venta): lleva las líneas. */
export type SellerSale = components["schemas"]["SellerOrderOut"];
export type SellerOrderStatus = components["schemas"]["SellerOrderStatus"];
export type Shipment = components["schemas"]["ShipmentOut"];
export type NewShipment = components["schemas"]["ShipmentCreate"];
export type ShipmentChanges = components["schemas"]["ShipmentUpdate"];
export type ShipmentStatus = components["schemas"]["ShipmentStatus"];

/**
 * Estados a los que el vendedor puede mover una venta desde el panel.
 *
 * Son exactamente los que acepta la máquina de estados del backend
 * (`SELLER_ORDER_TRANSITIONS` en `app/modules/orders/service.py`): preparar, enviar y entregar. El estado
 * `cancelled` no se ofrece aquí porque cancelar es cosa del comprador o del administrador.
 */
export const SELLER_FLOW = ["processing", "shipped", "delivered"] as const;

/** Publicación de un producto: los cuatro estados de la API, en el orden natural del ciclo de vida. */
export const PRODUCT_STATUSES = ["draft", "active", "paused", "closed"] as const;

/**
 * Imágenes que se pueden subir.
 *
 * Es la misma lista exacta del proxy de medios (`src/app/api/media/[...key]/route.ts`): **SVG queda fuera** porque
 * es un tipo `image/` que puede llevar JavaScript dentro y, servido desde nuestro dominio, se ejecutaría con el
 * origen de la tienda y la sesión del comprador.
 */
export const UPLOADABLE_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

/** 5 MB: suficiente para una foto de producto comprimida y lejos del límite del backend. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
