"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ErrorNotice, SuccessNotice } from "@/components/domain/notice";
import { useRouter } from "@/i18n/navigation";

import { sellerErrorKey } from "../error-codes";
import { useUpdateProduct } from "../hooks";
import { productUpdateSchema, type ProductUpdateValues } from "../schemas";
import { SellerField, SellerSubmit } from "./fields";

/**
 * Editar título, descripción y marca de un producto propio.
 *
 * Comprobación honesta de límites: la API (`ProductUpdate`) **no** admite cambiar el precio ni las variantes —
 * cambiar el precio exigiría crear una variante nueva y la ficha de cada presentación tiene su propio precio.
 * Así que el precio se muestra en solo lectura (con una nota) y el stock tiene su propio formulario, que sí
 * tiene endpoint. Preferimos decir qué no se puede hacer antes que ofrecer un campo que el servidor ignore.
 */
export function ProductDetailsForm({
  productId,
  defaultTitle,
  defaultDescription,
  defaultBrand,
}: {
  productId: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultBrand: string;
}) {
  const t = useTranslations("Seller");
  const router = useRouter();
  const updateProduct = useUpdateProduct(productId);
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm<ProductUpdateValues>({
    resolver: zodResolver(productUpdateSchema),
    defaultValues: {
      title: defaultTitle,
      description: defaultDescription,
      brand: defaultBrand,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(null);
    setSaved(false);

    const result = await updateProduct.mutateAsync(values);

    if (!result.ok) {
      setFailure(t(`errors.${sellerErrorKey(result.code)}`));
      return;
    }

    setSaved(true);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {failure === null ? null : <ErrorNotice message={failure} />}
      {saved ? <SuccessNotice message={t("details.saved")} /> : null}

      <SellerField
        id="details-title"
        label={t("product.fields.title")}
        error={form.formState.errors.title?.message}
        registration={form.register("title")}
        maxLength={200}
      />

      <SellerField
        id="details-brand"
        label={t("product.fields.brand")}
        hint={t("product.fields.brandHint")}
        error={form.formState.errors.brand?.message}
        registration={form.register("brand")}
        maxLength={120}
      />

      <SellerField
        id="details-description"
        label={t("product.fields.description")}
        error={form.formState.errors.description?.message}
        registration={form.register("description")}
        textarea
        rows={5}
        maxLength={2000}
      />

      <p className="text-xs text-muted-foreground">{t("details.priceReadOnly")}</p>

      <SellerSubmit
        pending={updateProduct.isPending}
        label={t("details.save")}
        pendingLabel={t("details.saving")}
        className="sm:w-fit"
      />
    </form>
  );
}
