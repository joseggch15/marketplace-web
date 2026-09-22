"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Link } from "@/i18n/navigation";

import { authErrorMessageKey, type KnownAuthErrorCode } from "../error-codes";
import { useResetPassword } from "../hooks";
import { asValidationKey, resetPasswordSchema, type ResetPasswordValues } from "../schemas";
import { FormAlert, FormSuccess, PasswordField, SubmitButton } from "./fields";

/**
 * Formulario para guardar la contraseña nueva.
 *
 * El token viaja en la URL del correo y se envía en el cuerpo de la petición a nuestra API (nunca en la URL
 * de la API, para no dejarlo en los registros del servidor). El token es de un solo uso.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("Auth");
  const resetPassword = useResetPassword();
  const [failure, setFailure] = useState<KnownAuthErrorCode | "unknown" | "network_error" | null>(
    null,
  );
  const [done, setDone] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  if (token.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <FormAlert code="invalid_token" />
        <Link
          href="/forgot-password"
          className="text-sm text-primary underline-offset-4 hover:underline sm:w-fit"
        >
          {t("actions.sendResetLink")}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <FormSuccess>{t("messages.passwordChanged")}</FormSuccess>
        <Link
          href="/login"
          className="text-sm text-primary underline-offset-4 hover:underline sm:w-fit"
        >
          {t("actions.goToLogin")}
        </Link>
      </div>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(null);
    const result = await resetPassword.mutateAsync({ token, values });

    if (!result.ok) {
      setFailure(authErrorMessageKey(result.code));
      return;
    }

    setDone(true);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {failure !== null ? <FormAlert code={failure} /> : null}

      <PasswordField
        id="reset-new-password"
        autoComplete="new-password"
        label={t("fields.newPassword")}
        hint={t("hints.password")}
        error={asValidationKey(form.formState.errors.newPassword?.message)}
        {...form.register("newPassword")}
      />

      <PasswordField
        id="reset-confirm-password"
        autoComplete="new-password"
        label={t("fields.confirmPassword")}
        error={asValidationKey(form.formState.errors.confirmPassword?.message)}
        {...form.register("confirmPassword")}
      />

      <SubmitButton
        pending={form.formState.isSubmitting}
        label={t("actions.savePassword")}
        pendingLabel={t("actions.working")}
      />
    </form>
  );
}
