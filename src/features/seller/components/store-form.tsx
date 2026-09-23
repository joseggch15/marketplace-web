"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ErrorNotice, SuccessNotice } from "@/components/domain/notice";
import { Link, useRouter } from "@/i18n/navigation";

import { sellerErrorKey } from "../error-codes";
import { useCreateStore, useUpdateStore } from "../hooks";
import { storeFormSchema } from "../schemas";
import type { StoreBody, StoreFormValues } from "../schemas";
import { SellerField, SellerSubmit } from "./fields";

/**
 * Formulario de la tienda: **abrirla** o corregir su nombre y su descripción.
 *
 * Es el primer paso para vender y pasa por la aprobación de un administrador (el backend responde `pending`),
 * así que la pantalla lo dice antes de enviar: nadie debería llevarse la sorpresa de que su tienda no se ve
 * todavía. Con la tienda ya creada el mismo formulario sirve para editarla y el estado no cambia por eso.
 *
 * Quién es el dueño lo decide el backend: `POST/PATCH /sellers/me` resuelve «mi tienda» por el token de la
 * sesión, no por un identificador que venga del navegador.
 */
export function StoreForm({
  mode,
  defaultName = "",
  defaultDescription = "",
}: {
  mode: "create" | "edit";
  defaultName?: string;
  defaultDescription?: string;
}) {
  const t = useTranslations("Seller");
  const router = useRouter();
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();
  const [failure, setFailure] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const form = useForm<StoreFormValues, unknown, StoreBody>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: { name: defaultName, description: defaultDescription },
  });

  const pending = createStore.isPending || updateStore.isPending;

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(null);
    setDone(false);

    const result =
      mode === "create"
        ? await createStore.mutateAsync(values)
        : await updateStore.mutateAsync(values);

    if (!result.ok) {
      setFailure(t(`errors.${sellerErrorKey(result.code)}`));
      return;
    }

    setDone(true);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {failure === null ? null : <ErrorNotice message={failure} />}
      {done ? (
        <SuccessNotice message={mode === "create" ? t("store.created") : t("store.saved")} />
      ) : null}

      <SellerField
        id="store-name"
        label={t("store.name")}
        hint={t("store.nameHint")}
        error={form.formState.errors.name?.message}
        registration={form.register("name")}
        maxLength={120}
        placeholder={t("store.namePlaceholder")}
      />

      <SellerField
        id="store-description"
        label={t("store.description")}
        hint={t("store.descriptionHint")}
        error={form.formState.errors.description?.message}
        registration={form.register("description")}
        textarea
        rows={4}
        maxLength={500}
        placeholder={t("store.descriptionPlaceholder")}
      />

      <SellerSubmit
        pending={pending}
        label={mode === "create" ? t("store.create") : t("store.edit")}
        pendingLabel={t("store.working")}
        className="sm:w-fit"
      />

      {mode === "create" ? (
        <p className="text-xs text-muted-foreground">{t("store.createHint")}</p>
      ) : (
        <Link
          href="/seller"
          className="w-fit text-sm text-primary underline-offset-4 hover:underline"
        >
          {t("nav.dashboard")}
        </Link>
      )}
    </form>
  );
}
