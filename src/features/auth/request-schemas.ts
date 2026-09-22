import { z } from "zod";

/**
 * Cuerpos de petición que aceptan las rutas BFF.
 *
 * Van en `snake_case` porque son **la misma forma que espera el backend**: así el navegador y la API hablan
 * igual y no hay traducciones de nombres por el camino. Los límites salen de
 * `app/modules/identity/schemas.py`. El servidor revalida siempre, aunque el formulario ya lo haya hecho.
 */

/** El backend usa `EmailStr`; aquí solo se comprueba que sea un texto razonable. */
const email = z.string().trim().min(1).max(320);

export const loginBody = z.object({
  email,
  password: z.string().min(1).max(128),
});

export const registerBody = z.object({
  email,
  password: z.string().min(8).max(128),
  full_name: z.string().trim().min(1).max(120),
});

export const emailBody = z.object({ email });

export const tokenBody = z.object({ token: z.string().min(1).max(512) });

export const resetPasswordBody = z.object({
  token: z.string().min(1).max(512),
  new_password: z.string().min(8).max(128),
});

export const profileBody = z.object({
  full_name: z.string().trim().min(1).max(120).optional(),
  preferred_currency: z.string().trim().length(3).optional(),
  preferred_language: z.string().trim().min(2).max(10).optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
});

export const addressBody = z.object({
  label: z.string().trim().min(1).max(50),
  recipient_name: z.string().trim().min(1).max(120),
  line1: z.string().trim().min(1).max(255),
  line2: z.string().trim().max(255).nullable().optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().max(100).nullable().optional(),
  postal_code: z.string().trim().max(20).nullable().optional(),
  country: z.string().trim().length(2),
  phone: z.string().trim().max(30).nullable().optional(),
  is_default: z.boolean(),
});

export const addressPatchBody = addressBody.partial();
