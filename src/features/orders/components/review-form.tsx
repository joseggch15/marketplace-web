"use client";

import { Loader2, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { orderErrorKey } from "../error-codes";
import { useCreateReview } from "../hooks";
import { ErrorNotice, SuccessNotice } from "./notice";

/**
 * Reseña de un producto recibido.
 *
 * Reglas que marca el backend (y que se reflejan aquí sin inventar nada):
 * - Solo se puede reseñar un producto **entregado** (`purchase_required`): la página solo ofrece el formulario
 *   cuando la sub-orden del vendedor está `delivered`.
 * - Una reseña por producto (`review_exists`): la página ya consulta qué productos reseñó el usuario.
 * - La nota va de 1 a 5 y el texto es opcional (así lo acepta la API).
 *
 * El campo de puntuación es un grupo de radios de verdad (un control por estrella), con etiquetas accesibles: se
 * puede elegir con el teclado y no depende del color.
 */
export function ReviewForm({
  productId,
  productTitle,
}: {
  productId: string;
  productTitle: string;
}) {
  const t = useTranslations("Orders");
  const createReview = useCreateReview();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return <SuccessNotice message={t("review.done")} />;
  }

  async function submit() {
    setFailure(null);
    const result = await createReview.mutateAsync({
      product_id: productId,
      rating,
      title: title.trim().length > 0 ? title : null,
      body: body.trim().length > 0 ? body : null,
    });

    if (!result.ok) {
      setFailure(t(`errors.${orderErrorKey(result.code)}`));
      return;
    }

    setDone(true);
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-3 rounded-lg border border-border p-3"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="font-heading text-sm font-semibold">
        {t("review.title", { product: productTitle })}
      </p>

      {failure === null ? null : <ErrorNotice message={failure} />}

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium">{t("review.rating")}</legend>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 has-checked:bg-brand-surface"
            >
              <input
                type="radio"
                name={`review-rating-${productId}`}
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              <Star
                aria-hidden
                className={cn(
                  "size-5",
                  value <= rating ? "fill-brand text-brand" : "fill-transparent text-border",
                )}
              />
              <span className="sr-only">{t("review.ratingOption", { value })}</span>
            </label>
          ))}
          <span aria-hidden className="ml-2 text-sm text-muted-foreground">
            {rating}/5
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{t("review.ratingHint")}</p>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`review-title-${productId}`}>{t("review.titleField")}</Label>
        <Input
          id={`review-title-${productId}`}
          value={title}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`review-body-${productId}`}>{t("review.bodyField")}</Label>
        <Textarea
          id={`review-body-${productId}`}
          value={body}
          rows={3}
          maxLength={2000}
          placeholder={t("review.bodyPlaceholder")}
          onChange={(event) => setBody(event.target.value)}
        />
      </div>

      <Button type="submit" size="lg" className="w-fit" disabled={createReview.isPending}>
        {createReview.isPending ? (
          <>
            <Loader2 aria-hidden className="animate-spin" />
            {t("review.pending")}
          </>
        ) : (
          t("review.submit")
        )}
      </Button>
    </form>
  );
}
