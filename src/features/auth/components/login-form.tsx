"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Link, useRouter } from "@/i18n/navigation";

import { authErrorMessageKey, type KnownAuthErrorCode } from "../error-codes";
import { useLogin } from "../hooks";
import { asValidationKey, loginSchema, type LoginValues } from "../schemas";
import { FormAlert, PasswordField, SubmitButton, TextField } from "./fields";

/**
 * Formulario de inicio de sesión.
 *
 * Valida en el navegador (Zod, las mismas reglas que el backend) y envía a `/api/auth/login`, que guarda los
 * tokens en cookies httpOnly. Aquí nunca se ve un token.
 *
 * `next` es la ruta a la que volver después de entrar (por ejemplo, cuando el usuario intentó abrir
 * /account sin sesión). Se valida antes de usarla para no aceptar direcciones de otros sitios.
 */
export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const login = useLogin();
  const [failure, setFailure] = useState<KnownAuthErrorCode | "unknown" | "network_error" | null>(
    null,
  );

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(null);
    const result = await login.mutateAsync(values);

    if (!result.ok) {
      setFailure(authErrorMessageKey(result.code));
      return;
    }

    const destination = next !== undefined && next.startsWith("/") ? next : "/account";
    router.push(destination);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {failure !== null ? <FormAlert code={failure} /> : null}

      <TextField
        id="login-email"
        type="email"
        autoComplete="email"
        label={t("fields.email")}
        placeholder={t("placeholders.email")}
        error={asValidationKey(form.formState.errors.email?.message)}
        {...form.register("email")}
      />

      <PasswordField
        id="login-password"
        autoComplete="current-password"
        label={t("fields.password")}
        error={asValidationKey(form.formState.errors.password?.message)}
        {...form.register("password")}
      />

      <SubmitButton
        pending={form.formState.isSubmitting}
        label={t("actions.login")}
        pendingLabel={t("actions.working")}
      />

      <div className="flex flex-col gap-1 text-sm">
        <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
          {t("links.forgot")}
        </Link>
        <p className="text-muted-foreground">
          {t("links.needAccount")}{" "}
          <Link href="/register" className="text-primary underline underline-offset-4">
            {t("actions.goToRegister")}
          </Link>
        </p>
      </div>
    </form>
  );
}
