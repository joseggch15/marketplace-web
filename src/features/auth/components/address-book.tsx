"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { authErrorMessageKey, type KnownAuthErrorCode } from "../error-codes";
import { useAddresses, useDeleteAddress, useSaveAddress } from "../hooks";
import { addressSchema, asValidationKey, type AddressValues } from "../schemas";
import type { Address } from "../types";
import { AddressForm } from "./address-form";
import { FormAlert } from "./fields";

/**
 * Libreta de direcciones del usuario.
 *
 * Todo ocurre en esta pantalla: la lista, el formulario de alta y el de edición, y el borrado con
 * confirmación en línea (sin ventanas emergentes, que son difíciles de usar con teclado y con lectores de
 * pantalla). Al guardar, TanStack Query invalida la lista y se vuelve a pedir sola.
 */

const EMPTY_ADDRESS: AddressValues = {
  label: "",
  recipientName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "CO",
  phone: "",
  isDefault: false,
};

/** Convierte una dirección de la API en los valores del formulario. */
function toValues(address: Address): AddressValues {
  return {
    label: address.label,
    recipientName: address.recipient_name,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state ?? "",
    postalCode: address.postal_code ?? "",
    country: address.country,
    phone: address.phone ?? "",
    isDefault: address.is_default,
  };
}

export function AddressBook() {
  const t = useTranslations("Auth");
  const { addresses, loading, failed } = useAddresses();
  const save = useSaveAddress();
  const remove = useDeleteAddress();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [failure, setFailure] = useState<KnownAuthErrorCode | "unknown" | "network_error" | null>(
    null,
  );

  const form = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: EMPTY_ADDRESS,
  });

  const errorOf = (field: keyof AddressValues) => {
    const message = form.formState.errors[field]?.message;
    return typeof message === "string" ? asValidationKey(message) : undefined;
  };

  const openNew = () => {
    setEditingId(null);
    setFailure(null);
    form.reset(EMPTY_ADDRESS);
    setFormOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditingId(address.id);
    setFailure(null);
    form.reset(toValues(address));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFailure(null);
    form.reset(EMPTY_ADDRESS);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(null);
    const result = await save.mutateAsync({
      addressId: editingId ?? undefined,
      values,
    });

    if (!result.ok) {
      setFailure(authErrorMessageKey(result.code));
      return;
    }

    closeForm();
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (formOpen) {
    return (
      <div className="flex flex-col gap-4">
        <AddressForm
          form={form}
          errorOf={errorOf}
          failure={failure}
          editing={editingId !== null}
          pending={form.formState.isSubmitting}
          onSubmit={onSubmit}
          onCancel={closeForm}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {failed ? <FormAlert code="unknown" /> : null}

      {addresses.length === 0 ? (
        <p className="text-muted-foreground">{t("account.noAddresses")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex gap-3">
                <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="flex flex-col gap-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {address.label}
                    {address.is_default ? (
                      <Badge variant="secondary">{t("account.defaultBadge")}</Badge>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.recipient_name} · {address.line1}
                    {address.line2 !== null && address.line2.length > 0
                      ? `, ${address.line2}`
                      : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.city}
                    {address.state !== null ? `, ${address.state}` : ""} · {address.country}
                    {address.postal_code !== null ? ` · ${address.postal_code}` : ""}
                  </p>
                  {address.phone !== null && address.phone.length > 0 ? (
                    <p className="text-sm text-muted-foreground">{address.phone}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(address)}
                >
                  <Pencil aria-hidden />
                  {t("actions.editAddress")}
                </Button>

                {confirmingId === address.id ? (
                  <>
                    <span className="text-sm">{t("actions.confirmDelete")}</span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={remove.isPending}
                      onClick={() => {
                        void remove.mutateAsync(address.id).then(() => setConfirmingId(null));
                      }}
                    >
                      <Trash2 aria-hidden />
                      {t("actions.deleteAddress")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmingId(null)}
                    >
                      {t("actions.cancel")}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmingId(address.id)}
                  >
                    <Trash2 aria-hidden />
                    {t("actions.deleteAddress")}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" variant="outline" size="lg" className="sm:w-fit" onClick={openNew}>
        <Plus aria-hidden />
        {t("actions.addAddress")}
      </Button>
    </div>
  );
}
