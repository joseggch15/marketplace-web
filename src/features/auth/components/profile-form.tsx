"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { defaultCurrency, defaultTimeZone } from "@/i18n/routing";

import type { AuthUser } from "../types";
import { authErrorMessageKey, type KnownAuthErrorCode } from "../error-codes";
import { useUpdateProfile } from "../hooks";
import { asValidationKey, profileSchema, type ProfileValues } from "../schemas";
import { FormAlert, FormSuccess, SubmitButton, TextField } from "./fields";

/**
 * Datos personales y preferencias del usuario.
 *
 * Idioma y moneda se guardan en el perfil (no en `localStorage`) para que valgan en cualquier dispositivo.
 * La moneda es la del **vendedor** en los cobros; esta preferencia solo decide en qué moneda se muestran los
 * precios convertidos.
 */
export function ProfileForm({ user, locale }: { user: AuthUser; locale: string }) {
  const t = useTranslations("Auth");
  const updateProfile = useUpdateProfile();
  const [failure, setFailure] = useState<KnownAuthErrorCode | "unknown" | "network_error" | null>(
    null,
  );
  const [saved, setSaved] = useState(false);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.profile?.full_name ?? "",
      preferredCurrency: user.profile?.preferred_currency ?? defaultCurrency,
      preferredLanguage: user.profile?.preferred_language ?? locale,
      timezone: user.profile?.timezone ?? defaultTimeZone,
    },
  });

  const errorOf = (field: keyof ProfileValues) => {
    const message = form.formState.errors[field]?.message;
    return asValidationKey(typeof message === "string" ? message : undefined);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(null);
    setSaved(false);

    const result = await updateProfile.mutateAsync({
      full_name: values.fullName,
      preferred_currency: values.preferredCurrency,
      preferred_language: values.preferredLanguage,
      timezone: values.timezone,
    });

    if (!result.ok) {
      setFailure(authErrorMessageKey(result.code));
      return;
    }

    setSaved(true);
    form.reset(values);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {failure !== null ? <FormAlert code={failure} /> : null}
      {saved ? <FormSuccess>{t("messages.saved")}</FormSuccess> : null}

      <TextField
        id="profile-full-name"
        autoComplete="name"
        label={t("fields.fullName")}
        error={errorOf("fullName")}
        {...form.register("fullName")}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          id="profile-currency"
          label={t("fields.preferredCurrency")}
          hint={t("hints.currency")}
          error={errorOf("preferredCurrency")}
          {...form.register("preferredCurrency")}
        />

        <TextField
          id="profile-language"
          label={t("fields.preferredLanguage")}
          hint={t("hints.language")}
          error={errorOf("preferredLanguage")}
          {...form.register("preferredLanguage")}
        />

        <TextField
          id="profile-timezone"
          label={t("fields.timezone")}
          error={errorOf("timezone")}
          {...form.register("timezone")}
        />
      </div>

      <SubmitButton
        pending={form.formState.isSubmitting}
        label={t("actions.save")}
        pendingLabel={t("actions.working")}
        className="sm:w-fit"
      />
    </form>
  );
}
