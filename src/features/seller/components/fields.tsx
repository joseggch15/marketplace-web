"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { asSellerValidationKey } from "../schemas";

/**
 * Campos del panel del vendedor.
 *
 * Los formularios de la F2 (`features/auth/components/fields.tsx`) traducen sus errores desde el espacio `Auth`;
 * los del panel tienen el suyo (`Seller.validation.*`) porque sus reglas son otras (dinero decimal, unidades de
 * stock, número de variantes). En vez de duplicar el componente entero, aquí vive la versión del panel: misma
 * accesibilidad (etiqueta asociada, `aria-invalid`, aviso con `role="alert"`) y la misma idea de que el mensaje
 * del esquema es una **clave de traducción**, no una frase.
 *
 * Los campos de dinero son `inputMode="decimal"` con `pattern` numérico: en el móvil sale el teclado numérico y
 * el navegador no "corrige" el valor por su cuenta. El importe viaja como texto decimal, nunca como número en
 * coma flotante.
 */

function FieldError({ id, message }: { id: string; message?: string }) {
  const t = useTranslations("Seller");

  if (message === undefined) {
    return null;
  }

  const key = asSellerValidationKey(message);

  return (
    <p id={id} role="alert" className="text-xs font-medium text-danger-text">
      {key === undefined ? t("validation.invalid") : t(`validation.${key}`)}
    </p>
  );
}

type SellerFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  registration: UseFormRegisterReturn;
  textarea?: boolean;
  /** Solo para el textarea: el número de filas visibles. */
  rows?: number;
} & Omit<React.ComponentProps<typeof Input>, "id" | "rows">;

export function SellerField({
  id,
  label,
  hint,
  error,
  registration,
  textarea = false,
  rows,
  className,
  ...rest
}: SellerFieldProps) {
  const hintId = hint === undefined ? undefined : `${id}-hint`;
  const errorId = error === undefined ? undefined : `${id}-error`;
  const describedBy = [hintId, errorId].filter((value) => value !== undefined).join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>

      {textarea ? (
        <Textarea
          id={id}
          rows={rows}
          aria-invalid={error !== undefined}
          aria-describedby={describedBy.length > 0 ? describedBy : undefined}
          className={className}
          {...registration}
          {...(rest as React.ComponentProps<typeof Textarea>)}
        />
      ) : (
        <Input
          id={id}
          aria-invalid={error !== undefined}
          aria-describedby={describedBy.length > 0 ? describedBy : undefined}
          className={className}
          {...registration}
          {...rest}
        />
      )}

      {hintId === undefined ? null : (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

/**
 * Campo de texto **controlado** del panel (por ejemplo, los valores de un atributo de categoría).
 *
 * Los campos que van dentro de un formulario de React Hook Form usan `SellerField` con `register`; este existe
 * para los valores que el componente del formulario guarda en su propio estado (los atributos de la categoría
 * elegida, que no son campos fijos del esquema).
 */
export function SellerValuesField({
  id,
  label,
  hint,
  error,
  value,
  placeholder,
  maxLength,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  value: string;
  placeholder?: string;
  maxLength?: number;
  onChange: (value: string) => void;
}) {
  const hintId = hint === undefined ? undefined : `${id}-hint`;
  const errorId = error === undefined ? undefined : `${id}-error`;
  const describedBy = [hintId, errorId].filter((item) => item !== undefined).join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy.length > 0 ? describedBy : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {hintId === undefined ? null : (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

/** Selector nativo: en el móvil se abre la rueda del sistema y funciona con teclado sin código extra. */
export function SellerSelect({
  id,
  label,
  hint,
  error,
  children,
  className,
  ...rest
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
} & React.ComponentProps<"select">) {
  const hintId = hint === undefined ? undefined : `${id}-hint`;
  const errorId = error === undefined ? undefined : `${id}-error`;
  const describedBy = [hintId, errorId].filter((value) => value !== undefined).join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy.length > 0 ? describedBy : undefined}
        className={cn(
          "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-invalid:border-destructive dark:bg-input/30",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {hintId === undefined ? null : (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

/** Botón de envío con estado «guardando» (deshabilitado y con indicador). */
export function SellerSubmit({
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
