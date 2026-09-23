"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ErrorNotice, SuccessNotice } from "@/components/domain/notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClientResult } from "@/lib/api/bff-client";
import { useRouter } from "@/i18n/navigation";

import {
  useApproveStore,
  useQuestionVisibility,
  useRejectStore,
  useRestoreStore,
  useReviewVisibility,
  useSuspendStore,
} from "../hooks";
import { MAX_REASON_LENGTH } from "../types";

/**
 * Acciones de moderación (aprobar, rechazar, suspender, reactivar, ocultar y publicar).
 *
 * Un solo componente para las cuatro pantallas del panel: son los mismos endpoints y el mismo ritual (llamar,
 * traducir el error por su `code` y refrescar). Los textos llegan **ya traducidos** como props, así el componente
 * no depende de un espacio de mensajes concreto.
 *
 * El **motivo** es opcional (así lo acepta la API) y se pide una sola vez para el botón que se pulse: queda en el
 * libro de auditoría del backend junto con quién lo hizo. No se inventa ningún motivo por defecto.
 *
 * Lo que no tiene sentido no se ofrece: aprobar una tienda ya aprobada, suspender una suspendida o publicar una
 * pregunta que ya está publicada. El backend lo rechazaría y es mejor no dibujar ese botón.
 */

export type ModerationKind =
  | "approve"
  | "reject"
  | "suspend"
  | "restore"
  | "hideReview"
  | "publishReview"
  | "hideQuestion"
  | "publishQuestion";

/** Etiqueta y estilo de cada acción: se derivan del **tipo**, así la pantalla solo dice qué acciones ofrece. */
const ACTION_STYLES: Record<ModerationKind, { variant: "default" | "outline" | "destructive" }> = {
  approve: { variant: "default" },
  reject: { variant: "destructive" },
  suspend: { variant: "destructive" },
  restore: { variant: "default" },
  hideReview: { variant: "outline" },
  publishReview: { variant: "outline" },
  hideQuestion: { variant: "outline" },
  publishQuestion: { variant: "outline" },
};

/** Acciones cuyo motivo se guarda en la auditoría del backend. */
const REASON_KINDS: ModerationKind[] = [
  "suspend",
  "restore",
  "hideReview",
  "publishReview",
  "hideQuestion",
  "publishQuestion",
];

/** Acciones que no se deshacen con un clic: piden confirmación (el segundo clic ejecuta). */
const CONFIRM_KINDS: ModerationKind[] = ["reject", "suspend", "hideReview", "hideQuestion"];

/**
 * Códigos de error que este panel sabe explicar (existen en `Admin.errors.*`).
 *
 * La lista es propia del panel **a propósito**: los códigos de moderación (`review_not_found`,
 * `question_not_found`…) no significan nada en las pantallas de compra o de vendedor, así que no se mezclan con
 * las suyas. Lo que no está aquí se cuenta como `unknown`, sin enseñar nunca un código crudo.
 */
const ADMIN_ERROR_CODES = [
  "forbidden",
  "unauthorized",
  "not_found",
  "store_not_found",
  "review_not_found",
  "question_not_found",
  "invalid_store_status",
  "store_already_exists",
  "store_not_approved",
  "seller_required",
  "validation_error",
  "too_many_requests",
  "internal_error",
  "network_error",
  "unknown",
] as const;

function adminErrorKey(code: string): (typeof ADMIN_ERROR_CODES)[number] {
  return (ADMIN_ERROR_CODES as readonly string[]).includes(code)
    ? (code as (typeof ADMIN_ERROR_CODES)[number])
    : "unknown";
}

export function ModerationActions({
  targetId,
  kinds,
}: {
  /** Identificador de la tienda, la reseña o la pregunta sobre la que se actúa. */
  targetId: string;
  /** Acciones que se ofrecen: solo las que tienen sentido para el estado actual. */
  kinds: ModerationKind[];
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const approve = useApproveStore();
  const reject = useRejectStore();
  const suspend = useSuspendStore();
  const restore = useRestoreStore();
  const review = useReviewVisibility();
  const question = useQuestionVisibility();

  const [reason, setReason] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<ModerationKind | null>(null);

  const pending =
    approve.isPending ||
    reject.isPending ||
    suspend.isPending ||
    restore.isPending ||
    review.isPending ||
    question.isPending;

  const needsReason = kinds.some((kind) => REASON_KINDS.includes(kind));
  const reasonValue = reason.trim().length === 0 ? null : reason.trim();

  /** Texto del botón cuando pide confirmación (solo lo tienen las acciones destructivas). */
  function confirmLabelFor(kind: ModerationKind): string {
    switch (kind) {
      case "reject":
        return t("actions.confirm.reject");
      case "suspend":
        return t("actions.confirm.suspend");
      case "hideReview":
        return t("actions.confirm.hideReview");
      case "hideQuestion":
        return t("actions.confirm.hideQuestion");
      default:
        return t(`actions.${kind}`);
    }
  }

  /** Traduce el error por su `code` estable; la lista de códigos que conoce el panel está aquí abajo. */
  function errorMessage(code: string): string {
    return t(`errors.${adminErrorKey(code)}`);
  }

  /** Llama a la acción pedida y devuelve su resultado tal cual (nunca lanza). */
  function call(kind: ModerationKind): Promise<ClientResult<unknown>> {
    switch (kind) {
      case "approve":
        return approve.mutateAsync(targetId);
      case "reject":
        return reject.mutateAsync(targetId);
      case "suspend":
        return suspend.mutateAsync({ storeId: targetId, reason: reasonValue });
      case "restore":
        return restore.mutateAsync({ storeId: targetId, reason: reasonValue });
      case "hideReview":
        return review.mutateAsync({ reviewId: targetId, published: false, reason: reasonValue });
      case "publishReview":
        return review.mutateAsync({ reviewId: targetId, published: true, reason: reasonValue });
      case "hideQuestion":
        return question.mutateAsync({
          questionId: targetId,
          published: false,
          reason: reasonValue,
        });
      case "publishQuestion":
        return question.mutateAsync({
          questionId: targetId,
          published: true,
          reason: reasonValue,
        });
    }
  }

  async function run(kind: ModerationKind) {
    setFailure(null);
    setDone(null);
    const result = await call(kind);

    if (!result.ok) {
      setFailure(errorMessage(result.code));
      setConfirming(null);
      return;
    }

    setDone(t("moderation.done"));
    setConfirming(null);
    setReason("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {failure === null ? null : <ErrorNotice message={failure} />}
      {done === null ? null : <SuccessNotice message={done} />}

      {needsReason ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`reason-${targetId}`}>{t("moderation.reason")}</Label>
          <Input
            id={`reason-${targetId}`}
            value={reason}
            maxLength={MAX_REASON_LENGTH}
            placeholder={t("moderation.reasonHint")}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {kinds.map((kind) => {
          const armed = confirming === kind && CONFIRM_KINDS.includes(kind);

          return (
            <Button
              key={kind}
              type="button"
              size="sm"
              variant={ACTION_STYLES[kind].variant}
              disabled={pending}
              onClick={() => {
                if (!CONFIRM_KINDS.includes(kind) || armed) {
                  void run(kind);
                  return;
                }

                setConfirming(kind);
              }}
            >
              {pending && confirming === kind ? (
                <Loader2 aria-hidden className="animate-spin" />
              ) : null}
              {armed ? confirmLabelFor(kind) : t(`actions.${kind}`)}
            </Button>
          );
        })}
      </div>

      {pending ? (
        <p role="status" className="text-xs text-muted-foreground">
          {t("moderation.working")}
        </p>
      ) : null}
    </div>
  );
}
