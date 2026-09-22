"use client";

import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Link } from "@/i18n/navigation";

import { useResendVerification, useVerifyEmail } from "../hooks";
import { FormAlert, FormSuccess, SubmitButton, TextField } from "./fields";

/**
 * Panel de verificación del correo.
 *
 * El enlace del correo llega con `?token=...`. La comprobación se hace **una sola vez** al abrir la página
 * (se guarda en un `ref` para que un re-render no la repita: los tokens son de un solo uso y repetir la
 * llamada daría `invalid_token`).
 *
 * Si el token no vale, se ofrece pedir otro enlace escribiendo el correo.
 */
export function VerifyEmailPanel({ token }: { token: string }) {
  const t = useTranslations("Auth");
  const verify = useVerifyEmail();
  const resend = useResendVerification();
  const started = useRef(false);
  // Sin token el resultado ya se sabe desde el primer render: así el efecto no tiene que actualizar estado
  // de forma sincrónica (React lo desaconseja porque provoca renders en cascada).
  const [state, setState] = useState<"pending" | "done" | "failed">(
    token.length === 0 ? "failed" : "pending",
  );
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (started.current || token.length === 0) {
      return;
    }

    started.current = true;

    void verify
      .mutateAsync(token)
      .then((result) => setState(result.ok ? "done" : "failed"))
      .catch(() => setState("failed"));
  }, [token, verify]);

  if (state === "pending") {
    return (
      <p role="status" className="flex items-center gap-2 text-muted-foreground">
        <Loader2 aria-hidden className="animate-spin" />
        {t("verifyPending")}
      </p>
    );
  }

  if (state === "done") {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="flex items-center gap-2 text-sm">
          <CheckCircle2 aria-hidden className="text-brand-success-strong size-5" />
          {t("verifySuccess")}
        </p>
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
    <div className="flex flex-col gap-4">
      <p role="alert" className="flex items-center gap-2 text-sm text-danger-text">
        <AlertTriangle aria-hidden className="size-5" />
        {t("verifyError")}
      </p>

      {resent ? (
        <FormSuccess>{t("verifyResent")}</FormSuccess>
      ) : (
        <form
          className="flex flex-col gap-3"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void resend.mutateAsync(email).then((result) => {
              if (result.ok) {
                setResent(true);
              }
            });
          }}
        >
          <TextField
            id="verify-email-resend"
            type="email"
            autoComplete="email"
            label={t("fields.email")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <SubmitButton
            pending={resend.isPending}
            label={t("verifyResend")}
            pendingLabel={t("actions.working")}
            className="sm:w-fit"
          />
        </form>
      )}

      <FormAlert code="invalid_token" />
      <Link
        href="/login"
        className="text-sm text-primary underline-offset-4 hover:underline sm:w-fit"
      >
        {t("actions.backToLogin")}
      </Link>
    </div>
  );
}
