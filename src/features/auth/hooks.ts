"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cartKey } from "@/features/cart/client";
import { useRouter } from "@/i18n/navigation";

import * as api from "./client";
import type { AddressValues, LoginValues, RegisterValues, ResetPasswordValues } from "./schemas";
import type { Address, AuthUser } from "./types";

/**
 * Hooks de datos de la F2 con TanStack Query.
 *
 * Por qué TanStack Query y no `useEffect` + `useState`: da estado de carga y de error sin escribirlo a mano,
 * evita peticiones duplicadas, y al guardar algo invalida la caché para que la pantalla se actualice sola.
 *
 * `useSession` es además el **latido de la sesión**: cada 10 minutos pide `/api/auth/session`, que renueva el
 * access token caducado con el refresh token. Así el usuario no tiene que volver a entrar mientras navega.
 */

export const sessionKey = ["auth", "session"] as const;
export const addressesKey = ["auth", "addresses"] as const;

const SESSION_HEARTBEAT_MS = 10 * 60 * 1000;

/** Sesión actual. Devuelve `null` mientras se está comprobando o si no hay sesión. */
export function useSession(): { user: AuthUser | null; checking: boolean } {
  const query = useQuery({
    queryKey: sessionKey,
    queryFn: api.fetchSession,
    refetchInterval: SESSION_HEARTBEAT_MS,
    staleTime: 60_000,
  });

  const payload = query.data;
  const user = payload?.ok === true ? payload.data.user : null;

  return { user, checking: query.isLoading };
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (values: LoginValues) => api.login(values.email, values.password),
    onSuccess: async (result) => {
      if (result.ok) {
        // Al entrar, el servidor fusiona el carrito de invitado con el del usuario (F5): el carrito guardado en
        // la caché ya no es el bueno, así que se pide de nuevo (el contador de la cabecera lo comparte).
        await queryClient.invalidateQueries({ queryKey: cartKey });
        await queryClient.invalidateQueries({ queryKey: sessionKey });
        // Los datos que pinta el servidor (encabezado, /account) se vuelven a pedir con la sesión nueva.
        router.refresh();
      }
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (values: RegisterValues) =>
      api.register({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: api.logout,
    onSuccess: async () => {
      queryClient.clear();
      router.push("/");
      router.refresh();
    },
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (email: string) => api.requestPasswordReset(email) });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { token: string; values: ResetPasswordValues }) =>
      api.resetPassword(input.token, input.values.newPassword),
  });
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: (token: string) => api.verifyEmail(token) });
}

export function useResendVerification() {
  return useMutation({ mutationFn: (email: string) => api.resendVerification(email) });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: api.updateProfile,
    onSuccess: async (result) => {
      if (result.ok) {
        await queryClient.invalidateQueries({ queryKey: sessionKey });
        router.refresh();
      }
    },
  });
}

/** Direcciones del usuario con sesión. */
export function useAddresses(): { addresses: Address[]; loading: boolean; failed: boolean } {
  const query = useQuery({ queryKey: addressesKey, queryFn: api.listAddresses });
  const payload = query.data;

  return {
    addresses: payload?.ok === true ? payload.data.addresses : [],
    loading: query.isLoading,
    failed: payload?.ok === false,
  };
}

export function useSaveAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { addressId?: string; values: AddressValues }) => {
      const body = api.toAddressBody(input.values);

      return input.addressId === undefined
        ? api.createAddress(body)
        : api.updateAddress(input.addressId, body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: addressesKey });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) => api.deleteAddress(addressId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: addressesKey });
    },
  });
}
