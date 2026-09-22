"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { questionErrorMessageKey, type KnownQuestionErrorCode } from "../error-codes";
import { useAskQuestion } from "../hooks";
import { asQuestionValidationKey, askQuestionSchema, type AskQuestionValues } from "../schemas";

/**
 * Formulario para preguntar por el producto (solo se muestra con sesión abierta).
 *
 * - Valida en el navegador con Zod (mismos límites que el backend) y vuelve a validar en la ruta BFF: el
 *   servidor no se fía nunca del cliente.
 * - El envío pasa por `/api/products/{id}/questions` (patrón BFF): la sesión viaja en cookies httpOnly y el
 *   navegador no ve ningún token.
 * - El backend limita la frecuencia de publicación (`too_many_requests`) y ese error se traduce.
 *
 * Estados: normal · error de validación · enviando (botón deshabilitado) · error del servidor · éxito.
 */
export function QuestionForm({ productId }: { productId: string }) {
  const t = useTranslations("Product");
  const [failure, setFailure] = useState<
    KnownQuestionErrorCode | "unknown" | "network_error" | null
  >(null);
  const [succeeded, setSucceeded] = useState(false);
  const askQuestion = useAskQuestion(productId);

  const form = useForm<AskQuestionValues>({
    resolver: zodResolver(askQuestionSchema),
    defaultValues: { body: "" },
  });

  const errorKey = asQuestionValidationKey(form.formState.errors.body?.message);

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(null);
    setSucceeded(false);

    const result = await askQuestion.mutateAsync(values);

    if (!result.ok) {
      setFailure(questionErrorMessageKey(result.code));
      return;
    }

    setSucceeded(true);
    form.reset();
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-3 border-t border-border pt-4"
    >
      {failure !== null ? (
        <p
          role="alert"
          className="rounded-lg border border-danger-text/30 bg-danger-surface px-3 py-2 text-sm text-danger-text"
        >
          {t(`errors.${failure}`)}
        </p>
      ) : null}

      {succeeded ? (
        <p
          role="status"
          className="border-brand-success/40 bg-brand-success/10 rounded-lg border px-3 py-2 text-sm"
        >
          {t("questions.success")}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="question-body">{t("questions.formLabel")}</Label>
        <Textarea
          id="question-body"
          rows={3}
          placeholder={t("questions.formPlaceholder")}
          aria-invalid={errorKey !== undefined}
          aria-describedby={
            errorKey === undefined ? "question-body-hint" : "question-body-hint question-body-error"
          }
          {...form.register("body")}
        />
        <p id="question-body-hint" className="text-xs text-muted-foreground">
          {t("questions.formHint")}
        </p>
        {errorKey !== undefined ? (
          <p id="question-body-error" role="alert" className="text-xs font-medium text-danger-text">
            {t(`validation.${errorKey}`)}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full sm:w-fit"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <>
            <Loader2 aria-hidden className="animate-spin" />
            {t("questions.submitPending")}
          </>
        ) : (
          t("questions.submit")
        )}
      </Button>
    </form>
  );
}
