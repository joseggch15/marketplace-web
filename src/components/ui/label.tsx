import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cn } from "cn";

/**
 * Etiqueta de formulario (shadcn/ui).
 *
 * `Label.Root` de Radix asocia la etiqueta al campo y la hace clicable, y añade el comportamiento correcto
 * cuando el campo está deshabilitado.
 */
function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
