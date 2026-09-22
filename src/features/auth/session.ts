import { cookies } from "next/headers";

import { env } from "@/lib/env";

import {
  fetchCurrentUser,
  loginWithPassword,
  logoutTokens,
  refreshTokens,
  registerAccount,
  type BackendResult,
} from "./api";
import type { AuthTokens, AuthUser } from "./types";

/**
 * Sesión (patrón BFF).
 *
 * Regla del proyecto: **el navegador nunca ve ni guarda tokens**. Aquí viven los dos tokens, en cookies
 * `httpOnly` (inaccesibles para JavaScript), `Secure` en producción y `SameSite=Lax` (evita que otro sitio
 * las use en peticiones cruzadas). El access token dura 15 minutos y el refresh token 7 días, igual que en
 * el backend (`app/modules/identity/service.py`).
 *
 * Quién puede escribir cookies: solo las **rutas BFF** y las Server Actions. Por eso `getCurrentUser()`
 * (usado por los Server Components) es de solo lectura y no intenta renovar: si el access token caducó,
 * devuelve `null` y la página redirige a /login. La renovación real la hace `POST /api/auth/refresh` y
 * `GET /api/auth/session`, que sí tienen respuesta donde escribir la cookie.
 */

export const ACCESS_COOKIE = "mv_access";
export const REFRESH_COOKIE = "mv_refresh";

/** Segundos: 15 minutos para el access token y 7 días para el refresh token. */
const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/** Guarda los tokens de la sesión en cookies httpOnly. */
export async function setSessionCookies(tokens: AuthTokens): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, tokens.access_token, cookieOptions(ACCESS_MAX_AGE));
  store.set(REFRESH_COOKIE, tokens.refresh_token, cookieOptions(REFRESH_MAX_AGE));
}

/** Borra la sesión del navegador. */
export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

/** Lee los tokens guardados. Solo servidor. */
export async function readSessionTokens(): Promise<{ access?: string; refresh?: string }> {
  const store = await cookies();
  return {
    access: store.get(ACCESS_COOKIE)?.value,
    refresh: store.get(REFRESH_COOKIE)?.value,
  };
}

/**
 * Usuario de la sesión, o `null` si no hay sesión válida.
 *
 * **No renueva** el token (ver la nota del archivo): sirve para pintar en el servidor sabiendo quién es el
 * usuario, sin mostrar/ocultar cosas después de cargar la página.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { access } = await readSessionTokens();
  return access ? fetchCurrentUser(access) : null;
}

/**
 * Renueva la sesión con el refresh token y guarda los tokens nuevos.
 *
 * El refresh token **rota** en cada uso (el backend invalida el anterior), así que es imprescindible guardar
 * el par nuevo: si se perdiera, el usuario quedaría fuera. Solo se llama desde rutas BFF.
 */
export async function refreshSession(): Promise<AuthUser | null> {
  const { refresh } = await readSessionTokens();

  if (!refresh) {
    await clearSessionCookies();
    return null;
  }

  const result = await refreshTokens(refresh);

  if (!result.ok) {
    await clearSessionCookies();
    return null;
  }

  await setSessionCookies(result.data);
  return fetchCurrentUser(result.data.access_token);
}

/** Inicia sesión contra el backend y deja la sesión guardada en cookies. */
export async function startSession(email: string, password: string): Promise<BackendResult<AuthUser>> {
  const tokens = await loginWithPassword({ email, password });

  if (!tokens.ok) {
    return tokens;
  }

  await setSessionCookies(tokens.data);
  const user = await fetchCurrentUser(tokens.data.access_token);

  if (user === null) {
    // Los tokens se emitieron pero no se pudo leer el usuario: no dejamos una sesión a medias.
    await clearSessionCookies();
    return { ok: false, status: 502, code: null };
  }

  return { ok: true, data: user };
}

/** Cierra la sesión en el backend (mejor esfuerzo) y borra las cookies. */
export async function endSession(): Promise<void> {
  const { refresh } = await readSessionTokens();

  if (refresh) {
    await logoutTokens(refresh);
  }

  await clearSessionCookies();
}

/**
 * Crea la cuenta **y deja la sesión iniciada**.
 *
 * Al registrarse, el backend devuelve `{ user, access_token, refresh_token }` (decisión `0023`), así que aquí
 * se guardan las cookies igual que en el inicio de sesión. Después se fusiona el carrito del invitado: como ya
 * hay sesión en el mismo paso, el carrito **no se pierde** al crear la cuenta.
 */
export async function createAccount(input: {
  email: string;
  password: string;
  full_name: string;
}): Promise<BackendResult<AuthUser>> {
  const registered = await registerAccount(input);

  if (!registered.ok) {
    return registered;
  }

  await setSessionCookies(registered.data);
  const user = await fetchCurrentUser(registered.data.access_token);

  if (user === null) {
    // Los tokens se emitieron pero no se pudo leer el usuario: no dejamos una sesión a medias.
    await clearSessionCookies();
    return { ok: false, status: 502, code: null };
  }

  return { ok: true, data: user };
}

/**
 * Ejecuta una operación autenticada, renovando la sesión si el access token caducó.
 *
 * Solo puede usarse desde rutas BFF: `refreshSession()` escribe cookies y eso requiere una respuesta.
 * Si no hay forma de renovar, devuelve 401 y el navegador llevará al usuario a /login.
 */
export async function withAccessToken<T>(
  operation: (accessToken: string) => Promise<BackendResult<T>>,
): Promise<BackendResult<T>> {
  const { access } = await readSessionTokens();

  if (access) {
    const first = await operation(access);

    if (first.ok || first.status !== 401) {
      return first;
    }
  }

  const refreshed = await refreshSession();

  if (refreshed === null) {
    return { ok: false, status: 401, code: "unauthorized" };
  }

  const { access: renewed } = await readSessionTokens();

  if (renewed === undefined) {
    return { ok: false, status: 401, code: "unauthorized" };
  }

  return operation(renewed);
}
