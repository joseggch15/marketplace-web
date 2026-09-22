"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Link } from "@/i18n/navigation";

import { authErrorMessageKey, type KnownAuthErrorCode } from "../error-codes";
import { useRegister } from "../hooks";
import { asValidationKey, registerSchema, type RegisterValues } from "../schemas";
import { FormAlert, FormSuccess, PasswordField, SubmitButton, TextField } from "./fields";

/**
 * Formulario de registro.
 *
 * Al crear la cuenta **no** se inicia sesión: el backend no devuelve tokens en el registro, así que se invita
 * al usuario a entrar. Los datos personales, el idioma y la moneda se completan después, en /account.
 */
export function RegisterForm() {
  const t = useTranslations("Auth");
  const registerAccount = useRegister();
  const [failure, setFailure] = useState<KnownAuthErrorCode | "unknown" | "network_error" | null>(
    null,
  );
  const [created, setCreated] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(null);
    const result = await registerAccount.mutateAsync(values);

    if (!result.ok) {
      setFailure(authErrorMessageKey(result.code));
      return;
    }

    setCreated(true);
  });

  if (created) {
    return (
      <div className="flex flex-col gap-4">
        <FormSuccess>{t("messages.registered")}</FormSuccess>
        <Link
          href="/login"
          className="text-sm text-primary underline-offset-4 hover:underline sm:w-fit"
        >
          {t("actions.goToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {failure !== null ? <FormAlert code={failure} /> : null}

      <TextField
        id="register-full-name"
        autoComplete="name"
        label={t("fields.fullName")}
        error={asValidationKey(form.formState.errors.fullName?.message)}
        {...form.register("fullName")}
      />

      <TextField
        id="register-email"
        type="email"
        autoComplete="email"
        label={t("fields.email")}
        placeholder={t("placeholders.email")}
        error={asValidationKey(form.formState.errors.email?.message)}
        {...form.register("email")}
      />

      <PasswordField
        id="register-password"
        autoComplete="new-password"
        label={t("fields.password")}
        hint={t("hints.password")}
        error={asValidationKey(form.formState.errors.password?.message)}
        {...form.register("password")}
      />

      <PasswordField
        id="register-confirm-password"
        autoComplete="new-password"
        label={t("fields.confirmPassword")}
        error={asValidationKey(form.formState.errors.confirmPassword?.message)}
        {...form.register("confirmPassword")}
      />

      <SubmitButton
        pending={form.formState.isSubmitting}
        label={t("actions.register")}
        pendingLabel={t("actions.working")}
      />

      <p className="text-sm text-muted-foreground">
        {t("links.haveAccount")}{" "}
        <Link href="/login" className="text-primary underline underline-offset-4">
          {t("actions.goToLogin")}
        </Link>
      </p>
    </form>
  );
}
