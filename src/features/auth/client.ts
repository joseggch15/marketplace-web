import { callBff as call, type ClientFailure, type ClientResult } from "@/lib/api/bff-client";

import type { AddressValues } from "./schemas";
import type { Address, AddressInput, AddressPatch, AuthUser, ProfileInput } from "./types";

/**
 * Cliente del navegador para las rutas BFF.
 *
 * El navegador **solo** habla con `/api/...` de nuestro propio dominio: nunca con el backend FastAPI ni con
 * los tokens, que están en cookies httpOnly. La llamada en sí (y el formato de los errores) vive en
 * `src/lib/api/bff-client.ts`, compartida con la feature de producto (F4).
 */

export type { ClientFailure, ClientResult };

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

export function updateProfile(body: ProfileInput): Promise<ClientResult<{ user: AuthUser }>> {
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
