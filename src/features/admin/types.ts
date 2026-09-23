import type { components } from "@/lib/api/schema";

/**
 * Tipos del panel de administración (F9), tomados del **esquema generado** de la API.
 *
 * Igual que en el panel del vendedor: nunca se escriben a mano (salen de `pnpm api:types`) y aquí solo se les
 * pone un nombre corto para no repetir `components["schemas"][…]` por todo el código.
 */

export type AdminStore = components["schemas"]["StoreOut"];
export type StoreStatus = components["schemas"]["StoreStatus"];

export type AdminUser = components["schemas"]["AdminUserOut"];
export type AdminUserPage = components["schemas"]["AdminUserListOut"];
export type UserRole = components["schemas"]["UserRole"];

export type AdminQuestion = components["schemas"]["AdminQuestionOut"];
export type AdminQuestionPage = components["schemas"]["AdminQuestionListOut"];

/** Reseña tal como la devuelve la API (la misma que ve el público en la ficha del producto). */
export type AdminReview = components["schemas"]["ReviewOut"];

/** Entrada del libro de auditoría: la devuelve cada acción de moderación. */
export type AdminAction = components["schemas"]["AdminActionOut"];

/** Motivo opcional de una acción de moderación. */
export type Moderation = components["schemas"]["ModerationIn"];

/** Estados por los que se pueden filtrar las tiendas (`status_filter` en la API). */
export const STORE_STATUSES = ["pending", "approved", "rejected", "suspended"] as const;

/** Roles de plataforma por los que se puede filtrar el directorio de usuarios. */
export const USER_ROLES = ["customer", "admin"] as const;

/** Máximo de caracteres del motivo de moderación (se limita antes de enviarlo). */
export const MAX_REASON_LENGTH = 300;
