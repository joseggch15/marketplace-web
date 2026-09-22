import type { components } from "@/lib/api/schema";

/**
 * Tipos de la F2 tomados **siempre** del esquema generado desde el OpenAPI del backend
 * (`pnpm api:types`). No se escriben a mano: si la API cambia, cambian solos.
 */
export type AuthTokens = components["schemas"]["TokenPair"];
export type AuthUser = components["schemas"]["UserOut"];
export type UserProfile = components["schemas"]["UserProfileOut"];
export type ProfileInput = components["schemas"]["UserUpdate"];
export type Address = components["schemas"]["AddressOut"];
export type AddressInput = components["schemas"]["AddressCreate"];
export type AddressPatch = components["schemas"]["AddressUpdate"];

/** Respuesta de las rutas BFF que devuelven al usuario. */
export type SessionPayload = { user: AuthUser | null };
