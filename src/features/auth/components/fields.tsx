"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { KnownAuthErrorCode } from "../error-codes";
import type { ValidationKey } from "../schemas";

/**
 * Campos de formulario compartidos por toda la F2.
 *
 * Todo lo que se repite vive aquí y no en cada formulario: la etiqueta asociada al campo, el aviso de error
 * con `aria-invalid` y `role="alert"` (para que un lector de pantalla lo anuncie), el botón de mostrar la
 * contraseña y el estado "guardando" del botón de envío.
 *
 * Los textos de las etiquetas llegan **ya traducidos** por el formulario que las usa; los mensajes de
 * validación y de error se traducen aquí a partir de su clave, porque son los mismos en toda la aplicación.
 */

type FieldShellProps = {
  id: string;
  label: string;
  hint?: string;
  error?: ValidationKey;
  children: React.ReactNode;
};

/** Descripción del campo: ayuda y error, con los identificadores que usa `aria-describedby`. */
function describedBy(id: string, hint?: string, error?: ValidationKey): string | undefined {
  const parts = [
    hint === undefined ? null : `${id}-hint`,
    error === undefined ? null : `${id}-error`,
  ].filter((value): value is string => value !== null);

  return parts.length > 0 ? parts.join(" ") : undefined;
}

/** Etiqueta, campo, ayuda y error con las relaciones ARIA correctas. */
function FieldShell({ id, label, hint, error, children }: FieldShellProps) {
  const t = useTranslations("Auth");

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint !== undefined ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error !== undefined ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger-text">
          {t(`validation.${error}`)}
        </p>
      ) : null}
    </div>
  );
}

export type TextFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: ValidationKey;
} & React.ComponentProps<typeof Input>;

export function TextField({ id, label, hint, error, ...inputProps }: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <Input
        id={id}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...inputProps}
      />
    </FieldShell>
  );
}

/** Campo de contraseña con botón para mostrarla u ocultarla. */
export function PasswordField({ id, label, hint, error, ...inputProps }: TextFieldProps) {
  const t = useTranslations("Auth");
  const [visible, setVisible] = React.useState(false);

  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          className="pr-10"
          aria-invalid={error !== undefined}
          aria-describedby={describedBy(id, hint, error)}
          {...inputProps}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1 right-1"
          aria-label={visible ? t("actions.hidePassword") : t("actions.showPassword")}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </Button>
      </div>
    </FieldShell>
  );
}

export type TextAreaFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: ValidationKey;
} & React.ComponentProps<typeof Textarea>;

export function TextAreaField({ id, label, hint, error, ...textareaProps }: TextAreaFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <Textarea
        id={id}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...textareaProps}
      />
    </FieldShell>
  );
}

/** Casilla de verificación con etiqueta clicable (por ejemplo, "dirección predeterminada"). */
export function CheckboxField({
  id,
  label,
  ...inputProps
}: { id: string; label: string } & React.ComponentProps<"input">) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        className="size-4 rounded border-input accent-primary focus-visible:ring-3 focus-visible:ring-ring/50"
        {...inputProps}
      />
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
    </div>
  );
}

/** Aviso de error del servidor, traducido por el `code` estable de la API. */
export function FormAlert({ code }: { code: KnownAuthErrorCode | "unknown" | "network_error" }) {
  const t = useTranslations("Auth");

  return (
    <p
      role="alert"
      className="rounded-lg border border-danger-text/30 bg-danger-surface px-3 py-2 text-sm text-danger-text"
    >
      {code === "network_error" ? t("errors.network_error") : t(`errors.${code}`)}
    </p>
  );
}

/** Botón de envío con estado "guardando" (deshabilitado y con indicador). */
export function SubmitButton({
  label,
  pendingLabel,
  pending,
  className,
}: {
  label: string;
  pendingLabel: string;
  pending: boolean;
  className?: string;
}) {
  return (
    <Button type="submit" size="lg" className={className} disabled={pending}>
      {pending ? (
        <>
          <Loader2 aria-hidden className="animate-spin" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}

/** Aviso de éxito (por ejemplo, después de pedir el enlace de recuperación). */
export function FormSuccess({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-lg border border-brand-success/40 bg-brand-success/10 px-3 py-2 text-sm"
    >
      {children}
    </p>
  );
}
