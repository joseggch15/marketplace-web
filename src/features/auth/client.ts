import type { AddressValues } from "./schemas";
import type { Address, AddressInput, AddressPatch, AuthUser, ProfileInput } from "./types";

/**
 * Cliente del navegador para las rutas BFF.
 *
 * El navegador **solo** habla con `/api/...` de nuestro propio dominio: nunca con el backend FastAPI ni con
 * los tokens, que están en cookies httpOnly.
 */

/** Fallo con el `code` estable de la API, listo para traducir. */
export type ClientFailure = { ok: false; status: number; code: string };

export type ClientResult<T> = { ok: true; data: T } | ClientFailure;

type RequestOptions = {
  method: "POST" | "PATCH" | "DELETE" | "GET";
  path: string;
  body?: unknown;
};

/** Hace una petición a una ruta BFF y normaliza el resultado (nunca lanza excepciones). */
async function call<T>({ method, path, body }: RequestOptions): Promise<ClientResult<T>> {
  try {
    const response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
      cache: "no-store",
    });

    if (response.ok) {
      const data: unknown = response.status === 204 ? {} : await response.json();
      return { ok: true, data: data as T };
    }

    let code = "unknown";

    try {
      const problem: unknown = await response.json();
      const candidate = (problem as { code?: unknown }).code;
      if (typeof candidate === "string") {
        code = candidate;
      }
    } catch {
      // Sin cuerpo JSON: se queda el código genérico.
    }

    return { ok: false, status: response.status, code };
  } catch {
    return { ok: false, status: 0, code: "network_error" };
  }
}

export function login(email: string, password: string): Promise<ClientResult<{ user: AuthUser }>> {
  return call({ method: "POST", path: "/api/auth/login", body: { email, password } });
}

export function register(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<ClientResult<{ user: AuthUser }>> {
  return call({
    method: "POST",
    path: "/api/auth/register",
    body: { email: input.email, password: input.password, full_name: input.fullName },
  });
}

export function logout(): Promise<ClientResult<Record<string, never>>> {
  return call({ method: "POST", path: "/api/auth/logout" });
}

export function fetchSession(): Promise<ClientResult<{ user: AuthUser | null }>> {
  return call({ method: "GET", path: "/api/auth/session" });
}

export function requestPasswordReset(email: string): Promise<ClientResult<Record<string, never>>> {
  return call({ method: "POST", path: "/api/auth/forgot-password", body: { email } });
}

export function resetPassword(
  token: string,
  newPassword: string,
): Promise<ClientResult<Record<string, never>>> {
  return call({
    method: "POST",
    path: "/api/auth/reset-password",
    body: { token, new_password: newPassword },
  });
}

export function verifyEmail(token: string): Promise<ClientResult<Record<string, never>>> {
  return call({ method: "POST", path: "/api/auth/verify-email", body: { token } });
}

export function resendVerification(email: string): Promise<ClientResult<Record<string, never>>> {
  return call({ method: "POST", path: "/api/auth/resend-verification", body: { email } });
}

export function updateProfile(
  body: ProfileInput,
): Promise<ClientResult<{ user: AuthUser }>> {
  return call({ method: "PATCH", path: "/api/account/profile", body });
}

export function listAddresses(): Promise<ClientResult<{ addresses: Address[] }>> {
  return call({ method: "GET", path: "/api/account/addresses" });
}

export function createAddress(body: AddressInput): Promise<ClientResult<{ address: Address }>> {
  return call({ method: "POST", path: "/api/account/addresses", body });
}

export function updateAddress(
  addressId: string,
  body: AddressPatch,
): Promise<ClientResult<{ address: Address }>> {
  return call({
    method: "PATCH",
    path: `/api/account/addresses/${encodeURIComponent(addressId)}`,
    body,
  });
}

export function deleteAddress(addressId: string): Promise<ClientResult<Record<string, never>>> {
  return call({
    method: "DELETE",
    path: `/api/account/addresses/${encodeURIComponent(addressId)}`,
  });
}

/**
 * Convierte los valores del formulario (camelCase) al cuerpo que espera la API (snake_case).
 *
 * Los campos opcionales vacíos se envían como `null` en lugar de cadena vacía: así el backend guarda "sin
 * dato" en vez de un texto vacío, y las direcciones se ven igual en todos los idiomas.
 */
export function toAddressBody(values: AddressValues): AddressInput {
  const optional = (value: string | undefined) => {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
  };

  return {
    label: values.label.trim(),
    recipient_name: values.recipientName.trim(),
    line1: values.line1.trim(),
    line2: optional(values.line2),
    city: values.city.trim(),
    state: optional(values.state),
    postal_code: optional(values.postalCode),
    country: values.country.trim().toUpperCase(),
    phone: optional(values.phone),
    is_default: values.isDefault,
  };
}
