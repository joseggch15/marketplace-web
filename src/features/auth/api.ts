import { backend } from "@/lib/api/client";

import { problemCode } from "./error-codes";
import type {
  Address,
  AddressInput,
  AddressPatch,
  AuthTokens,
  AuthUser,
  ProfileInput,
} from "./types";

/**
 * Llamadas al backend desde el **servidor** (patrón BFF).
 *
 * Cada función devuelve un resultado en vez de lanzar excepciones: así las rutas BFF pueden convertir
 * cualquier fallo en una respuesta clara para el navegador, con el `code` estable de la API.
 *
 * Nunca se llama a estas funciones desde un componente cliente: el navegador solo habla con `/api/...`.
 */

/** Resultado de una llamada: datos o el código de error de la API. */
export type BackendResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string | null; status: number };

/** Forma mínima y tipada de lo que devuelve `openapi-fetch`. */
type Outcome<T> = { data?: T; error?: unknown; response: Response };

async function unwrap<T>(outcome: Promise<Outcome<T>>): Promise<BackendResult<T>> {
  const { data, error, response } = await outcome;

  if (response.ok && data !== undefined) {
    return { ok: true, data };
  }

  return { ok: false, status: response.status, code: problemCode(error) };
}

/** Igual que `unwrap`, para operaciones sin cuerpo de respuesta (204, 202). */
async function unwrapEmpty(outcome: Promise<Outcome<unknown>>): Promise<BackendResult<null>> {
  const { error, response } = await outcome;

  if (response.ok) {
    return { ok: true, data: null };
  }

  return { ok: false, status: response.status, code: problemCode(error) };
}

const noStore = { cache: "no-store" } as const;

/** Cabecera de autorización para las operaciones que necesitan sesión. */
function bearer(accessToken: string) {
  return { authorization: `Bearer ${accessToken}` };
}

export function registerAccount(input: {
  email: string;
  password: string;
  full_name: string;
}): Promise<BackendResult<AuthUser>> {
  return unwrap(backend.POST("/api/v1/auth/register", { body: input, ...noStore }));
}

export function loginWithPassword(input: {
  email: string;
  password: string;
}): Promise<BackendResult<AuthTokens>> {
  return unwrap(backend.POST("/api/v1/auth/login", { body: input, ...noStore }));
}

export function refreshTokens(refresh_token: string): Promise<BackendResult<AuthTokens>> {
  return unwrap(
    backend.POST("/api/v1/auth/refresh", { body: { refresh_token }, ...noStore }),
  );
}

export function logoutTokens(refresh_token: string): Promise<BackendResult<null>> {
  return unwrapEmpty(backend.POST("/api/v1/auth/logout", { body: { refresh_token }, ...noStore }));
}

export function verifyEmail(token: string): Promise<BackendResult<null>> {
  return unwrapEmpty(backend.POST("/api/v1/auth/verify-email", { body: { token }, ...noStore }));
}

export function resendVerification(email: string): Promise<BackendResult<null>> {
  return unwrapEmpty(
    backend.POST("/api/v1/auth/resend-verification", { body: { email }, ...noStore }),
  );
}

export function requestPasswordReset(email: string): Promise<BackendResult<null>> {
  return unwrapEmpty(
    backend.POST("/api/v1/auth/forgot-password", { body: { email }, ...noStore }),
  );
}

export function resetPassword(input: {
  token: string;
  new_password: string;
}): Promise<BackendResult<null>> {
  return unwrapEmpty(backend.POST("/api/v1/auth/reset-password", { body: input, ...noStore }));
}

/** Usuario de la sesión. Devuelve `null` si el token no sirve (401). */
export async function fetchCurrentUser(accessToken: string): Promise<AuthUser | null> {
  const result = await unwrap(
    backend.GET("/api/v1/users/me", { headers: bearer(accessToken), ...noStore }),
  );

  return result.ok ? result.data : null;
}

export function updateCurrentUser(
  accessToken: string,
  body: ProfileInput,
): Promise<BackendResult<AuthUser>> {
  return unwrap(
    backend.PATCH("/api/v1/users/me", { body, headers: bearer(accessToken), ...noStore }),
  );
}

export function listAddresses(accessToken: string): Promise<BackendResult<Address[]>> {
  return unwrap(
    backend.GET("/api/v1/users/me/addresses", { headers: bearer(accessToken), ...noStore }),
  );
}

export function createAddress(
  accessToken: string,
  body: AddressInput,
): Promise<BackendResult<Address>> {
  return unwrap(
    backend.POST("/api/v1/users/me/addresses", { body, headers: bearer(accessToken), ...noStore }),
  );
}

export function updateAddress(
  accessToken: string,
  addressId: string,
  body: AddressPatch,
): Promise<BackendResult<Address>> {
  return unwrap(
    backend.PATCH("/api/v1/users/me/addresses/{address_id}", {
      params: { path: { address_id: addressId } },
      body,
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}

export function deleteAddress(
  accessToken: string,
  addressId: string,
): Promise<BackendResult<null>> {
  return unwrapEmpty(
    backend.DELETE("/api/v1/users/me/addresses/{address_id}", {
      params: { path: { address_id: addressId } },
      headers: bearer(accessToken),
      ...noStore,
    }),
  );
}
