"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ErrorNotice } from "@/components/domain/notice";
import { useRouter } from "@/i18n/navigation";
import { formatMoney } from "@/lib/format/money";

import { sellerErrorKey } from "../error-codes";
import { useCategoryAttributes, useCreateProduct } from "../hooks";
import { productFieldsSchema, toAttributeValues } from "../schemas";
import type { ProductFieldsData, ProductFieldsInput, SellerValidationKey } from "../schemas";
import { buildVariants, countCombinations } from "../variants";
import { SellerField, SellerSelect, SellerSubmit, SellerValuesField } from "./fields";

/**
 * Alta de un producto con sus variantes.
 *
 * Cómo piensa el vendedor y cómo lo traduce la pantalla:
 * 1. Elige la **categoría**; de ahí salen los atributos que admite (color, talla…) y se cargan al momento.
 * 2. Escribe los **valores** de esos atributos («Rojo, Azul»), el precio y el stock, que valen igual para todas
 *    las variantes (en el prototipo no hay precio por presentación).
 * 3. La pantalla enseña **cuántas variantes se van a crear** y sus SKU antes de enviar nada: el producto
 *    cartesiano se calcula en el navegador con las mismas funciones probadas (`variants.ts`) y el servidor lo
 *    vuelve a calcular, que es quien manda la lista definitiva a la API.
 *
 * El producto nace en **borrador**: publicarlo es un paso aparte, así nadie publica una ficha a medias.
 */

export type CategoryOption = { id: string; name: string };

/** Tope de variantes del formulario: el mismo que valida el esquema compartido con el servidor. */
const MAX_VARIANTS = 100;

export function ProductForm({
  categories,
  locale,
  currency,
}: {
  categories: CategoryOption[];
  locale: string;
  currency: string;
}) {
  const t = useTranslations("Seller");
  const router = useRouter();
  const createProduct = useCreateProduct();
  const [failure, setFailure] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [attributesError, setAttributesError] = useState<SellerValidationKey | null>(null);

  const form = useForm<ProductFieldsInput, unknown, ProductFieldsData>({
    resolver: zodResolver(productFieldsSchema),
    defaultValues: {
      title: "",
      description: "",
      brand: "",
      categoryId: categories.length > 0 ? categories[0].id : "",
      skuPrefix: "",
      price: "",
      stock: 1,
    },
  });

  // `useWatch` y no `form.watch`: es la API que React Compiler entiende, así que no desactiva la optimización
  // del componente (React lo advierte cuando se leen valores con `watch`).
  const categoryId = useWatch({ control: form.control, name: "categoryId" });
  const price = useWatch({ control: form.control, name: "price" });
  const stock = useWatch({ control: form.control, name: "stock" });
  const skuPrefix = useWatch({ control: form.control, name: "skuPrefix" });
  const title = useWatch({ control: form.control, name: "title" });
  const category = useCategoryAttributes(
    categoryId !== undefined && categoryId.length > 0 ? categoryId : null,
  );

  // Los valores que el vendedor escribió son los de **los atributos de la categoría elegida**, y se derivan en
  // cada render en lugar de sincronizarse con un efecto: así cambiar de categoría no necesita ningún estado
  // intermedio (los valores de otra categoría simplemente no se leen).
  const attributes = category.attributes.map((attribute) => ({
    attributeId: attribute.attribute_id,
    valuesText: values[attribute.attribute_id] ?? "",
  }));

  const combinations = countCombinations(toAttributeValues(attributes));

  // El stock del formulario es un campo que Zod **convierte** a número (`z.coerce.number()`), así que mientras
  // se escribe llega como valor sin convertir: aquí se normaliza para la vista previa, sin inventar nada.
  const stockValue = typeof stock === "number" ? stock : Number(stock);
  const previewStock = Number.isFinite(stockValue) ? stockValue : 0;

  const preview = buildVariants({
    attributes: toAttributeValues(attributes),
    price: price.length > 0 ? price : "0",
    stock: previewStock,
    skuPrefix: skuPrefix.length > 0 ? skuPrefix : title.length > 0 ? title : "PRODUCTO",
  });

  const priceLabel = formatMoney(price.length > 0 ? price : "0", currency, locale);

  // El registro del selector de categoría se envuelve para **limpiar el aviso de variantes** al cambiarla: es
  // una reacción al cambio del vendedor, no un estado sincronizado con un efecto.
  const categoryRegister = form.register("categoryId");

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(null);
    setAttributesError(null);

    if (combinations === 0) {
      setAttributesError("noVariants");
      return;
    }

    if (combinations > MAX_VARIANTS) {
      setAttributesError("tooManyVariants");
      return;
    }

    const result = await createProduct.mutateAsync({ ...values, attributes });

    if (!result.ok) {
      setFailure(t(`errors.${sellerErrorKey(result.code)}`));
      return;
    }

    router.push(`/seller/products/${result.data.product.id}`);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      {failure === null ? null : <ErrorNotice message={failure} />}

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold">{t("product.sectionBasics")}</h2>

        <SellerField
          id="product-title"
          label={t("product.fields.title")}
          error={form.formState.errors.title?.message}
          registration={form.register("title")}
          maxLength={200}
          placeholder={t("product.fields.titlePlaceholder")}
        />

        <SellerField
          id="product-brand"
          label={t("product.fields.brand")}
          hint={t("product.fields.brandHint")}
          error={form.formState.errors.brand?.message}
          registration={form.register("brand")}
          maxLength={120}
        />

        <SellerField
          id="product-description"
          label={t("product.fields.description")}
          error={form.formState.errors.description?.message}
          registration={form.register("description")}
          textarea
          rows={4}
          maxLength={2000}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold">{t("product.sectionVariants")}</h2>

        <SellerSelect
          id="product-category"
          label={t("product.fields.category")}
          hint={t("product.fields.categoryHint")}
          error={form.formState.errors.categoryId?.message}
          {...categoryRegister}
          onChange={(event) => {
            setAttributesError(null);
            void categoryRegister.onChange(event);
          }}
        >
          {categories.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </SellerSelect>

        {category.loading ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t("product.attributes.loading")}
          </p>
        ) : category.attributes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("product.attributes.none")}</p>
        ) : (
          <fieldset className="flex flex-col gap-4 rounded-xl border border-border p-4">
            <legend className="px-1 text-sm font-medium">{t("product.attributes.legend")}</legend>
            <p className="text-xs text-muted-foreground">{t("product.attributes.hint")}</p>

            {category.attributes.map((attribute) => (
              <SellerValuesField
                key={attribute.attribute_id}
                id={`product-attribute-${attribute.attribute_id}`}
                label={attribute.name}
                hint={attribute.is_required ? t("product.attributes.required") : undefined}
                error={attributesError === null ? undefined : t(`validation.${attributesError}`)}
                value={values[attribute.attribute_id] ?? ""}
                placeholder={t("product.attributes.valuesPlaceholder")}
                maxLength={300}
                onChange={(value) =>
                  setValues((current) => ({ ...current, [attribute.attribute_id]: value }))
                }
              />
            ))}
          </fieldset>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <SellerField
            id="product-price"
            label={t("product.fields.price")}
            hint={t("product.fields.priceHint")}
            error={form.formState.errors.price?.message}
            registration={form.register("price")}
            inputMode="decimal"
            placeholder={t("product.fields.pricePlaceholder")}
          />

          <SellerField
            id="product-stock"
            label={t("product.fields.stock")}
            hint={t("product.fields.stockHint")}
            error={form.formState.errors.stock?.message}
            registration={form.register("stock")}
            inputMode="numeric"
          />

          <SellerField
            id="product-sku"
            label={t("product.fields.skuPrefix")}
            hint={t("product.fields.skuPrefixHint")}
            error={form.formState.errors.skuPrefix?.message}
            registration={form.register("skuPrefix")}
            maxLength={24}
            placeholder={t("product.fields.skuPrefixPlaceholder")}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-brand/30 bg-brand-surface/40 p-4">
        <h2 className="font-heading text-base font-semibold">{t("product.preview.title")}</h2>

        {combinations === 0 ? (
          <p className="text-sm text-muted-foreground">{t("product.preview.none")}</p>
        ) : (
          <>
            <p className="text-sm">
              {t("product.preview.count", { count: combinations })}
              {priceLabel === null ? null : ` · ${priceLabel}`}
            </p>
            <ul className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {preview.slice(0, 8).map((variant) => (
                <li key={variant.sku} className="rounded-full border border-border px-2 py-0.5">
                  {variant.sku}
                </li>
              ))}
              {preview.length > 8 ? (
                <li className="px-1 py-0.5">
                  {t("product.preview.more", { count: preview.length - 8 })}
                </li>
              ) : null}
            </ul>
            <p className="text-xs text-muted-foreground">{t("product.preview.priceNote")}</p>
          </>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <SellerSubmit
          pending={createProduct.isPending}
          label={t("product.create")}
          pendingLabel={t("product.creating")}
        />
        <p className="text-xs text-muted-foreground">{t("product.draftHint")}</p>
      </div>
    </form>
  );
}
