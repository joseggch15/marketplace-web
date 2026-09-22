"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Link } from "@/i18n/navigation";

import { authErrorMessageKey, type KnownAuthErrorCode } from "../error-codes";
import { useForgotPassword } from "../hooks";
import { asValidationKey, forgotPasswordSchema, type ForgotPasswordValues } from "../schemas";
import { FormAlert, FormSuccess, SubmitButton, TextField } from "./fields";

/**
 * Formulario para pedir el enlace de recuperación de contraseña.
 *
 * La respuesta es la misma exista o no la cuenta (así nadie puede averiguar qué correos están registrados),
 * y el texto lo explica: "si el correo existe, generamos el enlace".
 *
 * Nota honesta: en este entorno el backend **todavía no envía correos**; escribe el enlace en sus registros.
 * Está anotado en `docs/PENDIENTES-BACKEND.md`, y por eso el aviso también menciona al equipo técnico.
 */
export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const forgotPassword = useForgotPassword();
  const [failure, setFailure] = useState<KnownAuthErrorCode | "unknown" | "network_error" | null>(
    null,
  );
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(null);
    const result = await forgotPassword.mutateAsync(values.email);

    if (!result.ok) {
      setFailure(authErrorMessageKey(result.code));
      return;
    }

    setSent(true);
  });

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <FormSuccess>{t("messages.resetRequested")}</FormSuccess>
        <p className="text-sm text-muted-foreground">{t("messages.emailNotConfigured")}</p>
        <Link
          href="/login"
          className="text-sm text-primary underline-offset-4 hover:underline sm:w-fit"
        >
          {t("actions.backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {failure !== null ? <FormAlert code={failure} /> : null}

      <TextField
        id="forgot-email"
        type="email"
        autoComplete="email"
        label={t("fields.email")}
        placeholder={t("placeholders.email")}
        error={asValidationKey(form.formState.errors.email?.message)}
        {...form.register("email")}
      />

      <SubmitButton
        pending={form.formState.isSubmitting}
        label={t("actions.sendResetLink")}
        pendingLabel={t("actions.working")}
      />

      <Link
        href="/login"
        className="text-sm text-primary underline-offset-4 hover:underline sm:w-fit"
      >
        {t("actions.backToLogin")}
      </Link>
    </form>
  );
}
