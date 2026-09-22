"use client";

import { useTranslations } from "next-intl";
import type { FormEvent } from "react";
import type { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";

import type { KnownAuthErrorCode } from "../error-codes";
import type { AddressValues, ValidationKey } from "../schemas";
import { CheckboxField, FormAlert, SubmitButton, TextAreaField, TextField } from "./fields";

/**
 * Formulario de una dirección (alta y edición).
 *
 * Los campos siguen los `autocomplete` estándar (`address-line1`, `postal-code`…): así el navegador del móvil
 * ofrece rellenar la dirección con los datos del sistema, que para el usuario es más rápido que teclear.
 */

export type AddressFormProps = {
  form: UseFormReturn<AddressValues>;
  errorOf: (field: keyof AddressValues) => ValidationKey | undefined;
  failure: KnownAuthErrorCode | "unknown" | "network_error" | null;
  editing: boolean;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export function AddressForm({
  form,
  errorOf,
  failure,
  editing,
  pending,
  onSubmit,
  onCancel,
}: AddressFormProps) {
  const t = useTranslations("Auth");

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-xl border border-border p-4"
    >
      <h2 className="font-heading text-lg font-semibold">
        {editing ? t("account.editAddressTitle") : t("account.newAddressTitle")}
      </h2>

      {failure !== null ? <FormAlert code={failure} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="address-label"
          label={t("fields.label")}
          hint={t("hints.addressLabel")}
          error={errorOf("label")}
          {...form.register("label")}
        />
        <TextField
          id="address-recipient"
          autoComplete="name"
          label={t("fields.recipientName")}
          error={errorOf("recipientName")}
          {...form.register("recipientName")}
        />
      </div>

      <TextField
        id="address-line1"
        autoComplete="address-line1"
        label={t("fields.line1")}
        error={errorOf("line1")}
        {...form.register("line1")}
      />

      <TextAreaField
        id="address-line2"
        autoComplete="address-line2"
        rows={2}
        label={t("fields.line2")}
        hint={t("hints.optional")}
        error={errorOf("line2")}
        {...form.register("line2")}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          id="address-city"
          autoComplete="address-level2"
          label={t("fields.city")}
          error={errorOf("city")}
          {...form.register("city")}
        />
        <TextField
          id="address-state"
          autoComplete="address-level1"
          label={t("fields.state")}
          hint={t("hints.optional")}
          error={errorOf("state")}
          {...form.register("state")}
        />
        <TextField
          id="address-postal-code"
          autoComplete="postal-code"
          label={t("fields.postalCode")}
          hint={t("hints.optional")}
          error={errorOf("postalCode")}
          {...form.register("postalCode")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="address-country"
          autoComplete="country"
          label={t("fields.country")}
          hint={t("hints.country")}
          error={errorOf("country")}
          {...form.register("country")}
        />
        <TextField
          id="address-phone"
          type="tel"
          autoComplete="tel"
          label={t("fields.phone")}
          hint={t("hints.optional")}
          error={errorOf("phone")}
          {...form.register("phone")}
        />
      </div>

      <CheckboxField
        id="address-is-default"
        label={t("fields.isDefault")}
        {...form.register("isDefault")}
      />

      <div className="flex flex-wrap gap-2">
        <SubmitButton
          pending={pending}
          label={t("actions.save")}
          pendingLabel={t("actions.working")}
        />
        <Button type="button" variant="ghost" size="lg" onClick={onCancel}>
          {t("actions.cancel")}
        </Button>
      </div>
    </form>
  );
}
