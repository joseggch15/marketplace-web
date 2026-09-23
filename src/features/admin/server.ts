import { cache } from "react";

import { getCurrentUser, readSessionTokens } from "@/features/auth/session";

import type { AdminUser } from "./types";

/**
 * Sesión de administración de la petición actual.
 *
 * Devuelve el usuario y su access token solo si la cuenta tiene rol `admin`; en cualquier otro caso `null`. Se
 * envuelve en `cache()` de React para que el marco del panel y la pantalla de dentro no pregunten dos veces lo
 * mismo dentro de la misma petición.
 *
 * Ojo: esto **no** sustituye a la autorización del backend. Cada endpoint de administración comprueba por su
 * cuenta que quien llama es administrador; aquí solo se decide qué se enseña.
 */
export const loadAdminSession = cache(
  async (): Promise<{ user: AdminUser; accessToken: string } | null> => {
    const user = await getCurrentUser();

    if (user === null || user.role !== "admin") {
      return null;
    }

    const { access } = await readSessionTokens();

    if (access === undefined) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
        full_name: user.profile?.full_name ?? null,
        store_id: null,
        store_name: null,
        store_status: null,
        created_at: user.created_at,
      },
      accessToken: access,
    };
  },
);
